import React, { useState } from 'react'
import { useImportStore } from '../stores/importStore'
import { importService } from '../services/importService'
import { encryptedBackupService } from '../services/encryptedBackupService'
import { useChatStore } from '../stores/chatStore'
import SettingsModal from './SettingsModal'

export default function ImportCenter(){
  const [dragOver,setDragOver] = useState(false)
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null)
  const [keyMaterial, setKeyMaterial] = useState('')
  const [keyError, setKeyError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { progress, status, openSessions, setProgress, setStatus } = useImportStore()

  async function handleFiles(files:FileList|null){
    if(!files || files.length===0) return
    const f = files[0]
    if (/\.(crypt\d*|crypt)$/i.test(f.name)) {
      setEncryptedFile(f)
      setKeyMaterial('')
      setKeyError('')
      return
    }
    await importService.processFile(f)
  }

  async function handleEncryptedSubmit(event:React.FormEvent){
    event.preventDefault()
    if (!encryptedFile) return
    setKeyError('')
    setIsUnlocking(true)
    setProgress(5)
    setStatus('Validating backup key...')
    try {
      await new Promise(resolve => window.setTimeout(resolve, 150))
      setProgress(20)
      setStatus('Uploading encrypted backup to local backend...')
      const unlocked = await encryptedBackupService.processEncryptedBackup(
        encryptedFile,
        keyMaterial,
        `${import.meta.env.VITE_BACKEND_URL ?? ''}/api/import/encrypted-backup`,
        uploadProgress => {
          setProgress(20 + Math.round(uploadProgress * 0.45))
          setStatus(`Uploading encrypted backup... ${uploadProgress}%`)
        }
      )
      setProgress(65)
      setStatus('Decrypting backup and verifying payload...')
      await new Promise(resolve => window.setTimeout(resolve, 150))
      setProgress(80)
      setStatus('Opening decrypted SQLite database...')
      const model = { messages: unlocked.messages, conversations: unlocked.conversations }
      useChatStore.getState().setMessages(model.messages)
      useChatStore.getState().setConversations(model.conversations)
      useChatStore.getState().setRemoteSession(unlocked.sessionId, unlocked.totalMessages)
      useImportStore.getState().completeSession({
        sessionId: crypto.randomUUID(),
        name: encryptedFile.name,
        sourceType: 'Encrypted SQLite',
        messageCount: model.messages.length
      })
      setStatus(`Backup unlocked — ${model.messages.length} messages loaded`)
      setProgress(100)
      setEncryptedFile(null)
      setKeyMaterial('')
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : 'Encrypted backup could not be processed.')
      setStatus('Backup unlock failed')
      setProgress(0)
    } finally {
      setIsUnlocking(false)
    }
  }

  async function handleDrop(e:React.DragEvent){
    e.preventDefault(); setDragOver(false)
    if(e.dataTransfer.files.length>0){
      await handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className={`w-[800px] bg-white rounded shadow-lg p-6 border`} onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import Center</h2>
          <button type="button" onClick={()=>setSettingsOpen(true)} className="rounded px-3 py-1 text-sm hover:bg-gray-100" aria-label="Open settings">
            Settings
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Drag & drop your WhatsApp exported chat (ZIP or TXT), media ZIP, or SQLite database (msgstore.db). For encrypted backups, use the Encrypted Backup option.</p>

        <div className="grid grid-cols-4 gap-3">
          <label className="col-span-1 p-4 border rounded cursor-pointer text-center">
            <input type="file" className="hidden" onChange={(e)=>handleFiles(e.target.files)} accept=".zip,.txt,.db,.sqlite" />
            <div className="font-semibold">Import Chat Export</div>
            <div className="text-xs text-gray-500">TXT / ZIP</div>
          </label>
          <label className="col-span-1 p-4 border rounded cursor-pointer text-center">
            <input type="file" className="hidden" onChange={(e)=>handleFiles(e.target.files)} accept=".zip" />
            <div className="font-semibold">Import Media ZIP</div>
            <div className="text-xs text-gray-500">ZIP of media files</div>
          </label>
          <label className="col-span-1 p-4 border rounded cursor-pointer text-center">
            <input type="file" className="hidden" onChange={(e)=>handleFiles(e.target.files)} accept=".db,.sqlite,.sql" />
            <div className="font-semibold">Import Database</div>
            <div className="text-xs text-gray-500">msgstore.db / SQLite</div>
          </label>
          <label className="col-span-1 p-4 border rounded cursor-pointer text-center">
            <input type="file" className="hidden" onChange={(e)=>handleFiles(e.target.files)} accept=".crypt15,.crypt14,.crypt" />
            <div className="font-semibold">Import Encrypted Backup</div>
            <div className="text-xs text-gray-500">.crypt15 + key material</div>
          </label>
        </div>

        {encryptedFile && (
          <form onSubmit={handleEncryptedSubmit} className="mt-5 rounded border border-amber-200 bg-amber-50 p-4">
            <div className="font-semibold">Enter backup password / key material</div>
            <div className="mt-1 text-xs text-gray-600">
              Selected: {encryptedFile.name}. This value is used only for this import and is not saved.
            </div>
            <input
              type="password"
              value={keyMaterial}
              onChange={event=>setKeyMaterial(event.target.value)}
              className="mt-3 w-full rounded border bg-white p-2"
              placeholder="Supported key material"
              autoFocus
              required
            />
            {keyError && <div className="mt-2 text-sm text-red-700">{keyError}</div>}
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={isUnlocking} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60">
                {isUnlocking ? 'Unlocking...' : 'Unlock backup'}
              </button>
              <button type="button" disabled={isUnlocking} onClick={()=>setEncryptedFile(null)} className="rounded border px-4 py-2 text-sm disabled:opacity-60">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4">
          <div className="text-sm">Status: {status}</div>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div style={{width: Math.min(100, progress)+'%'}} className={`h-2 rounded transition-all duration-300 ${isUnlocking ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
          </div>
          {isUnlocking && <div className="mt-2 text-xs text-gray-500">Please keep this window open while the local backup is being unlocked.</div>}
        </div>

        <div className="mt-4 text-sm">
          <div>Previously opened sessions:</div>
          <ul className="list-disc pl-5">
            {openSessions.map(s => <li key={s.sessionId}>{s.name} — {s.sourceType} — {s.messageCount} messages</li>)}
          </ul>
        </div>
        {settingsOpen && <SettingsModal onClose={()=>setSettingsOpen(false)} />}
      </div>
    </div>
  )
}
