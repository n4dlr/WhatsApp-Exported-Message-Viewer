import React, { useState } from 'react'
import MessageList from './MessageList'
import { useChatStore } from '../stores/chatStore'
import {
  formatPhoneNumber
} from '../utils/formatters'
import {
  Search,
  Database,
  Smile,
  Paperclip,
  Mic,
  Lock,
  X,
  Users,
  Info,
  Phone,
  Video,
  MoreVertical,
  Trash2,
  CheckCheck,
  Edit3,
  Send,
  UserCheck,
  User
} from 'lucide-react'

type SenderMode = 'me' | 'contact' | 'custom'

const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🙏', '👏', '🎉', '😢', '😮', '🥳', '😎', '👌', '🤝', '✨']

export default function ChatArea() {
  const {
    conversations,
    activeConversationId,
    inChatSearchQuery,
    setInChatSearchQuery,
    setIsChatDetailsOpen,
    setIsTableExplorerOpen,
    messages,
    sendMessage,
    setChatToDelete,
    markAsRead,
    markAsUnread,
    setEditingContact,
    customContacts
  } = useChatStore()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)
  const [senderMode, setSenderMode] = useState<SenderMode>('me')
  const [customSenderName, setCustomSenderName] = useState('')
  const [isCustomNameInputOpen, setIsCustomNameInputOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const conversation = conversations.find(item => item.id === activeConversationId)

  // Empty state when no chat is selected
  if (!conversation) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none border-b-8 border-[var(--wa-green)]"
        style={{ backgroundColor: 'var(--wa-header-bg)' }}
      >
        <div className="w-64 h-64 mb-6 opacity-80 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-[var(--wa-green)]/30 flex items-center justify-center bg-[var(--wa-green)]/5">
            <span className="text-7xl">💬</span>
          </div>
        </div>

        <h2 className="text-3xl font-light text-[var(--wa-text-primary)] mb-3 font-sans tracking-wide">
          WhatsApp Arxiv Baxıcısı
        </h2>
        <p className="text-sm text-[var(--wa-text-secondary)] max-w-md leading-relaxed mb-8">
          Böyük WhatsApp SQLite bazalarını birbaşa brauzerdə açın, istənilən şəxsin adından mesaj yazın, silin və bütün arxivə baxın.
        </p>

        <div className="flex items-center gap-2 text-xs text-[var(--wa-text-secondary)] bg-black/10 px-4 py-2 rounded-full">
          <Lock size={14} className="text-[var(--wa-green)]" />
          <span>Bütün məlumatlar tamamilə lokal olaraq işlənir • Məxfilik təmin olunur</span>
        </div>
      </div>
    )
  }

  // Name resolution
  const customContactName = conversation.phoneNumber ? customContacts[conversation.phoneNumber] : null
  const contactResolvedName = customContactName || conversation.contactName

  const displayName = conversation.isGroup
    ? (conversation.name || 'Qrup Söhbəti')
    : (contactResolvedName || formatPhoneNumber(conversation.phoneNumber) || conversation.name || 'Söhbət')

  const initials = displayName
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .slice(0, 2)
    .toUpperCase() || 'W'

  const searchMatchesCount = inChatSearchQuery
    ? messages.filter(m => m.body?.toLowerCase().includes(inChatSearchQuery.toLowerCase())).length
    : 0

  const handleSend = () => {
    const text = inputText.trim()
    if (!text || !conversation) return

    const isOutgoing = senderMode === 'me'
    let senderName = 'Həmsöhbət'
    if (senderMode === 'contact') {
      senderName = displayName
    } else if (senderMode === 'custom') {
      senderName = customSenderName.trim() || 'Fərdi Şəxs'
    }

    sendMessage(conversation.id, text, isOutgoing, {
      name: senderName,
      phoneNumber: conversation.phoneNumber || undefined
    })

    setInputText('')
    setShowEmojiPicker(false)
  }

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji)
  }

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
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 flex-1 min-w-0 py-1"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm">
            {conversation.isGroup ? <Users size={20} /> : initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-normal text-[var(--wa-text-primary)] truncate font-sans leading-snug">
              {displayName}
            </div>
            <div className="text-[12px] text-[var(--wa-text-secondary)] truncate">
              {conversation.isGroup
                ? `${conversation.messageCount ? conversation.messageCount.toLocaleString() + ' mesaj • ' : ''}Qrup söhbəti`
                : conversation.phoneNumber ? `+${conversation.phoneNumber} • online` : 'Şəxsi söhbət'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 text-[var(--wa-text-secondary)] flex-shrink-0">
          {/* Video Call (Disabled/Archive) */}
          <button
            type="button"
            title="Video zəng"
            className="p-2 rounded-full opacity-60 hover:opacity-80 transition-opacity cursor-default"
          >
            <Video size={19} />
          </button>

          {/* Voice Call (Disabled/Archive) */}
          <button
            type="button"
            title="Səsli zəng"
            className="p-2 rounded-full opacity-60 hover:opacity-80 transition-opacity cursor-default"
          >
            <Phone size={18} />
          </button>

          <div className="w-px h-5 bg-[var(--wa-border)] mx-1" />

          {/* Search in chat */}
          <button
            type="button"
            title="Söhbətdə axtarış"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors ${
              isSearchOpen || inChatSearchQuery ? 'text-[var(--wa-green)] bg-[var(--wa-hover)]' : ''
            }`}
          >
            <Search size={19} />
          </button>

          {/* Inspect Chat Raw DB Columns */}
          <button
            type="button"
            title="Çatın Bütün Sütunlarına Bax (Raw DB Info)"
            onClick={() => setIsChatDetailsOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
          >
            <Database size={19} />
          </button>

          {/* Info Drawer Toggle */}
          <button
            type="button"
            title="Söhbət haqqında"
            onClick={() => setIsChatDetailsOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
          >
            <Info size={19} />
          </button>

          {/* 3-dots Header Menu */}
          <div className="relative">
            <button
              type="button"
              title="Seçimlər"
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
            >
              <MoreVertical size={19} />
            </button>

            {headerMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 py-2 rounded-xl shadow-2xl z-50 text-sm animate-fade-in border select-none"
                style={{
                  backgroundColor: 'var(--wa-header-bg)',
                  borderColor: 'var(--wa-border)'
                }}
              >
                {/* Mark as read */}
                <button
                  type="button"
                  onClick={() => {
                    markAsRead(conversation.id)
                    setHeaderMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)] cursor-pointer"
                >
                  <CheckCheck size={17} className="text-[var(--wa-blue-check)]" />
                  <span>Oxunmuş kimi işarələ (Görüldü)</span>
                </button>

                {/* Edit contact name */}
                {!conversation.isGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContact({
                        identifier: conversation.phoneNumber || conversation.id,
                        currentName: displayName
                      })
                      setHeaderMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)] cursor-pointer"
                  >
                    <Edit3 size={17} className="text-[var(--wa-green)]" />
                    <span>Kontakt adını dəyiş</span>
                  </button>
                )}

                <div className="h-px my-1 bg-[var(--wa-border)]" />

                {/* Delete Chat */}
                <button
                  type="button"
                  onClick={() => {
                    setChatToDelete(conversation)
                    setHeaderMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[#ef5350] cursor-pointer font-medium"
                >
                  <Trash2 size={17} />
                  <span>Söhbəti Sil</span>
                </button>
              </div>
            )}
          </div>
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
          <Search size={16} className="text-[var(--wa-text-secondary)]" />
          <input
            type="text"
            value={inChatSearchQuery}
            onChange={e => setInChatSearchQuery(e.target.value)}
            placeholder="Bu söhbətdə mesajları axtarın..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)]"
          />
          {inChatSearchQuery && (
            <span className="text-xs text-[var(--wa-text-secondary)] px-2">
              {searchMatchesCount} nəticə
            </span>
          )}
          {inChatSearchQuery && (
            <button
              type="button"
              onClick={() => setInChatSearchQuery('')}
              className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <X size={15} />
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

      {/* Quick Emoji Bar Popup */}
      {showEmojiPicker && (
        <div
          className="px-4 py-2 border-t flex items-center gap-2 text-xl overflow-x-auto no-scrollbar z-20 animate-fade-in shadow-lg"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="hover:scale-125 transition-transform p-1 rounded hover:bg-[var(--wa-hover)] cursor-pointer select-none"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(false)}
            className="ml-auto p-1 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Custom Sender Name Bar (if selected) */}
      {isCustomNameInputOpen && (
        <div
          className="px-4 py-1.5 border-t flex items-center gap-2 text-xs z-20 bg-[var(--wa-search-bg)]"
          style={{ borderColor: 'var(--wa-border)' }}
        >
          <span className="text-[var(--wa-text-secondary)]">Göndərən şəxsin adı:</span>
          <input
            type="text"
            value={customSenderName}
            onChange={e => setCustomSenderName(e.target.value)}
            placeholder="Məsələn: Rəşad və ya +994501234567"
            className="flex-1 px-2 py-1 rounded bg-[var(--wa-header-bg)] text-[var(--wa-text-primary)] border border-white/10 outline-none text-xs"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCustomNameInputOpen(false)}
            className="text-[var(--wa-green)] font-semibold px-2 py-0.5 rounded hover:bg-[var(--wa-hover)]"
          >
            Təsdiq
          </button>
        </div>
      )}

      {/* WhatsApp Input Footer with Sender Switcher and Active Typing */}
      <div
        className="px-4 py-2.5 flex flex-col gap-2 border-t flex-shrink-0 z-20 select-none shadow-md"
        style={{
          backgroundColor: 'var(--wa-header-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Top Mini Pill: "Kiminsə Adından Göndər" (Sender Switcher) */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--wa-text-secondary)] font-medium text-[11px] uppercase tracking-wider">
              Mesajı göndərən:
            </span>

            {/* Mode 1: Siz (Outgoing) */}
            <button
              type="button"
              onClick={() => {
                setSenderMode('me')
                setIsCustomNameInputOpen(false)
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                senderMode === 'me'
                  ? 'bg-[var(--wa-green)] text-[#111b21] shadow-sm font-semibold'
                  : 'bg-[var(--wa-search-bg)] text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
              }`}
            >
              <UserCheck size={13} />
              <span>Siz (Outgoing)</span>
            </button>

            {/* Mode 2: Həmsöhbət (Incoming) */}
            <button
              type="button"
              onClick={() => {
                setSenderMode('contact')
                setIsCustomNameInputOpen(false)
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                senderMode === 'contact'
                  ? 'bg-[#202c33] text-[var(--wa-green)] border border-[var(--wa-green)]/40 shadow-sm font-semibold'
                  : 'bg-[var(--wa-search-bg)] text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
              }`}
            >
              <User size={13} />
              <span className="truncate max-w-[130px]">{displayName}</span>
            </button>

            {/* Mode 3: Custom Name */}
            <button
              type="button"
              onClick={() => {
                setSenderMode('custom')
                setIsCustomNameInputOpen(true)
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                senderMode === 'custom'
                  ? 'bg-[#202c33] text-[#ffd279] border border-[#ffd279]/40 shadow-sm font-semibold'
                  : 'bg-[var(--wa-search-bg)] text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
              }`}
            >
              <Edit3 size={12} />
              <span>{customSenderName ? customSenderName : 'Başqa adla...'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[var(--wa-blue-check)] font-medium">
            <CheckCheck size={14} />
            <span>Görüldü (✓✓)</span>
          </div>
        </div>

        {/* Bottom Main Bar: Emoji, Clip, Input, Send */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji seç"
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'text-[var(--wa-green)] bg-[var(--wa-hover)]'
                : 'text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)]'
            }`}
          >
            <Smile size={23} />
          </button>

          <button
            type="button"
            title="Fayl əlavə et"
            className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <Paperclip size={22} />
          </button>

          <div
            className="flex-1 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between shadow-inner focus-within:ring-1 focus-within:ring-[var(--wa-green)]/40 transition-all"
            style={{ backgroundColor: 'var(--wa-search-bg)' }}
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={
                senderMode === 'me'
                  ? 'Mesaj yazın (Siz göndərirsiniz)...'
                  : senderMode === 'contact'
                  ? `Mesaj yazın (${displayName} adından)...`
                  : `Mesaj yazın (${customSenderName || 'Fərdi şəxs'} adından)...`
              }
              className="w-full bg-transparent border-none outline-none text-[var(--wa-text-primary)] text-[14.5px] placeholder-[var(--wa-text-secondary)]"
            />
          </div>

          {/* Send or Mic Button */}
          {inputText.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              title="Göndər"
              className="w-10 h-10 rounded-full bg-[var(--wa-green)] hover:brightness-110 active:scale-95 text-[#111b21] flex items-center justify-center shadow transition-all cursor-pointer flex-shrink-0"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              title="Səsli mesaj"
              className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] p-2 rounded-full transition-colors cursor-pointer flex-shrink-0"
            >
              <Mic size={23} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
