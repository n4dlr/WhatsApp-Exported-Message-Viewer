import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import zlib from 'zlib'
import { DatabaseSync } from 'node:sqlite'
import { pipeline } from 'stream/promises'

const app = express()
app.use(express.json({ limit: '10mb' }))

// CORS handler allowing local dev origins
app.use((req, res, next) => {
  const origin = String(req.headers.origin || '')
  if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

fs.mkdirSync('tmp', { recursive: true })
const upload = multer({ dest: 'tmp/' })

// In-memory active database sessions
const sessions = new Map()

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function normalizeTimestamp(value) {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Date.now()
  return timestamp < 10000000000 ? timestamp * 1000 : timestamp
}

function detectSchema(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => String(r.name))
  const hasModernMessage = tables.includes('message')
  const hasChat = tables.includes('chat')
  const hasJid = tables.includes('jid')

  if (hasModernMessage && hasChat && hasJid) {
    return { type: 'modern' }
  }

  const legacyTable = tables.find(t => /^messages?$/i.test(t))
  if (legacyTable) {
    return { type: 'legacy', messageTable: legacyTable }
  }

  const anyMessage = tables.find(t => /message/i.test(t))
  if (anyMessage) {
    return { type: 'generic', messageTable: anyMessage }
  }

  throw new Error('Tanınan WhatsApp mesaj cədvəli tapılmadı (message və ya messages).')
}

// Build contact book from message_vcard, lid_display_name, username_change, and mentions
function buildContactBook(db) {
  const contactBook = new Map()

  // 1. From message_vcard & message_vcard_jid
  try {
    const vcards = db.prepare(`
      SELECT mv.vcard, mvj.vcard_jid_row_id 
      FROM message_vcard mv 
      LEFT JOIN message_vcard_jid mvj ON mv._id = mvj.vcard_row_id
    `).all()
    for (const row of vcards) {
      if (!row.vcard) continue
      const fnMatch = row.vcard.match(/FN:(.+)/i)
      const waidMatch = row.vcard.match(/waid=([0-9]+)/i)
      const fn = fnMatch ? fnMatch[1].trim() : null
      const waid = waidMatch ? waidMatch[1].trim() : null
      if (fn) {
        if (waid) contactBook.set(waid, fn)
        if (row.vcard_jid_row_id) contactBook.set('jid_' + row.vcard_jid_row_id, fn)
      }
    }
  } catch {}

  // 2. From lid_display_name
  try {
    const lidNames = db.prepare(`
      SELECT lid_row_id, display_name, username 
      FROM lid_display_name 
      WHERE (username IS NOT NULL AND username != '') 
         OR (display_name IS NOT NULL AND display_name != '' AND display_name NOT LIKE '%∙%')
    `).all()
    for (const row of lidNames) {
      const name = (row.display_name && !row.display_name.includes('∙')) 
        ? row.display_name.trim() 
        : (row.username ? '@' + row.username.trim() : null)
      if (name) {
        contactBook.set('jid_' + row.lid_row_id, name)
      }
    }
  } catch {}

  // 3. From message_system_username_change
  try {
    const sysUsernames = db.prepare(`
      SELECT user_jid, new_username, display_name 
      FROM message_system_username_change 
      WHERE (display_name IS NOT NULL AND display_name != '') 
         OR (new_username IS NOT NULL AND new_username != '')
    `).all()
    for (const row of sysUsernames) {
      const name = row.display_name 
        ? row.display_name.replace(/^[~ \s]+/, '').trim() 
        : (row.new_username ? '@' + row.new_username.trim() : null)
      if (name && row.user_jid) {
        if (!contactBook.has('jid_' + row.user_jid)) {
          contactBook.set('jid_' + row.user_jid, name)
        }
      }
    }
  } catch {}

  // 4. From message_mentions
  try {
    const mentions = db.prepare(`
      SELECT jid_row_id, display_name 
      FROM message_mentions 
      WHERE display_name IS NOT NULL AND display_name != ''
    `).all()
    for (const row of mentions) {
      if (row.display_name && row.jid_row_id) {
        const cleaned = row.display_name.replace(/^[⁨\s]+|[⁩\s]+$/g, '').trim()
        if (cleaned && !contactBook.has('jid_' + row.jid_row_id)) {
          contactBook.set('jid_' + row.jid_row_id, cleaned)
        }
      }
    }
  } catch {}

  return contactBook
}

function registerSession(databasePath, isTemporary = false) {
  const sessionId = crypto.randomUUID()
  const db = new DatabaseSync(databasePath, { readOnly: true })
  const schema = detectSchema(db)
  const contactBook = buildContactBook(db)

  let totalMessages = 0
  let totalChats = 0

  if (schema.type === 'modern') {
    try {
      totalMessages = Number(db.prepare('SELECT COUNT(*) as count FROM message').get()?.count || 0)
    } catch { totalMessages = 0 }
    try {
      totalChats = Number(db.prepare('SELECT COUNT(*) as count FROM chat').get()?.count || 0)
    } catch { totalChats = 0 }
  } else {
    try {
      totalMessages = Number(db.prepare(`SELECT COUNT(*) as count FROM ${quoteIdentifier(schema.messageTable)}`).get()?.count || 0)
    } catch { totalMessages = 0 }
  }

  const stat = fs.existsSync(databasePath) ? fs.statSync(databasePath) : { size: 0 }
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get()?.count || 0

  const sessionObj = {
    sessionId,
    db,
    path: databasePath,
    isTemporary,
    createdAt: Date.now(),
    schema,
    contactBook,
    stats: {
      totalMessages,
      totalChats,
      totalTables: Number(tableCount),
      fileSizeBytes: stat.size,
      fileName: path.basename(databasePath)
    }
  }

  sessions.set(sessionId, sessionObj)
  return sessionObj
}

// -------------------------------------------------------------
// System & Discovery Endpoints
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    uptime: process.uptime()
  })
})

