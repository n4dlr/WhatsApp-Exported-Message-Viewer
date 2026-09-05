import JSZip from 'jszip'
import { useChatStore } from '../stores/chatStore'
import { useImportStore } from '../stores/importStore'
import { sqliteService } from './sqliteService'
import { uploadLargeDatabase } from './largeDatabaseService'

export const importService = {
  async processFile(file: File){
    const ext = file.name.split('.').pop()?.toLowerCase()
    const importStore = useImportStore.getState()
    importStore.setStatus('Detecting format...')
    try {
      if(ext === 'txt'){
      importStore.setStatus('Parsing TXT export...')
      const text = await file.text()
      const parsed = (await import('../parsers/txtParser')).parseTxt(text)
      // apply normalized model
      useChatStore.getState().setMessages(parsed.messages)
      useChatStore.getState().setConversations(parsed.conversations)
      importStore.completeSession({
        sessionId: crypto.randomUUID(),
        name: file.name,
        sourceType: 'TXT',
        messageCount: parsed.messages.length
      })
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
        useChatStore.getState().setMessages(parsed.messages)
        useChatStore.getState().setConversations(parsed.conversations)
        importStore.completeSession({
          sessionId: crypto.randomUUID(),
          name: file.name,
          sourceType: 'ZIP',
          messageCount: parsed.messages.length
        })
        importStore.setStatus('Import complete')
        importStore.setProgress(100)
        return
      }
      if(names.some(n=>n.toLowerCase().endsWith('.db')||n.toLowerCase().endsWith('.sqlite'))){
        const dbName = names.find(n=>/\.db$|\.sqlite$|msgstore/i.test(n))!
        const arr = await zip.file(dbName)!.async('uint8array')
        const model = await sqliteService.openDatabaseFromBytes(arr)
        importStore.completeSession({
          sessionId: crypto.randomUUID(),
          name: file.name,
          sourceType: 'SQLite',
          messageCount: model.messages.length
        })
        importStore.setStatus('Database loaded from ZIP')
        importStore.setProgress(100)
        return
      }
      importStore.setStatus('ZIP processed — media available')
      importStore.setProgress(100)
      return
    }
    if(ext === 'db' || ext === 'sqlite' || file.name.toLowerCase().includes('msgstore')){
      if (file.size >= 100 * 1024 * 1024) {
        importStore.setStatus('Uploading large SQLite database...')
        importStore.setProgress(0)
        const model = await uploadLargeDatabase(
          file,
          import.meta.env.VITE_BACKEND_URL ?? '',
          progress => {
            importStore.setProgress(10 + Math.round(progress * 0.6))
            importStore.setStatus(`Uploading large database... ${progress}%`)
          }
        )
        importStore.setProgress(85)
        importStore.setStatus('Inspecting SQLite schema and preparing message index...')
        useChatStore.getState().setMessages(model.messages)
        useChatStore.getState().setConversations(model.conversations)
        useChatStore.getState().setRemoteSession(model.sessionId, model.totalMessages)
        importStore.completeSession({
          sessionId: crypto.randomUUID(),
          name: file.name,
          sourceType: 'Large SQLite',
          messageCount: model.totalMessages
        })
        importStore.setStatus(`Database ready — ${model.totalMessages} messages available`)
        importStore.setProgress(100)
        return
      }
      importStore.setStatus('Opening SQLite database...')
      const arr = new Uint8Array(await file.arrayBuffer())
      const model = await sqliteService.openDatabaseFromBytes(arr)
      importStore.completeSession({
        sessionId: crypto.randomUUID(),
        name: file.name,
        sourceType: 'SQLite',
        messageCount: model.messages.length
      })
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
    } catch (error) {
      console.error('Import failed', error)
      importStore.setStatus(error instanceof Error ? error.message : 'Import failed. Check that the file is valid and try again.')
      importStore.setProgress(0)
    }
  }
}
