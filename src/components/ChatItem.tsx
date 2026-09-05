import React from 'react'
import { Conversation } from '../types/conversation'
import { useChatStore } from '../stores/chatStore'
import { Check, CheckCheck, Users, Archive } from 'lucide-react'

// Deterministic WhatsApp avatar colors based on chat ID/name
const AVATAR_COLORS = [
  '#00a884', '#53bdeb', '#e542a3', '#f28b22', '#a476f7', '#d69800', '#26a69a', '#ef5350'
]

function getAvatarColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatWhatsAppTime(timestamp?: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Dünən'
  }

  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
}

export default function ChatItem({ conversation }: { conversation: Conversation }) {
  const { activeConversationId, selectConversation } = useChatStore()
  const isSelected = conversation.id === activeConversationId

  const initials = (conversation.name || 'W')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .slice(0, 2)
    .toUpperCase() || 'W'

  const avatarBg = getAvatarColor(conversation.id + (conversation.name || ''))
  const lastMsg = conversation.lastMessage
  const timeFormatted = formatWhatsAppTime(conversation.lastTimestamp)

  return (
    <button
      type="button"
      onClick={() => void selectConversation(conversation.id)}
      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-b border-opacity-50 cursor-pointer ${
        isSelected
          ? 'bg-[#2a3942] dark:bg-[#2a3942]'
          : 'hover:bg-[#202c33]/40'
      }`}
      style={{ borderBottomColor: 'var(--wa-border)' }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-base shadow-sm relative"
        style={{ backgroundColor: avatarBg }}
      >
        {conversation.isGroup ? <Users size={22} className="text-white/90" /> : initials}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex justify-between items-baseline mb-1">
          <div className="font-normal text-[16px] text-[var(--wa-text-primary)] truncate font-sans">
            {conversation.name}
          </div>
          <span className={`text-[12px] flex-shrink-0 ml-2 ${conversation.unreadCount && conversation.unreadCount > 0 ? 'text-[var(--wa-green)] font-medium' : 'text-[var(--wa-text-secondary)]'}`}>
            {timeFormatted}
          </span>
        </div>

        <div className="flex justify-between items-center text-[13.5px] text-[var(--wa-text-secondary)]">
          <div className="flex items-center gap-1 truncate max-w-[82%]">
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
            <span className="truncate">
              {lastMsg?.text || (conversation.isGroup ? 'Qrup söhbəti' : 'Söhbət')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conversation.archived && (
              <Archive size={14} className="text-[var(--wa-text-secondary)] opacity-70" />
            )}
            {conversation.unreadCount != null && conversation.unreadCount > 0 && (
              <span className="bg-[var(--wa-green)] text-[#111b21] font-semibold text-[11px] min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center">
                {conversation.unreadCount > 999 ? '999+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
