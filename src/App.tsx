import React, { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ImportCenter from './components/ImportCenter'
import { useImportStore } from './stores/importStore'

export default function App(){
  const { hasSession, sessionCount } = useImportStore()

  useEffect(()=>{
    document.title = 'ChatVault Viewer'
  },[])

  return (
    <div className="flex app-shell">
      <Sidebar />
      <div className="chat-area flex-1 flex flex-col">
        <ChatArea />
      </div>

      {!hasSession && <ImportCenter />}
    </div>
  )
}
