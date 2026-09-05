import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import { Loader2, Lock } from 'lucide-react'

function formatDateSeparator(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return 'BUGÜN'
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'DÜNƏN'
  }

  return date.toLocaleDateString('az-AZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase()
}

export default function MessageList() {
  const {
    messages,
    activeConversationId,
    conversations,
    hasMoreMessages,
    isLoadingMessages,
    loadOlderMessages
  } = useChatStore()

  const activeChat = conversations.find(c => c.id === activeConversationId)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const isAutoScrollingRef = useRef<boolean>(false)

  // Auto-scroll to bottom on first load or when switching conversation
  useEffect(() => {
    if (containerRef.current && messages.length > 0 && !hasMoreMessages) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    } else if (containerRef.current && messages.length > 0) {
      // If we just prepended messages, maintain scroll position
      if (prevScrollHeightRef.current > 0) {
        const delta = containerRef.current.scrollHeight - prevScrollHeightRef.current
        containerRef.current.scrollTop += delta
      } else {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }
  }, [messages])

  // Handle scroll to top to load older messages
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return

    if (el.scrollTop < 80 && hasMoreMessages && !isLoadingMessages) {
      prevScrollHeightRef.current = el.scrollHeight
      void loadOlderMessages()
    }
  }

  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--wa-text-secondary)] gap-2">
        <Loader2 size={24} className="animate-spin text-[var(--wa-green)]" />
        <span className="text-sm">Mesajlar bazadan oxunur...</span>
      </div>
    )
  }

  if (!activeConversationId) {
    return null
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-2 py-4 flex flex-col"
    >
      {/* Loading older messages indicator */}
      {isLoadingMessages && messages.length > 0 && (
        <div className="py-2 flex items-center justify-center text-xs text-[var(--wa-text-secondary)] gap-2">
          <Loader2 size={16} className="animate-spin text-[var(--wa-green)]" />
          <span>Əvvəlki mesajlar yüklənir...</span>
        </div>
      )}

      {/* End-to-end encryption notice pill */}
      {!hasMoreMessages && (
        <div className="flex justify-center my-3 select-none px-4">
          <div className="wa-pill px-3.5 py-1.5 rounded-lg text-center max-w-[85%] text-xs flex items-center gap-1.5 shadow-sm">
            <Lock size={13} className="text-[#ffd279] flex-shrink-0" />
            <span>
              Mesajlar və zənglər uçdan-uca şifrələnir. Bu çatdakı mesajları sizdən və həmsöhbətinizdən başqa heç kəs oxuya bilməz.
            </span>
          </div>
        </div>
      )}

      {/* Messages with Date Separators */}
      {messages.map((m, index) => {
        const prev = messages[index - 1]
        const showDate =
          !prev ||
          new Date(m.timestamp).toDateString() !== new Date(prev.timestamp).toDateString()

        return (
          <React.Fragment key={m.id || index}>
            {showDate && (
              <div className="flex justify-center my-3 select-none">
                <div className="wa-pill px-3 py-1 rounded-lg text-center font-medium shadow-sm">
                  {formatDateSeparator(m.timestamp)}
                </div>
              </div>
            )}
            <MessageBubble message={m} isGroup={activeChat?.isGroup} />
          </React.Fragment>
        )
      })}
    </div>
  )
}
