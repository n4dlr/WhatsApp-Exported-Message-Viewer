import JSZip from 'jszip'
import { normalizeConversation, normalizeMessages } from '../utils/normalization'
import { useChatStore } from '../stores/chatStore'
import { useImportStore } from '../stores/importStore'
import { sqliteService } from './sqliteService'

export const importService = {
  async processFile(file: File){
    const ext = file.name.split('.').pop()?.toLowerCase()
    const importStore = useImportStore.getState()
    importStore.setStatus('Detecting format...')
    if(ext === 'txt'){
      importStore.setStatus('Parsing TXT export...')
      const text = await file.text()
      const parsed = (await import('../parsers/txtParser')).parseTxt(text)
      // apply normalized model
      useChatStore.getState().setConversations(parsed.conversations)
      useChatStore.getState().addMessages(parsed.messages)
      importStore.setStatus('Import complete')
      importStore.setProgress(100)
      return
    }
    if(ext === 'zip'){
      importStore.setStatus('Reading ZIP...')
      const zip = await JSZip.loadAsync(file)
      // try to detect msgstore db or txt inside
      const names = Object.keys(zip.files)
      if(names.some(n=>n.toLowerCase().endsWith('.txt'))){
        const txtName = names.find(n=>n.toLowerCase().endsWith('.txt'))!
        const content = await zip.file(txtName)!.async('string')
        const parsed = (await import('../parsers/txtParser')).parseTxt(content)
        useChatStore.getState().setConversations(parsed.conversations)
        useChatStore.getState().addMessages(parsed.messages)
        importStore.setStatus('Import complete')
        importStore.setProgress(100)
        return
      }
      if(names.some(n=>n.toLowerCase().endsWith('.db')||n.toLowerCase().endsWith('.sqlite'))){
        const dbName = names.find(n=>/\.db$|\.sqlite$|msgstore/i.test(n))!
        const arr = await zip.file(dbName)!.async('uint8array')
        await sqliteService.openDatabaseFromBytes(arr)
        importStore.setStatus('Database loaded from ZIP')
        importStore.setProgress(100)
        return
      }
      importStore.setStatus('ZIP processed — media available')
      importStore.setProgress(100)
      return
    }
    if(ext === 'db' || ext === 'sqlite' || file.name.toLowerCase().includes('msgstore')){
      importStore.setStatus('Opening SQLite database...')
      const arr = new Uint8Array(await file.arrayBuffer())
      await sqliteService.openDatabaseFromBytes(arr)
      importStore.setStatus('Database loaded')
      importStore.setProgress(100)
      return
    }
    if(ext?.startsWith('crypt')){
      importStore.setStatus('Encrypted backup selected — please provide key material via the Encrypted Backup workflow')
      importStore.setProgress(0)
      return
    }
    importStore.setStatus('Unsupported file format')
    importStore.setProgress(0)
  }
}
