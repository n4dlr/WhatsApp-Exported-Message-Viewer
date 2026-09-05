import { openDB } from 'idb'

const DB_NAME = 'chatvault_sessions_v1'

export async function getSessionDB(){
  return openDB(DB_NAME, 1, {
    upgrade(db){
      if(!db.objectStoreNames.contains('sessions')){
        db.createObjectStore('sessions',{ keyPath: 'sessionId' })
      }
      if(!db.objectStoreNames.contains('sessionData')){
        db.createObjectStore('sessionData',{ keyPath: 'sessionId' })
      }
    }
  })
}

export const sessionService = {
  async listSessions(){
    const db = await getSessionDB()
    return db.getAll('sessions')
  },
  async saveSession(meta:{ sessionId:string, name:string, sourceType:string, messageCount:number, createdAt?:number }, data?:any){
    const db = await getSessionDB()
    await db.put('sessions', { ...meta, createdAt: meta.createdAt??Date.now() })
    if(data){
      // store full normalized model in sessionData; this may be large but uses IndexedDB structured clone
      await db.put('sessionData', { sessionId: meta.sessionId, payload: data })
    }
  },
  async getSession(sessionId:string){
    const db = await getSessionDB()
    const meta = await db.get('sessions', sessionId)
    const data = await db.get('sessionData', sessionId)
    return { meta, data: data?.payload }
  },
  async deleteSession(sessionId:string){
    const db = await getSessionDB()
    await db.delete('sessions', sessionId)
    await db.delete('sessionData', sessionId)
  }
}