// Auto-detect local databases in workspace and parent directory
app.get('/api/detect-local', (req, res) => {
  try {
    const searchDirs = [process.cwd(), path.join(process.cwd(), '..')]
    const detected = []

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir)
      for (const file of files) {
        if (/\.(db|sqlite|sqlite3)$/i.test(file) || file.toLowerCase().includes('msgstore')) {
          const fullPath = path.resolve(dir, file)
          try {
            const stat = fs.statSync(fullPath)
            if (stat.isFile() && stat.size > 1024) {
              detected.push({
                fileName: file,
                filePath: fullPath,
                sizeBytes: stat.size,
                sizeFormatted: (stat.size / (1024 * 1024)).toFixed(1) + ' MB',
                modifiedAt: stat.mtimeMs
              })
            }
          } catch {}
        }
      }
    }

    detected.sort((a, b) => b.sizeBytes - a.sizeBytes)
    return res.json({ detected })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Open local database directly
app.post('/api/import/local-file', (req, res) => {
  try {
    const rawPath = String(req.body.filePath || '').trim()
    if (!rawPath) return res.status(400).send('Fayl yolu qeyd edilməyib.')

    const absolutePath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).send(`Fayl tapılmadı: ${absolutePath}`)
    }

    const session = registerSession(absolutePath, false)
    return res.json({
      sessionId: session.sessionId,
      stats: session.stats,
      schema: session.schema
    })
  } catch (err) {
    return res.status(422).send(err instanceof Error ? err.message : 'Verilənlər bazası açıla bilmədi.')
  }
})

// Upload SQLite database via multipart form
app.post('/api/import/database', upload.single('file'), (req, res) => {
  const filePath = req.file?.path
  try {
    if (!filePath) return res.status(400).send('Heç bir fayl yüklənmədi.')
    const session = registerSession(filePath, true)
    return res.json({
      sessionId: session.sessionId,
      stats: session.stats,
      schema: session.schema
    })
  } catch (err) {
    if (filePath) fs.rmSync(filePath, { force: true })
    return res.status(422).send(err instanceof Error ? err.message : 'Yüklənmiş baza oxunmadı.')
  }
})

