import React, { useState } from 'react'
import { useImportStore } from '../stores/importStore'
import JSZip from 'jszip'
import { importService } from '../services/importService'

export default function ImportCenter(){
  const [dragOver,setDragOver] = useState(false)
  const { importFile, progress, status, openSessions } = useImportStore()

  async function handleFiles(files:FileList|null){
    if(!files || files.length===0) return
    const f = files[0]
    await importService.processFile(f)
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
        <h2 className="text-lg font-semibold mb-2">Import Center</h2>
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

        <div className="mt-4">
          <div className="text-sm">Status: {status}</div>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div style={{width: Math.min(100, progress)+'%'}} className="h-2 bg-green-500 rounded"></div>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <div>Previously opened sessions:</div>
          <ul className="list-disc pl-5">
            {openSessions.map(s => <li key={s.sessionId}>{s.name} — {s.sourceType} — {s.messageCount} messages</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
