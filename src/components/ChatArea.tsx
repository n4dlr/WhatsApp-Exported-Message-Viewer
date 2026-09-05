import React, { useState } from 'react'
import MessageList from './MessageList'
import { useChatStore } from '../stores/chatStore'
import {
  Search,
  Database,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Lock,
  X,
  Users,
  Info
} from 'lucide-react'

export default function ChatArea() {
  const {
    conversations,
    activeConversationId,
    inChatSearchQuery,
    setInChatSearchQuery,
    setIsChatDetailsOpen,
    setIsTableExplorerOpen
  } = useChatStore()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const conversation = conversations.find(item => item.id === activeConversationId)

  // Empty state when no chat is selected
  if (!conversation) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none border-b-8 border-[var(--wa-green)]"
        style={{ backgroundColor: 'var(--wa-header-bg)' }}
      >
        <div className="w-64 h-64 mb-6 opacity-80 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-[var(--wa-green)]/30 flex items-center justify-center">
            <span className="text-7xl">💬</span>
          </div>
        </div>

        <h2 className="text-3xl font-light text-[var(--wa-text-primary)] mb-3 font-sans">
          WhatsApp Arxiv Baxıcısı
        </h2>
        <p className="text-sm text-[var(--wa-text-secondary)] max-w-md leading-relaxed mb-8">
          600MB və 5GB+ böyük WhatsApp SQLite bazalarını birbaşa brauzerdə donmadan açın, bütün sütunlardakı məlumatları və media fayllarını incələyin.
        </p>

        <div className="flex items-center gap-2 text-xs text-[var(--wa-text-secondary)]">
          <Lock size={14} className="text-[var(--wa-green)]" />
          <span>Bütün məlumatlar tamamilə lokal olaraq işlənir</span>
        </div>
      </div>
    )
  }

  const initials = (conversation.name || 'W')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .slice(0, 2)
    .toUpperCase() || 'W'

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* WhatsApp Chat Top Header */}
      <div
        className="h-[60px] px-4 flex items-center justify-between border-b flex-shrink-0 z-20 select-none shadow-sm"
        style={{
          backgroundColor: 'var(--wa-header-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Chat Avatar & Info (Clickable for Chat Details) */}
        <div
          onClick={() => setIsChatDetailsOpen(true)}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm">
            {conversation.isGroup ? <Users size={20} /> : initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-normal text-[var(--wa-text-primary)] truncate font-sans leading-snug">
              {conversation.name}
            </div>
            <div className="text-[12px] text-[var(--wa-text-secondary)] truncate">
              {conversation.isGroup
                ? `${conversation.messageCount ? conversation.messageCount.toLocaleString() + ' mesaj • ' : ''}Qrup söhbəti`
                : conversation.phoneNumber ? `+${conversation.phoneNumber}` : 'Şəxsi söhbət'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 text-[var(--wa-text-secondary)] flex-shrink-0">
          {/* Search in chat */}
          <button
            type="button"
            title="Söhbətdə axtarış"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors ${
              isSearchOpen || inChatSearchQuery ? 'text-[var(--wa-green)] bg-[var(--wa-hover)]' : ''
            }`}
          >
            <Search size={20} />
          </button>

          {/* Inspect Chat Raw DB Columns */}
          <button
            type="button"
            title="Çatın Bütün Sütunlarına Bax (Raw DB Info)"
            onClick={() => setIsChatDetailsOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
          >
            <Database size={20} />
          </button>

          {/* More options */}
          <button
            type="button"
            title="Detallar"
            onClick={() => setIsChatDetailsOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar (Slide down) */}
      {isSearchOpen && (
        <div
          className="px-4 py-2 border-b flex items-center gap-3 z-10 animate-fade-in shadow-inner"
          style={{
            backgroundColor: 'var(--wa-search-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <Search size={18} className="text-[var(--wa-text-secondary)]" />
          <input
            type="text"
            value={inChatSearchQuery}
            onChange={e => setInChatSearchQuery(e.target.value)}
            placeholder="Bu söhbətdə mesajları axtarın..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)]"
          />
          {inChatSearchQuery && (
            <button
              type="button"
              onClick={() => setInChatSearchQuery('')}
              className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false)
              setInChatSearchQuery('')
            }}
            className="text-xs text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] px-2 py-1 rounded"
          >
            Bağla
          </button>
        </div>
      )}

      {/* Messages Canvas with WhatsApp Doodle Background */}
      <div className="flex-1 relative min-h-0 whatsapp-chat-bg">
        <MessageList />
      </div>

      {/* WhatsApp Input Footer */}
      <div
        className="h-[62px] px-4 flex items-center gap-3 border-t flex-shrink-0 z-20 select-none"
        style={{
          backgroundColor: 'var(--wa-header-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        <button
          type="button"
          disabled
          className="text-[var(--wa-text-secondary)] opacity-60 cursor-default"
        >
          <Smile size={24} />
        </button>
        <button
          type="button"
          disabled
          className="text-[var(--wa-text-secondary)] opacity-60 cursor-default"
        >
          <Paperclip size={24} />
        </button>

        <div
          className="flex-1 px-4 py-2 rounded-lg text-sm flex items-center justify-between"
          style={{ backgroundColor: 'var(--wa-search-bg)' }}
        >
          <input
            type="text"
            disabled
            placeholder="WhatsApp Arxiv Baxıcısı — yalnız oxumaq üçün"
            className="w-full bg-transparent border-none outline-none text-[var(--wa-text-secondary)] text-[14.5px] cursor-default"
          />
        </div>

        <button
          type="button"
          disabled
          className="text-[var(--wa-text-secondary)] opacity-60 cursor-default"
        >
          <Mic size={24} />
        </button>
      </div>
    </div>
  )
}
