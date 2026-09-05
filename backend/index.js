import express from 'express'
import multer from 'multer'
import fs from 'fs'
import crypto from 'crypto'
import zlib from 'zlib'
import { DatabaseSync } from 'node:sqlite'
import { pipeline } from 'stream/promises'

const app = express()
app.use((req, res, next) => {
  const origin = String(req.headers.origin || '')
  if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
fs.mkdirSync('tmp', { recursive: true })
const upload = multer({ dest: 'tmp/' })
const sessions = new Map()

function createDatabaseSession(databasePath) {
  const sessionId = crypto.randomUUID()
  const inspected = inspectDatabase(databasePath)
  const messages = inspected.messages(100, 0)
  const result = {
    sessionId,
    totalMessages: inspected.total,
    conversations: inspected.conversations,
    messages
  }
  inspected.close()
  sessions.set(sessionId, { path: databasePath, createdAt: Date.now() })
  return result
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function normalizeTimestamp(value) {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Date.now()
  return timestamp < 10000000000 ? timestamp * 1000 : timestamp
}

function inspectDatabase(databasePath) {
  const database = new DatabaseSync(databasePath, { readOnly: true })
  const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  const tableNames = tables.map(row => String(row.name))
  const messageTable = tableNames.find(name => /^(messages?|message_store|chat_messages?)$/i.test(name))
    ?? tableNames.find(name => /message/i.test(name))
  if (!messageTable) {
    database.close()
    throw new Error('No supported messages table was found in the decrypted database.')
  }

  const columns = database.prepare(`PRAGMA table_info(${quoteIdentifier(messageTable)})`).all().map(row => String(row.name))
  const findColumn = patterns => columns.find(column => patterns.some(pattern => pattern.test(column)))
  const idColumn = findColumn([/^_id$/i, /^id$/i, /key.*id/i])
  const conversationColumn = findColumn([/remote_jid/i, /chat_id/i, /conversation/i, /thread/i])
  const senderColumn = findColumn([/sender/i, /from/i, /author/i, /remote_resource/i])
  const timestampColumn = findColumn([/timestamp/i, /date/i, /time/i])
  const bodyColumn = findColumn([/^data$/i, /message/i, /text/i, /body/i])
  if (!conversationColumn || !bodyColumn) {
    database.close()
    throw new Error('The decrypted database schema is not supported.')
  }

  const total = Number(database.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(messageTable)}`).get().count)
  const rows = database.prepare(`
    SELECT
      ${quoteIdentifier(idColumn ?? conversationColumn)} AS message_id,
      ${quoteIdentifier(conversationColumn)} AS conversation_id,
      ${quoteIdentifier(bodyColumn)} AS message_body
      ${senderColumn ? `, ${quoteIdentifier(senderColumn)} AS sender_name` : ''}
      ${timestampColumn ? `, ${quoteIdentifier(timestampColumn)} AS message_timestamp` : ''}
    FROM ${quoteIdentifier(messageTable)}
    ORDER BY ${timestampColumn ? quoteIdentifier(timestampColumn) : quoteIdentifier(idColumn ?? conversationColumn)}
    LIMIT ? OFFSET ?
  `)
  const messages = (limit, offset) => rows.all(limit, offset).map(row => ({
    id: String(row.message_id),
    conversationId: String(row.conversation_id),
    senderName: row.sender_name == null ? undefined : String(row.sender_name),
    timestamp: normalizeTimestamp(row.message_timestamp),
    body: row.message_body == null ? '' : String(row.message_body),
    type: 'text',
    isOutgoing: false
  }))
  const conversations = database.prepare(`
    SELECT ${quoteIdentifier(conversationColumn)} AS id, COUNT(*) AS message_count
    FROM ${quoteIdentifier(messageTable)}
    GROUP BY ${quoteIdentifier(conversationColumn)}
    ORDER BY MAX(${timestampColumn ? quoteIdentifier(timestampColumn) : quoteIdentifier(idColumn ?? conversationColumn)}) DESC
  `).all().map(row => ({
    id: String(row.id),
    name: String(row.id),
    type: 'unknown',
    unreadCount: 0,
    messageCount: Number(row.message_count)
  }))
  return { total, messages, conversations, close: () => database.close() }
}

app.post('/api/import/encrypted-backup', upload.single('file'), async (req, res) => {
  let temporaryPath
  let decryptedPath
  try {
    const file = req.file
    const key = String(req.body.keyMaterial || '').replace(/\s/g, '')
    if (!file) return res.status(400).send('No file uploaded')
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      return res.status(400).send('Invalid key material format. Expected exactly 64 hexadecimal characters.')
    }

    temporaryPath = file.path
    const fileSize = fs.statSync(temporaryPath).size
    if (fileSize < 131) return res.status(400).send('Encrypted backup is too small or malformed.')
    const header = Buffer.alloc(24)
    const descriptor = fs.openSync(temporaryPath, 'r')
    try {
      fs.readSync(descriptor, header, 0, header.length, 0)
    } finally {
      fs.closeSync(descriptor)
    }

    const keyStream = Buffer.from(key, 'hex')
    const intermediateHmac = crypto.createHmac('sha256', Buffer.alloc(32)).update(keyStream).digest()
    const mainKey = crypto.createHmac('sha256', intermediateHmac).update(Buffer.from('backup encryption\x01')).digest()
    const iv = header.subarray(8, 24)
    const dbOffset = header[0] + 2
    const tagDescriptor = fs.openSync(temporaryPath, 'r')
    const tag = Buffer.alloc(16)
    try {
      fs.readSync(tagDescriptor, tag, 0, tag.length, fileSize - 32)
    } finally {
      fs.closeSync(tagDescriptor)
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', mainKey, iv)
    decipher.setAuthTag(tag)
    decryptedPath = `tmp/${crypto.randomUUID()}.db`
    await pipeline(
      fs.createReadStream(temporaryPath, { start: dbOffset, end: fileSize - 33 }),
      decipher,
      zlib.createInflate(),
      fs.createWriteStream(decryptedPath)
    )
    const sessionId = crypto.randomUUID()
    const sessionPath = `tmp/${sessionId}.db`
    fs.renameSync(decryptedPath, sessionPath)
    const inspected = inspectDatabase(sessionPath)
    const messages = inspected.messages(100, 0)
    inspected.close()
    sessions.set(sessionId, { path: sessionPath, createdAt: Date.now() })
    return res.json({
      sessionId,
      totalMessages: inspected.total,
      conversations: inspected.conversations,
      messages
    })

    app.post('/api/import/database', upload.single('file'), (req, res) => {
      const databasePath = req.file?.path
      try {
        if (!databasePath) return res.status(400).send('No database file uploaded.')
        return res.json(createDatabaseSession(databasePath))
      } catch (error) {
        if (databasePath) fs.rmSync(databasePath, { force: true })
        return res.status(422).send(error instanceof Error ? error.message : 'Database could not be opened.')
      }
    })
  } catch (error) {
    if (error?.code === 'Z_DATA_ERROR') {
      return res.status(422).send('Decryption succeeded, but the backup payload is corrupted.')
    }
    return res.status(422).send('Decryption failed. The key is incorrect or the backup is not compatible.')
  } finally {
    if (temporaryPath) fs.rmSync(temporaryPath, { force: true })
    if (decryptedPath && fs.existsSync(decryptedPath)) fs.rmSync(decryptedPath, { force: true })
  }
})

app.get('/api/import/session/:sessionId/messages', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Import session not found or expired.')
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500)
    const offset = Math.max(Number(req.query.offset) || 0, 0)
    const inspected = inspectDatabase(session.path)
    const messages = inspected.messages(limit, offset)
    inspected.close()
    return res.json({ totalMessages: inspected.total, messages })
  } catch {
    return res.status(500).send('Could not read the decrypted database.')
  }
})

setInterval(() => {
  const expiry = Date.now() - 60 * 60 * 1000
  for (const [sessionId, session] of sessions) {
    if (session.createdAt < expiry) {
      fs.rmSync(session.path, { force: true })
      sessions.delete(sessionId)
    }
  }
}, 10 * 60 * 1000).unref()

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log('Encrypted backup adapter listening on', port)
})
