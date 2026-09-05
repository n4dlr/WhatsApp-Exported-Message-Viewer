import JSZip from 'jszip'
import { normalizeConversation, normalizeMessages } from '../utils/normalization'
import { useChatStore } from '../stores/chatStore'
import { useImportStore } from '../stores/importStore'
import { sqliteService } from './sqliteService'
import { encryptedBackupService } from './encryptedBackupService'

export const importService = {
  async processFile(file: File){
    const ext = file.name.split('.').pop()?.toLowerCase()
    const importStore = require('../stores/importStore').useImportStore
    importStore.getState().setStatus('Detecting format...')
    importStore.getState().setProgress(5)
    if(ext === 'txt'){
      importStore.getState().setStatus('Parsing TXT export...')
      const text = await file.text()
      const parsed = (await import('../parsers/txtParser')).parseTxt(text)
      useChatStore.getState().setConversations(parsed.conversations)
      useChatStore.getState().addMessages(parsed.messages)
      importStore.getState().setStatus('Import complete')
      importStore.getState().setProgress(100)
      return
    }
    if(ext === 'zip'){
      importStore.getState().setStatus('Reading ZIP...')
      importStore.getState().setProgress(10)
      const zip = await JSZip.loadAsync(file)
      const names = Object.keys(zip.files)
      if(names.some(n=>n.toLowerCase().endsWith('.txt'))){
        importStore.getState().setStatus('Parsing TXT inside ZIP...')
        const txtName = names.find(n=>n.toLowerCase().endsWith('.txt'))!
        const content = await zip.file(txtName)!.async('string')
        const parsed = (await import('../parsers/txtParser')).parseTxt(content)
        useChatStore.getState().setConversations(parsed.conversations)
        useChatStore.getState().addMessages(parsed.messages)
        importStore.getState().setStatus('Import complete')
        importStore.getState().setProgress(100)
        return
      }
      if(names.some(n=>n.toLowerCase().endsWith('.db')||n.toLowerCase().endsWith('.sqlite'))){
        importStore.getState().setStatus('Extracting database from ZIP...')
        const dbName = names.find(n=>/\.db$|\.sqlite$|msgstore/i.test(n))!
        const arr = await zip.file(dbName)!.async('uint8array')
        importStore.getState().setStatus('Opening database in worker...')
        await sqliteService.openDatabaseFromBytes(arr)
        importStore.getState().setStatus('Database loaded from ZIP')
        importStore.getState().setProgress(100)
        return
      }
      importStore.getState().setStatus('ZIP processed — media available')
      importStore.getState().setProgress(100)
      return
    }
    if(ext === 'db' || ext === 'sqlite' || file.name.toLowerCase().includes('msgstore')){
      importStore.getState().setStatus('Opening SQLite database...')
      importStore.getState().setProgress(10)
      const arr = new Uint8Array(await file.arrayBuffer())
      await sqliteService.openDatabaseFromBytes(arr)
      importStore.getState().setStatus('Database loaded')
      importStore.getState().setProgress(100)
      return
    }
    if(ext?.startsWith('crypt')){
      importStore.getState().setStatus('Encrypted backup selected — please provide key material via the Encrypted Backup workflow')
      importStore.getState().setProgress(0)
      return
    }
    importStore.getState().setStatus('Unsupported file format')
    importStore.getState().setProgress(0)
  }
}
