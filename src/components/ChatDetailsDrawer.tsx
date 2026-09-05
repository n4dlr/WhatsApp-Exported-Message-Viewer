import React, { useEffect, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import {
  X,
  Users,
  Database,
  Calendar,
  Lock,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function ChatDetailsDrawer() {
  const {
    isChatDetailsOpen,
    setIsChatDetailsOpen,
    activeConversationId,
    conversations,
    remoteSessionId
  } = useChatStore()

  const [rawChatData, setRawChatData] = useState<any>(null)
  const [showRawColumns, setShowRawColumns] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeChat = conversations.find(c => c.id === activeConversationId)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || ''

  useEffect(() => {
    if (!isChatDetailsOpen || !activeConversationId || !remoteSessionId) return

    fetch(`${backendUrl}/api/session/${remoteSessionId}/chats/${activeConversationId}/raw`)
      .then(res => res.json())
      .then(d => setRawChatData(d))
      .catch(console.error)
  }, [isChatDetailsOpen, activeConversationId, remoteSessionId])

  if (!isChatDetailsOpen || !activeChat) return null

  const handleCopyJson = () => {
    if (rawChatData) {
      navigator.clipboard.writeText(JSON.stringify(rawChatData, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-[480px] max-w-[90vw] h-full flex flex-col shadow-2xl border-l animate-slide-left overflow-y-auto"
        style={{
          backgroundColor: 'var(--wa-panel-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Header */}
        <div
          className="h-[60px] px-5 flex items-center justify-between border-b flex-shrink-0"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <span className="font-semibold text-sm text-[var(--wa-text-primary)]">
            Çat Məlumatları (Söhbət Haqqında)
          </span>
          <button
            type="button"
            onClick={() => setIsChatDetailsOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div
          className="p-6 flex flex-col items-center text-center border-b"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <div className="w-24 h-24 rounded-full bg-[var(--wa-green)] text-white font-bold text-3xl flex items-center justify-center shadow-lg mb-4">
            {activeChat.isGroup ? <Users size={44} /> : (activeChat.name?.slice(0, 2).toUpperCase() || 'W')}
          </div>
          <h3 className="text-xl font-medium text-[var(--wa-text-primary)] mb-1">
            {activeChat.name}
          </h3>
          <p className="text-xs text-[var(--wa-text-secondary)] font-mono">
            {activeChat.jid}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b" style={{ borderColor: 'var(--wa-border)' }}>
          <div className="p-3 rounded-lg bg-[var(--wa-search-bg)] flex items-center gap-3">
            <MessageSquare size={18} className="text-[var(--wa-green)]" />
            <div>
              <div className="text-[11px] text-[var(--wa-text-secondary)]">Mesaj Sayı</div>
              <div className="font-semibold text-sm text-[var(--wa-text-primary)]">
                {activeChat.messageCount != null ? activeChat.messageCount.toLocaleString() : '-'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--wa-search-bg)] flex items-center gap-3">
            <Calendar size={18} className="text-[var(--wa-green)]" />
            <div>
              <div className="text-[11px] text-[var(--wa-text-secondary)]">Son Aktivlik</div>
              <div className="font-semibold text-sm text-[var(--wa-text-primary)]">
                {activeChat.lastTimestamp ? new Date(activeChat.lastTimestamp).toLocaleDateString() : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Encryption Section */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--wa-border)' }}>
          <Lock size={18} className="text-[var(--wa-green)]" />
          <div className="text-xs">
            <div className="font-medium text-[var(--wa-text-primary)]">Uçdan-Uca Şifrələnmə</div>
            <div className="text-[var(--wa-text-secondary)]">Mesajlar və zənglər qorunur</div>
          </div>
        </div>

        {/* Collapsible: All 54 Columns of `chat` Table */}
        <div className="p-4 flex-1">
          <button
            type="button"
            onClick={() => setShowRawColumns(!showRawColumns)}
            className="w-full p-3 rounded-lg bg-[var(--wa-search-bg)] flex items-center justify-between text-xs font-semibold text-[var(--wa-green)] hover:opacity-90"
          >
            <div className="flex items-center gap-2">
              <Database size={15} />
              <span>`chat` Cədvəlinin Bütün Sütunları ({rawChatData?.chat ? Object.keys(rawChatData.chat).length : 54} sütun)</span>
            </div>
            {showRawColumns ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showRawColumns && rawChatData?.chat && (
            <div className="mt-3 rounded-lg border overflow-hidden text-xs" style={{ borderColor: 'var(--wa-border)' }}>
              <div className="p-2 bg-black/20 flex justify-between items-center border-b" style={{ borderColor: 'var(--wa-border)' }}>
                <span className="text-[var(--wa-text-secondary)]">SQLite xam cərgəsi</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2 py-1 rounded bg-white/10 text-[var(--wa-text-primary)] hover:bg-white/20 flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check size={12} className="text-[var(--wa-green)]" /> : <Copy size={12} />}
                  <span>Kopyala</span>
                </button>
              </div>

              <div className="max-h-[360px] overflow-auto divide-y divide-white/5 font-mono">
                {Object.entries(rawChatData.chat).map(([col, val]) => (
                  <div key={col} className="p-2 flex items-baseline justify-between hover:bg-white/5 gap-2">
                    <span className="text-[var(--wa-text-primary)] font-semibold truncate">{col}:</span>
                    <span className="text-[var(--wa-text-secondary)] break-all text-right">
                      {val === null ? <em className="text-gray-500">NULL</em> : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