// Decrypt encrypted WhatsApp backup
app.post('/api/import/encrypted-backup', upload.single('file'), async (req, res) => {
  let temporaryPath
  let decryptedPath
  try {
    const file = req.file
    const key = String(req.body.keyMaterial || '').replace(/\s/g, '')
    if (!file) return res.status(400).send('Fayl yüklənmədi.')
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      return res.status(400).send('Açar formatı yanlışdır. Dəqiq 64 hexadecimal simvol olmalıdır.')
    }

    temporaryPath = file.path
    const fileSize = fs.statSync(temporaryPath).size
    if (fileSize < 131) return res.status(400).send('Şifrələnmiş backup faylı çox kiçikdir və ya zədələnib.')

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

    const session = registerSession(decryptedPath, true)
    return res.json({
      sessionId: session.sessionId,
      stats: session.stats,
      schema: session.schema
    })
  } catch (error) {
    if (error?.code === 'Z_DATA_ERROR') {
      return res.status(422).send('Şifrə açıldı, lakin backup məlumatları zədələnib.')
    }
    return res.status(422).send('Şifrə açılması uğursuz oldu. Açar yanlışdır və ya fayl uyğun deyil.')
  } finally {
    if (temporaryPath) fs.rmSync(temporaryPath, { force: true })
  }
})

// -------------------------------------------------------------
// Session Info & Chunked Chat Loading
// -------------------------------------------------------------

app.get('/api/session/:sessionId/info', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı və ya vaxtı bitib.')
  return res.json({
    sessionId: session.sessionId,
    stats: session.stats,
    schema: session.schema
  })
})

