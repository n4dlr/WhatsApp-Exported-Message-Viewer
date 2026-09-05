import React, { useState, useRef, useEffect } from 'react'
import { Conversation } from '../types/conversation'
import { useChatStore } from '../stores/chatStore'
import {
  formatPhoneNumber,
  formatWhatsAppTime,
  getParticipantColor
} from '../utils/formatters'
import {
  Check,
  CheckCheck,
  Users,
  Archive,
  Camera,
  Mic,
  Video,
  FileText,
  Smile,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react'

export default function ChatItem({ conversation }: { conversation: Conversation }) {
  const {
    activeConversationId,
    selectConversation,
    customContacts,
    isArchivedView,
    setChatToDelete,
    markAsRead,
    markAsUnread
  } = useChatStore()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const isSelected = conversation.id === activeConversationId

  // Close context menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  // Custom contact name override or database contact name
  const customName = conversation.phoneNumber ? customContacts[conversation.phoneNumber] : null
  const contactName = customName || conversation.contactName

  let displayName = conversation.name || 'Söhbət'
  if (!conversation.isGroup) {
    if (contactName) {
      displayName = contactName
    } else if (conversation.phoneNumber) {
      displayName = formatPhoneNumber(conversation.phoneNumber) || conversation.phoneNumber
    }
  }

  const initials = displayName
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .slice(0, 2)
    .toUpperCase() || 'W'

  const avatarBg = getParticipantColor(conversation.id + displayName)
  const lastMsg = conversation.lastMessage
  const timeFormatted = formatWhatsAppTime(conversation.lastTimestamp)

  // Media icon inside last message snippet
  const renderMediaIcon = () => {
    if (!lastMsg) return null
    const t = lastMsg.type
    if (t === 1) return <Camera size={14} className="text-[var(--wa-text-secondary)] inline mr-1" />
    if (t === 2) return <Mic size={14} className="text-[var(--wa-text-secondary)] inline mr-1" />
    if (t === 3) return <Video size={14} className="text-[var(--wa-text-secondary)] inline mr-1" />
    if (t === 9) return <FileText size={14} className="text-[var(--wa-text-secondary)] inline mr-1" />
    if (t === 20 || t === 15) return <Smile size={14} className="text-[var(--wa-text-secondary)] inline mr-1" />
    return null
  }

  const handleSelect = (e: React.MouseEvent) => {
    // If clicking menu, don't trigger chat select
    if ((e.target as HTMLElement).closest('.chat-item-menu-btn') || (e.target as HTMLElement).closest('.chat-item-menu-dropdown')) {
      return
    }
    void selectConversation(conversation.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(true)
  }

  return (
    <div
      onClick={handleSelect}
      onContextMenu={handleContextMenu}
      className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors border-b cursor-pointer select-none relative group ${
        isSelected
          ? 'bg-[#2a3942]'
          : 'hover:bg-[#202c33]/50'
      }`}
      style={{ borderBottomColor: 'var(--wa-border)' }}
    >
      {/* Active Indicator Left Bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--wa-green)]" />
      )}

      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-base shadow-sm relative"
        style={{ backgroundColor: avatarBg }}
      >
        {conversation.isGroup ? (
          <Users size={22} className="text-white/95" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex justify-between items-baseline mb-1">
          <div className="font-normal text-[16px] text-[var(--wa-text-primary)] truncate font-sans">
            {displayName}
          </div>
          <span
            className={`text-[12px] flex-shrink-0 ml-2 font-mono ${
              conversation.unreadCount && conversation.unreadCount > 0
                ? 'text-[var(--wa-green)] font-semibold'
                : 'text-[var(--wa-text-secondary)]'
            }`}
          >
            {timeFormatted}
          </span>
        </div>

        <div className="flex justify-between items-center text-[13.5px] text-[var(--wa-text-secondary)]">
          <div className="flex items-center gap-1 truncate max-w-[75%]">
            {lastMsg?.fromMe && (
              <span className="flex-shrink-0">
                {lastMsg.status === 13 ? (
                  <CheckCheck size={16} className="text-[var(--wa-blue-check)] inline" />
                ) : lastMsg.status === 4 || lastMsg.status === 5 ? (
                  <CheckCheck size={16} className="text-[var(--wa-text-secondary)] inline" />
                ) : (
                  <Check size={16} className="text-[var(--wa-text-secondary)] inline" />
                )}
              </span>
            )}
            {renderMediaIcon()}
            <span className="truncate">
              {lastMsg?.text || (conversation.isGroup ? 'Qrup söhbəti' : 'Söhbət')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conversation.archived && !isArchivedView && (
              <Archive size={14} className="text-[var(--wa-text-secondary)] opacity-70" />
            )}

            {conversation.unreadCount != null && conversation.unreadCount > 0 && (
              <span className="bg-[var(--wa-green)] text-[#111b21] font-bold text-[11px] min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
                {conversation.unreadCount > 999 ? '999+' : conversation.unreadCount}
              </span>
            )}

            {/* Hover Action Chevron (WhatsApp Web style dropdown trigger) */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="chat-item-menu-btn opacity-0 group-hover:opacity-100 p-1 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] transition-opacity rounded-full hover:bg-[var(--wa-hover)]"
              title="Söhbət seçimləri"
            >
              <ChevronDown size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          onClick={e => e.stopPropagation()}
          className="chat-item-menu-dropdown absolute right-4 top-10 w-52 py-2 rounded-xl shadow-2xl z-40 text-sm animate-fade-in border select-none"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          {conversation.unreadCount && conversation.unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                markAsRead(conversation.id)
                setMenuOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)] cursor-pointer"
            >
              <CheckCircle2 size={16} className="text-[var(--wa-blue-check)]" />
              <span>Oxunmuş kimi işarələ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                markAsUnread(conversation.id)
                setMenuOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)] cursor-pointer"
            >
              <Circle size={16} className="text-[var(--wa-green)] fill-[var(--wa-green)]" />
              <span>Oxunmamış kimi işarələ</span>
            </button>
          )}

          <div className="h-px my-1 bg-[var(--wa-border)]" />

          <button
            type="button"
            onClick={() => {
              setChatToDelete(conversation)
              setMenuOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[#ef5350] cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Söhbəti Sil</span>
          </button>
        </div>
      )}
    </div>
  )
}
