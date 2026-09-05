import React from 'react'
import ChatList from './ChatList'
import { Users } from 'lucide-react'
import { useState } from 'react'
import SettingsModal from './SettingsModal'

export default function Sidebar(){
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <>
    <div className="sidebar border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <Users size={20} />
        </div>
        <div className="flex-1">
          <div className="font-semibold">ChatVault Viewer</div>
          <div className="text-xs text-gray-500">Local-first WhatsApp-style viewer</div>
        </div>
        <button type="button" onClick={()=>setSettingsOpen(true)} className="p-2 rounded hover:bg-gray-100" aria-label="Open settings">⋮</button>
      </div>

      <div className="flex-1 overflow-auto">
        <ChatList />
      </div>
    </div>
    {settingsOpen && <SettingsModal onClose={()=>setSettingsOpen(false)} />}
    </>
  )
}
