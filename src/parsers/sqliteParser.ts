import { Message, Conversation } from '../types/message'
import { Database } from 'sql.js'

export function parseSqliteToModel(db:any): {conversations: any[], messages:any[]}{
  // schema detection: look for common tables: messages, chat_list, chats, wa_contacts
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
  const tableNames = (tables[0]?.values||[]).map((v:any)=>v[0].toLowerCase())

  // try messages table
  let messages: any[] = []
  let conversations: any[] = []

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
          senderName: obj.remote_resource ?? obj.key_from_me ? 'You' : obj.remote_resource ?? obj.remote_jid,
          timestamp: (obj.timestamp || obj.timestamp_ms || obj.data ? (Number(obj.timestamp)||Number(obj.timestamp_ms) || Date.now() ) : Date.now()),
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
            timestamp: Number(obj.timestamp) || Date.now(),
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
  const convMap: Record<string, any> = {}
  for(const m of messages){
    if(!convMap[m.conversationId]) convMap[m.conversationId] = {id:m.conversationId, name: m.conversationId, lastMessage: m, lastTimestamp: m.timestamp}
    else if(m.timestamp > convMap[m.conversationId].lastTimestamp){
      convMap[m.conversationId].lastMessage = m
      convMap[m.conversationId].lastTimestamp = m.timestamp
    }
  }
  conversations = Object.values(convMap)
  return {conversations, messages}
}

function cryptoRandomId(){
  return Math.random().toString(36).slice(2,12)
}
