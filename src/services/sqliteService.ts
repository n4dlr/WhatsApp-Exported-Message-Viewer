import initSqlJs, { Database } from 'sql.js'
import { useChatStore } from '../stores/chatStore'
import { parseSqliteToModel } from '../parsers/sqliteParser'

let worker: Worker | null = null

export const sqliteService = {
  async openDatabaseFromBytes(bytes: Uint8Array) {
    // Use a module worker to parse the db off the main thread
    return await new Promise<any>((resolve, reject) => {
      if (worker) worker.terminate()
      worker = new Worker(new URL('../workers/databaseWorker.ts', import.meta.url), { type: 'module' })

      worker.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data
        if (type === 'progress') {
          // optional: forward progress to import store
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const imp = require('../stores/importStore').useImportStore
          imp.getState().setStatus(payload.status || 'processing')
        }
        if (type === 'result') {
          const { conversations, messages } = payload
          useChatStore.getState().setConversations(conversations)
          useChatStore.getState().addMessages(messages)
          resolve({ conversations, messages })
          worker?.terminate()
          worker = null
        }
        if (type === 'error') {
          reject(new Error(payload.message))
          worker?.terminate()
          worker = null
        }
      }

      worker.onerror = (err) => {
        reject(err)
        worker?.terminate()
        worker = null
      }

      // post bytes as transferable
      worker.postMessage({ type: 'open', payload: { bytes } }, [bytes.buffer])
    })
  },
  getRaw() {
    return null
  }
}
