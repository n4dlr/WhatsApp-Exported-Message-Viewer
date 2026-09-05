// @ts-nocheck
import initSqlJs, { Database } from 'sql.js'
import { useChatStore } from '../stores/chatStore'
import { parseSqliteToModel } from '../parsers/sqliteParser'

let SQL: any = null
let db: Database | null = null

export const sqliteService = {
  async init(){
    if(SQL) return
    SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm` })
  },
  async openDatabaseFromBytes(bytes:Uint8Array){
    await this.init()
    if(db) db.close()
    db = new SQL.Database(bytes)
    const model = parseSqliteToModel(db)
    useChatStore.getState().setConversations(model.conversations)
    useChatStore.getState().addMessages(model.messages)
    return model
  },
  getRaw(){ return db }
}
