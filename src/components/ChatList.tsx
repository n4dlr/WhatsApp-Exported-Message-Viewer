import React, { useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import ChatItem from './ChatItem'
import { Loader2 } from 'lucide-react'

export default function ChatList() {
  const {
    conversations,
    hasMoreConversations,
    isLoadingConversations,
    loadMoreChats,
    totalConversations
  } = useChatStore()

  const listRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - (scrollTop + clientHeight) < 250) {
      if (hasMoreConversations && !isLoadingConversations) {
        void loadMoreChats()
      }
    }
  }, [hasMoreConversations, isLoadingConversations, loadMoreChats])

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto overflow-x-hidden flex flex-col"
    >
      {conversations.map(c => (
        <ChatItem key={c.id} conversation={c} />
      ))}

      {isLoadingConversations && (
        <div className="py-4 flex items-center justify-center text-[var(--wa-text-secondary)] text-sm gap-2">
          <Loader2 size={18} className="animate-spin text-[var(--wa-green)]" />
          <span>Çatlar arxa planda yüklənir...</span>
        </div>
      )}

      {!isLoadingConversations && conversations.length === 0 && (
        <div className="p-8 text-center text-sm text-[var(--wa-text-secondary)]">
          Heç bir söhbət tapılmadı.
        </div>
      )}

      {!hasMoreConversations && conversations.length > 0 && (
        <div className="py-3 text-center text-[11px] text-[var(--wa-text-secondary)] opacity-60">
          Cəmi {totalConversations} söhbətin hamısı göstərildi
        </div>
      )}
    </div>
  )
}
