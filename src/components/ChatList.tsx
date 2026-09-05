import React, { useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import ChatItem from './ChatItem'
import { Loader2, Archive, ArrowLeft, ChevronRight } from 'lucide-react'

export default function ChatList() {
  const {
    conversations,
    hasMoreConversations,
    isLoadingConversations,
    loadMoreChats,
    totalConversations,
    archivedCount,
    showArchived,
    setShowArchived
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
      {/* === WhatsApp Archived Chats Banner (at top of non-archived list) === */}
      {!showArchived && archivedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className="wa-archived-btn w-full flex items-center gap-4 px-4 py-3.5 border-b select-none group"
          style={{ borderColor: 'var(--wa-border)' }}
        >
          {/* Archive Icon circle */}
          <div
            className="w-[49px] h-[49px] rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--wa-green)' }}
          >
            <Archive size={22} className="text-white" />
          </div>

          {/* Label + count */}
          <div className="flex-1 min-w-0 text-left">
            <div
              className="text-[16px] font-normal leading-snug"
              style={{ color: 'var(--wa-text-primary)' }}
            >
              Arxivlənmiş
            </div>
          </div>

          {/* Count badge */}
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'var(--wa-green)' }}
          >
            {archivedCount}
          </span>
          <ChevronRight size={16} className="text-[var(--wa-text-secondary)] opacity-60" />
        </button>
      )}

      {/* === Archived mode: back button header === */}
      {showArchived && (
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b select-none"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <ArrowLeft size={20} className="text-[var(--wa-green)]" />
          <span className="text-[14px] font-medium text-[var(--wa-green)]">Arxivlənmiş ({archivedCount})</span>
        </button>
      )}

      {/* Chat Items */}
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
          {showArchived ? 'Arxivlənmiş söhbət tapılmadı.' : 'Heç bir söhbət tapılmadı.'}
        </div>
      )}

      {!hasMoreConversations && conversations.length > 0 && (
        <div className="py-3 text-center text-[11px] text-[var(--wa-text-secondary)] opacity-60">
          {showArchived
            ? `${totalConversations} arxivlənmiş söhbətin hamısı göstərildi`
            : `Cəmi ${totalConversations} söhbətin hamısı göstərildi`}
        </div>
      )}
    </div>
  )
}