// Chunked chat loading with Archive separation, contact name resolution, and search
app.get('/api/session/:sessionId/chats', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000)
    const offset = Math.max(Number(req.query.offset) || 0, 0)
    const search = String(req.query.search || '').trim().toLowerCase()
    const filter = String(req.query.filter || 'all').toLowerCase() // 'all' | 'unread' | 'groups' | 'archived'
    const view = String(req.query.view || 'active').toLowerCase() // 'active' (unarchived) or 'archived'

    const db = session.db
    const schema = session.schema
    const contactBook = session.contactBook

    if (schema.type === 'modern') {
      // Archived chats count in database
      const archivedCount = Number(db.prepare(`
        SELECT COUNT(*) as count 
        FROM chat 
        WHERE archived = 1 
          AND (last_message_row_id IS NOT NULL OR sort_timestamp IS NOT NULL)
      `).get()?.count || 0)

      let filterClause = '1=1'
      const params = []

      // Archive filter: if view === 'archived' or filter === 'archived', show only archived
      if (view === 'archived' || filter === 'archived') {
        filterClause += ' AND c.archived = 1'
      } else {
        // Normal chat view: exclude archived chats, exactly like real WhatsApp Web
        filterClause += ' AND (c.archived = 0 OR c.archived IS NULL)'
      }

      if (filter === 'unread') {
        filterClause += ' AND c.unseen_message_count > 0'
      } else if (filter === 'groups') {
        filterClause += " AND (j.server = 'g.us' OR c.subject IS NOT NULL)"
      }

      if (search) {
        filterClause += ' AND (LOWER(COALESCE(c.subject, \'\')) LIKE ? OR LOWER(j.raw_string) LIKE ? OR LOWER(COALESCE(j.user, \'\')) LIKE ?)'
        const s = `%${search}%`
        params.push(s, s, s)
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as count
        FROM chat c
        JOIN jid j ON c.jid_row_id = j._id
        WHERE ${filterClause}
          AND (c.last_message_row_id IS NOT NULL OR c.sort_timestamp IS NOT NULL)
      `
      const total = Number(db.prepare(countQuery).get(...params)?.count || 0)

      const chatQuery = `
        SELECT 
          c._id as id,
          c.jid_row_id,
          c.subject,
          c.sort_timestamp,
          c.unseen_message_count,
          c.archived,
          c.created_timestamp,
          j.raw_string as jid,
          j.user as phone_number,
          j.server,
          m_last.text_data as last_message_text,
          m_last.timestamp as last_message_timestamp,
          m_last.from_me as last_message_from_me,
          m_last.message_type as last_message_type,
          m_last.status as last_message_status
        FROM chat c
        JOIN jid j ON c.jid_row_id = j._id
        LEFT JOIN message m_last ON c.last_message_row_id = m_last._id
        WHERE ${filterClause}
          AND (c.last_message_row_id IS NOT NULL OR c.sort_timestamp IS NOT NULL)
        ORDER BY COALESCE(c.sort_timestamp, m_last.timestamp, 0) DESC
        LIMIT ? OFFSET ?
      `
      const rows = db.prepare(chatQuery).all(...params, limit, offset)

      const chats = rows.map(r => {
        const isGroup = r.server === 'g.us' || Boolean(r.subject)

        // Resolve contact name for 1-on-1 chats
        let resolvedName = null
        if (!isGroup) {
          resolvedName = contactBook.get('jid_' + r.jid_row_id) || (r.phone_number ? contactBook.get(r.phone_number) : null)
        }

        const displayName = r.subject || resolvedName || r.phone_number || r.jid || 'Söhbət'

        return {
          id: String(r.id),
          jidRowId: r.jid_row_id,
          jid: r.jid,
          phoneNumber: r.phone_number,
          server: r.server,
          name: displayName,
          contactName: resolvedName,
          subject: r.subject,
          isGroup,
          archived: Boolean(r.archived),
          unreadCount: Number(r.unseen_message_count || 0),
          lastTimestamp: normalizeTimestamp(r.last_message_timestamp || r.sort_timestamp),
          lastMessage: {
            text: r.last_message_text || (r.last_message_type === 1 ? '📷 Şəkil' : r.last_message_type === 2 ? '🎵 Səs mesajı' : r.last_message_type === 3 ? '🎥 Video' : r.last_message_type === 9 ? '📄 Sənəd' : r.last_message_type === 20 ? '✨ Stiker' : ''),
            timestamp: normalizeTimestamp(r.last_message_timestamp || r.sort_timestamp),
            fromMe: Boolean(r.last_message_from_me),
            type: r.last_message_type,
            status: r.last_message_status
          }
        }
      })

      return res.json({
        total,
        archivedCount,
        limit,
        offset,
        hasMore: offset + chats.length < total,
        chats
      })
    }

    return res.json({ total: 0, archivedCount: 0, chats: [], hasMore: false })
  } catch (err) {
    console.error('Error fetching chats:', err)
    return res.status(500).send(err instanceof Error ? err.message : 'Çatlar yüklənərkən xəta baş verdi.')
  }
})

// -------------------------------------------------------------
// Paginated Message Loading for a Specific Chat
// -------------------------------------------------------------

app.get('/api/session/:sessionId/chats/:chatId/messages', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const chatId = Number(req.params.chatId)
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
    const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null
    const search = String(req.query.search || '').trim()

    const db = session.db
    const schema = session.schema
    const contactBook = session.contactBook

    if (schema.type === 'modern') {
      let whereClause = 'm.chat_row_id = ?'
      const params = [chatId]

      if (beforeId) {
        whereClause += ' AND m._id < ?'
        params.push(beforeId)
      }

      if (search) {
        whereClause += ' AND m.text_data LIKE ?'
        params.push(`%${search}%`)
      }

      // Fast query with composite index (chat_row_id, _id) and sender resolution
      const query = `
        SELECT 
          m.*,
          sender_j.raw_string as sender_jid,
          sender_j.user as sender_user,
          sender_j.server as sender_server,
          COALESCE(mapped_j.user, sender_j.user) as sender_resolved_phone,
          mapped_j._id as mapped_jid_id,
          ldn.username as lid_username,
          ldn.display_name as lid_display_name
        FROM message m
        LEFT JOIN jid sender_j ON m.sender_jid_row_id = sender_j._id
        LEFT JOIN jid_map jm ON sender_j._id = jm.lid_row_id
        LEFT JOIN jid mapped_j ON jm.jid_row_id = mapped_j._id
        LEFT JOIN lid_display_name ldn ON sender_j._id = ldn.lid_row_id
        WHERE ${whereClause}
        ORDER BY m._id DESC
        LIMIT ?
      `
      const rawRows = db.prepare(query).all(...params, limit)

      if (rawRows.length === 0) {
        return res.json({ messages: [], hasMore: false, oldestId: null, newestId: null })
      }

      const rows = rawRows.slice().reverse()
      const ids = rows.map(r => r._id)
      const idPlaceholders = ids.map(() => '?').join(',')

      // Batch fetch media
      const medias = db.prepare(`SELECT * FROM message_media WHERE message_row_id IN (${idPlaceholders})`).all(...ids)
      const mediaMap = new Map(medias.map(m => [m.message_row_id, m]))

      // Batch fetch quoted messages with resolved sender phone, LID, and username
      const quotes = db.prepare(`
        SELECT mq.*, 
               sender_j.raw_string as quoted_sender_jid,
               sender_j.user as quoted_sender_user,
               COALESCE(mapped_j.user, sender_j.user) as quoted_resolved_phone,
               mapped_j._id as quoted_mapped_jid_id,
               ldn.username as quoted_lid_username,
               ldn.display_name as quoted_lid_display_name
        FROM message_quoted mq
        LEFT JOIN jid sender_j ON mq.sender_jid_row_id = sender_j._id
        LEFT JOIN jid_map jm ON sender_j._id = jm.lid_row_id
        LEFT JOIN jid mapped_j ON jm.jid_row_id = mapped_j._id
        LEFT JOIN lid_display_name ldn ON sender_j._id = ldn.lid_row_id
        WHERE mq.message_row_id IN (${idPlaceholders})
      `).all(...ids)
      const quoteMap = new Map(quotes.map(q => [q.message_row_id, q]))

      // Batch fetch reactions
      const reactions = db.prepare(`
        SELECT a.parent_message_row_id as message_id, r.reaction, a.from_me, j.raw_string as sender_jid
        FROM message_add_on a
        JOIN message_add_on_reaction r ON a._id = r.message_add_on_row_id
        LEFT JOIN jid j ON a.sender_jid_row_id = j._id
        WHERE a.parent_message_row_id IN (${idPlaceholders})
      `).all(...ids)

      const reactionMap = new Map()
      for (const r of reactions) {
        if (!reactionMap.has(r.message_id)) reactionMap.set(r.message_id, [])
        reactionMap.get(r.message_id).push({
          reaction: r.reaction,
          fromMe: Boolean(r.from_me),
          senderJid: r.sender_jid
        })
      }

      // Batch fetch poll options
      const polls = db.prepare(`
        SELECT message_row_id, option_name, vote_total
        FROM message_poll_option
        WHERE message_row_id IN (${idPlaceholders})
      `).all(...ids)
      const pollMap = new Map()
      for (const p of polls) {
        if (!pollMap.has(p.message_row_id)) pollMap.set(p.message_row_id, [])
        pollMap.get(p.message_row_id).push({
          name: p.option_name,
          votes: Number(p.vote_total || 0)
        })
      }

      // Batch fetch location
      const locations = db.prepare(`
        SELECT message_row_id, latitude, longitude, place_name, place_address, url
        FROM message_location
        WHERE message_row_id IN (${idPlaceholders})
      `).all(...ids)
      const locationMap = new Map(locations.map(l => [l.message_row_id, l]))

      // Batch fetch vcards
      const vcards = db.prepare(`
        SELECT message_row_id, vcard
        FROM message_vcard
        WHERE message_row_id IN (${idPlaceholders})
      `).all(...ids)
      const vcardMap = new Map(vcards.map(v => [v.message_row_id, v]))

      // Hydrate messages with complete name resolution
      const messages = rows.map(r => {
        const id = Number(r._id)
        const media = mediaMap.get(id)
        const quote = quoteMap.get(id)
        const messageReactions = reactionMap.get(id) || []
        const pollOptions = pollMap.get(id) || null
        const location = locationMap.get(id) || null
        const vcard = vcardMap.get(id) || null

        let typeStr = 'text'
        const t = r.message_type
        if (t === 1) typeStr = 'image'
        else if (t === 2) typeStr = 'audio'
        else if (t === 3) typeStr = 'video'
        else if (t === 4) typeStr = 'contact'
        else if (t === 5) typeStr = 'location'
        else if (t === 7) typeStr = 'system'
        else if (t === 9) typeStr = 'document'
        else if (t === 13) typeStr = 'gif'
        else if (t === 20 || t === 15) typeStr = 'sticker'
        else if (t === 64) typeStr = 'poll'
        else if (t === 81) typeStr = 'call'

        // Resolve author name from contactBook, lid_display_name, or phone number
        let resolvedDisplayName = contactBook.get('jid_' + r.sender_jid_row_id)
          || (r.mapped_jid_id ? contactBook.get('jid_' + r.mapped_jid_id) : null)
          || (r.sender_resolved_phone ? contactBook.get(r.sender_resolved_phone) : null)
          || (r.lid_display_name && !r.lid_display_name.includes('∙') ? r.lid_display_name : null)
          || (r.lid_username ? '@' + r.lid_username : null)
          || null

        const senderPhone = r.sender_resolved_phone || (r.sender_server !== 'lid' ? r.sender_user : null)
        const senderName = r.from_me 
          ? 'Siz' 
          : (resolvedDisplayName || senderPhone || (r.lid_username ? '@' + r.lid_username : null) || 'İştirakçı')

        // Resolve quote author name
        let quotedName = null
        if (quote) {
          quotedName = contactBook.get('jid_' + quote.sender_jid_row_id)
            || (quote.quoted_mapped_jid_id ? contactBook.get('jid_' + quote.quoted_mapped_jid_id) : null)
            || (quote.quoted_resolved_phone ? contactBook.get(quote.quoted_resolved_phone) : null)
            || (quote.quoted_lid_display_name && !quote.quoted_lid_display_name.includes('∙') ? quote.quoted_lid_display_name : null)
            || (quote.quoted_lid_username ? '@' + quote.quoted_lid_username : null)
            || quote.quoted_resolved_phone
            || 'İştirakçı'
        }

        return {
          id: String(r._id),
          rowId: Number(r._id),
          conversationId: String(r.chat_row_id),
          keyId: r.key_id,
          timestamp: normalizeTimestamp(r.timestamp),
          receivedTimestamp: normalizeTimestamp(r.received_timestamp),
          isOutgoing: Boolean(r.from_me),
          status: r.status,
          starred: Boolean(r.starred),
          body: r.text_data || '',
          type: typeStr,
          rawMessageType: r.message_type,
          sender: {
            name: senderName,
            displayName: resolvedDisplayName,
            jid: r.sender_jid,
            phoneNumber: senderPhone
          },
          media: media ? {
            filePath: media.file_path,
            fileSize: media.file_size,
            mimeType: media.mime_type,
            mediaName: media.media_name,
            caption: media.media_caption,
            duration: media.media_duration,
            transcription: media.raw_transcription_text,
            width: media.width,
            height: media.height
          } : null,
          quoted: quote ? {
            rowId: quote.message_row_id,
            body: quote.text_data,
            senderJid: quote.quoted_sender_jid,
            senderPhone: quote.quoted_resolved_phone,
            senderName: quotedName,
            fromMe: Boolean(quote.from_me)
          } : null,
          reactions: messageReactions,
          poll: pollOptions ? { options: pollOptions } : null,
          location: location ? {
            lat: location.latitude,
            lng: location.longitude,
            name: location.place_name,
            address: location.place_address,
            url: location.url
          } : null,
          vcard: vcard ? vcard.vcard : null
        }
      })

      const oldestId = rawRows[rawRows.length - 1]._id
      const newestId = rawRows[0]._id
      const hasMoreCheck = db.prepare('SELECT 1 FROM message WHERE chat_row_id = ? AND _id < ? LIMIT 1').get(chatId, oldestId)

      return res.json({
        messages,
        hasMore: Boolean(hasMoreCheck),
        oldestId,
        newestId
      })
    }

    return res.json({ messages: [], hasMore: false })
  } catch (err) {
    console.error('Error loading chat messages:', err)
    return res.status(500).send(err instanceof Error ? err.message : 'Mesajlar yüklənərkən xəta baş verdi.')
  }
})

// -------------------------------------------------------------
// All-Columns Raw Inspector Endpoints (Bütün Sütunlar)
// -------------------------------------------------------------

app.get('/api/session/:sessionId/messages/:messageId/raw', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const messageId = Number(req.params.messageId)
    const db = session.db

    const messageRow = db.prepare('SELECT * FROM message WHERE _id = ?').get(messageId)
    if (!messageRow) return res.status(404).send('Mesaj tapılmadı.')

    let mediaRow = null
    try { mediaRow = db.prepare('SELECT * FROM message_media WHERE message_row_id = ?').get(messageId) } catch {}

    let quotedRow = null
    try { quotedRow = db.prepare('SELECT * FROM message_quoted WHERE message_row_id = ?').get(messageId) } catch {}

    let reactions = []
    try {
      reactions = db.prepare(`
        SELECT a.*, r.reaction, r.sender_timestamp as reaction_timestamp, j.raw_string as sender_jid
        FROM message_add_on a
        JOIN message_add_on_reaction r ON a._id = r.message_add_on_row_id
        LEFT JOIN jid j ON a.sender_jid_row_id = j._id
        WHERE a.parent_message_row_id = ?
      `).all(messageId)
    } catch {}

    let pollOptions = []
    try { pollOptions = db.prepare('SELECT * FROM message_poll_option WHERE message_row_id = ?').all(messageId) } catch {}

    let locationRow = null
    try { locationRow = db.prepare('SELECT * FROM message_location WHERE message_row_id = ?').get(messageId) } catch {}

    let vcardRow = null
    try { vcardRow = db.prepare('SELECT * FROM message_vcard WHERE message_row_id = ?').get(messageId) } catch {}

    let senderJidRow = null
    let jidMapRow = null
    let lidDisplayNameRow = null
    if (messageRow.sender_jid_row_id) {
      try {
        senderJidRow = db.prepare('SELECT * FROM jid WHERE _id = ?').get(messageRow.sender_jid_row_id)
        jidMapRow = db.prepare('SELECT * FROM jid_map WHERE lid_row_id = ?').get(messageRow.sender_jid_row_id)
        lidDisplayNameRow = db.prepare('SELECT * FROM lid_display_name WHERE lid_row_id = ?').get(messageRow.sender_jid_row_id)
      } catch {}
    }

    return res.json({
      messageId,
      message: messageRow,
      media: mediaRow,
      quoted: quotedRow,
      reactions,
      pollOptions,
      location: locationRow,
      vcard: vcardRow,
      senderJid: senderJidRow,
      jidMap: jidMapRow,
      lidDisplayName: lidDisplayNameRow
    })
  } catch (err) {
    return res.status(500).send(err instanceof Error ? err.message : 'Xam sütunlar oxunarkən xəta baş verdi.')
  }
})

// Inspect all columns for a specific chat
app.get('/api/session/:sessionId/chats/:chatId/raw', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const chatId = Number(req.params.chatId)
    const db = session.db

    const chatRow = db.prepare('SELECT * FROM chat WHERE _id = ?').get(chatId)
    if (!chatRow) return res.status(404).send('Çat tapılmadı.')

    let jidRow = null
    if (chatRow.jid_row_id) {
      try {
        jidRow = db.prepare('SELECT * FROM jid WHERE _id = ?').get(chatRow.jid_row_id)
      } catch {}
    }

    return res.json({
      chat: chatRow,
      jid: jidRow
    })
  } catch (err) {
    return res.status(500).send(err instanceof Error ? err.message : 'Çat sütunları oxunmadı.')
  }
})

// List all tables in the SQLite database
app.get('/api/session/:sessionId/tables', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const db = session.db
    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()

    const result = tables.map(t => {
      let count = null
      try {
        count = db.prepare(`SELECT COUNT(*) as c FROM ${quoteIdentifier(t.name)}`).get()?.c
      } catch {}
      return {
        name: t.name,
        sql: t.sql,
        rowCount: count !== null ? Number(count) : null
      }
    })

    return res.json({ tables: result })
  } catch (err) {
    return res.status(500).send(err instanceof Error ? err.message : 'Cədvəllər oxunmadı.')
  }
})

// Explore any table's columns and rows
app.get('/api/session/:sessionId/table/:tableName', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const tableName = String(req.params.tableName)
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500)
    const offset = Math.max(Number(req.query.offset) || 0, 0)
    const search = String(req.query.search || '').trim()

    const db = session.db

    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName)
    if (!tableExists) return res.status(404).send('Cədvəl tapılmadı.')

    const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all()
    const totalCount = Number(db.prepare(`SELECT COUNT(*) as c FROM ${quoteIdentifier(tableName)}`).get()?.c || 0)

    let rowsQuery = `SELECT * FROM ${quoteIdentifier(tableName)}`
    const params = []

    if (search && columns.some(c => /char|text|varchar|blob/i.test(c.type || 'text'))) {
      const textCols = columns.filter(c => /char|text|varchar/i.test(c.type || 'text')).map(c => c.name)
      if (textCols.length > 0) {
        const whereParts = textCols.map(col => `${quoteIdentifier(col)} LIKE ?`).join(' OR ')
        rowsQuery += ` WHERE ${whereParts}`
        textCols.forEach(() => params.push(`%${search}%`))
      }
    }

    rowsQuery += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = db.prepare(rowsQuery).all(...params)

    return res.json({
      tableName,
      columns,
      totalCount,
      limit,
      offset,
      rows
    })
  } catch (err) {
    return res.status(500).send(err instanceof Error ? err.message : 'Cədvəl məlumatları oxunmadı.')
  }
})

// Safe read-only SQL query runner
app.post('/api/session/:sessionId/query', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) return res.status(404).send('Sessiya tapılmadı.')

  try {
    const sql = String(req.body.sql || '').trim()
    if (!/^select\s/i.test(sql) && !/^pragma\s/i.test(sql)) {
      return res.status(400).send('Yalnız oxumaq üçün SELECT və ya PRAGMA sorğuları icazəlidir.')
    }

    const db = session.db
    const result = db.prepare(sql).all()
    return res.json({ rows: result.slice(0, 500), count: result.length })
  } catch (err) {
    return res.status(422).send(err instanceof Error ? err.message : 'SQL sorğusu uğursuz oldu.')
  }
})

// Cleanup expired sessions
setInterval(() => {
  const expiry = Date.now() - 2 * 60 * 60 * 1000
  for (const [sessionId, session] of sessions) {
    if (session.createdAt < expiry) {
      try { session.db.close() } catch {}
      if (session.isTemporary && fs.existsSync(session.path)) {
        fs.rmSync(session.path, { force: true })
      }
      sessions.delete(sessionId)
    }
  }
}, 10 * 60 * 1000).unref()

const port = process.env.BACKEND_PORT || process.env.PORT || 3002
app.listen(port, () => {
  console.log(`WhatsApp Database Engine listening on port ${port}`)
})
