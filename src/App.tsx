import React, { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ImportCenter from './components/ImportCenter'
import MessageInspectorDrawer from './components/MessageInspectorDrawer'
import TableExplorerModal from './components/TableExplorerModal'
import ChatDetailsDrawer from './components/ChatDetailsDrawer'
import ContactEditModal from './components/ContactEditModal'
import { useChatStore } from './stores/chatStore'

export default function App() {
  const { theme, remoteSessionId, setRemoteSession } = useChatStore()

  useEffect(() => {
    document.title = 'WhatsApp Web'
    if (theme === 'light') {
      document.body.classList.add('light-mode')
      document.documentElement.classList.remove('dark')
    } else {
      document.body.classList.remove('light-mode')
      document.documentElement.classList.add('dark')
    }
  }, [theme])

  // Auto-connect to detected local database if no session is open
  useEffect(() => {
    if (remoteSessionId) return

    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    fetch(`${backendUrl}/api/detect-local`)
      .then(res => res.json())
      .then(async data => {
        if (data.detected && data.detected.length > 0) {
          const defaultDb = data.detected[0]
          try {
            const res = await fetch(`${backendUrl}/api/import/local-file`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: defaultDb.filePath })
            })
            if (res.ok) {
              const sessionData = await res.json()
              setRemoteSession(sessionData.sessionId, sessionData.stats)
            }
          } catch (e) {
            console.error('Auto-connect to local database error:', e)
          }
        }
      })
      .catch(console.error)
  }, [remoteSessionId, setRemoteSession])

  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-[var(--wa-app-bg)]">
      {/* WhatsApp Web Desktop Shell */}
      <div
        className="w-full h-full xl:w-[1680px] xl:h-[95vh] xl:rounded-xl overflow-hidden flex shadow-2xl relative border border-black/10"
        style={{
          backgroundColor: 'var(--wa-panel-bg)'
        }}
      >
        <Sidebar />
        <ChatArea />
      </div>

      {/* Modals & Drawers */}
      <ImportCenter />
      <MessageInspectorDrawer />
      <TableExplorerModal />
      <ChatDetailsDrawer />
      <ContactEditModal />
    </div>
  )
}
