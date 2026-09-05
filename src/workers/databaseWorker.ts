// This is a module worker that opens a SQLite database using sql.js and parses it into a normalized model.
// It posts progress messages and a final model back to the main thread.

import initSqlJs from 'sql.js'

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, payload } = e.data
  try {
    if (type === 'open') {
      const bytes: Uint8Array = payload.bytes
      self.postMessage({ type: 'progress', payload: { status: 'Initializing sql.js' } })

      const SQL = await (initSqlJs as any)({ locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` })
      self.postMessage({ type: 'progress', payload: { status: 'SQL runtime initialized' } })

      const db = new (SQL as any).Database(bytes)
      self.postMessage({ type: 'progress', payload: { status: 'Database loaded' } })

      // Basic schema detection and parsing (best-effort)
      const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
      const tableNames = (tablesRes[0]?.values || []).map((v: any) => String(v[0]).toLowerCase())
      self.postMessage({ type: 'progress', payload: { status: 'Detected tables', tables: tableNames } })

      let messages: any[] = []
      let conversations: any[] = []

      const now = Date.now()

      if (tableNames.includes('messages')) {
        self.postMessage({ type: 'progress', payload: { status: 'Parsing messages table (partial preview)' } })
        const res = db.exec('SELECT * FROM messages LIMIT 1000')
        if (res[0]) {
          const cols = res[0].columns
          for (const row of res[0].values) {
            const obj: any = {}
            cols.forEach((c: any, i: number) => (obj[c] = row[i]))
            const msg: any = {
              id: obj._id?.toString() ?? obj.key_id?.toString() ?? (Math.random().toString(36).slice(2, 12)),
              conversationId: obj.key_remote_jid ?? obj.remote_jid ?? obj.chat_id ?? 'unknown',
              senderName: obj.remote_resource ?? (obj.key_from_me ? 'You' : obj.remote_resource ?? obj.remote_jid),
              timestamp: Number(obj.timestamp || obj.timestamp_ms || now),
              body: obj.data ?? obj.message ?? obj.text ?? '',
              isOutgoing: !!(obj.key_from_me || obj.from_me),
              type: 'text'
            }
            messages.push(msg)
          }
        }
      } else {
        // scan for any table with text-like columns
        for (const t of tableNames) {
          const res = db.exec(`SELECT * FROM ${t} LIMIT 200`)
          if (res[0] && res[0].columns.some((c: any) => /data|message|text|body/i.test(c))) {
            const cols = res[0].columns
            for (const row of res[0].values) {
              const obj: any = {}
              cols.forEach((c: any, i: number) => (obj[c] = row[i]))
              const msg: any = {
                id: Math.random().toString(36).slice(2, 12),
                conversationId: String(obj.chat_id || obj.thread_id || obj.remote_jid || t),
                senderName: obj.sender || obj.from || 'unknown',
                timestamp: Number(obj.timestamp) || now,
                body: obj.text || obj.data || obj.message || '',
                isOutgoing: false,
                type: 'text'
              }
              messages.push(msg)
            }
          }
        }
      }

      // Build conversations map
      const convMap: Record<string, any> = {}
      for (const m of messages) {
        if (!convMap[m.conversationId]) convMap[m.conversationId] = { id: m.conversationId, name: m.conversationId, lastMessage: m, lastTimestamp: m.timestamp }
        else if (m.timestamp > convMap[m.conversationId].lastTimestamp) {
          convMap[m.conversationId].lastMessage = m
          convMap[m.conversationId].lastTimestamp = m.timestamp
        }
      }
      conversations = Object.values(convMap)

      self.postMessage({ type: 'result', payload: { conversations, messages } })
    }
  } catch (err: any) {
    self.postMessage({ type: 'error', payload: { message: err?.message || String(err) } })
  }
})
