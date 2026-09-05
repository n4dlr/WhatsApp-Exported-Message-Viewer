import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

export function parseSqliteToModel(db:any): {conversations: Conversation[], messages: Message[]}{
  // schema detection: look for common tables: messages, chat_list, chats, wa_contacts
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
  const tableNames = (tables[0]?.values||[]).map((v:any)=>v[0].toLowerCase())

  // try messages table
  const messages: Message[] = []
  let conversations: Conversation[] = []

  if(tableNames.includes('messages')){
    const res = db.exec('SELECT * FROM messages LIMIT 500')
    if(res[0]){
      const cols = res[0].columns
      for(const row of res[0].values){
        const obj:any = {}
        cols.forEach((c:any,i:number)=> obj[c] = row[i])
        const msg:any = {
          id: obj._id?.toString() ?? obj.key_id?.toString() ?? cryptoRandomId(),
          conversationId: obj.key_remote_jid ?? obj.remote_jid ?? obj.chat_id ?? 'unknown',
          senderName: obj.key_from_me || obj.from_me ? 'You' : (obj.remote_resource ?? obj.remote_jid),
          timestamp: normalizeTimestamp(obj.timestamp ?? obj.timestamp_ms),
          body: obj.data ?? obj.message ?? obj.text ?? '',
          isOutgoing: !!(obj.key_from_me || obj.from_me),
          type: 'text'
        }
        messages.push(msg)
      }
    }
  } else {
    // fallback scan for any table with text-like columns
    for(const t of tableNames){
      const res = db.exec(`SELECT * FROM ${t} LIMIT 100`)
      if(res[0] && res[0].columns.some((c:any)=>/data|message|text|body/i.test(c))){
        const cols = res[0].columns
        for(const row of res[0].values){
          const obj:any = {}
          cols.forEach((c:any,i:number)=> obj[c] = row[i])
          const msg:any = {
            id: cryptoRandomId(),
            conversationId: String(obj.chat_id || obj.thread_id || obj.remote_jid || t),
            senderName: obj.sender || obj.from || 'unknown',
            timestamp: normalizeTimestamp(obj.timestamp),
            body: obj.text || obj.data || obj.message || '',
            isOutgoing: false,
            type: 'text'
          }
          messages.push(msg)
        }
      }
    }
  }

  // simple conversation list from message groups
  const convMap: Record<string, Conversation> = {}
  for(const m of messages){
    const conversation = convMap[m.conversationId]
    if(!conversation) convMap[m.conversationId] = {id:m.conversationId, name: m.conversationId, type:'unknown', lastMessage: m, lastTimestamp: m.timestamp}
    else if(conversation.lastTimestamp == null || m.timestamp > conversation.lastTimestamp){
      conversation.lastMessage = m
      conversation.lastTimestamp = m.timestamp
    }
  }
  conversations = Object.values(convMap)
  return {conversations, messages}
}

function cryptoRandomId(){
  return crypto.randomUUID()
}

function normalizeTimestamp(value: unknown): number {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Date.now()
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp
}
