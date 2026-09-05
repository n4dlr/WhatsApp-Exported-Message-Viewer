import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import { useVirtual } from 'react-virtual'

export default function MessageList(){
  const { messages, activeConversationId, remoteSessionId, totalMessages, addMessages } = useChatStore()
  const [loadingMore, setLoadingMore] = React.useState(false)
  const visibleMessages = messages.filter(message => !activeConversationId || message.conversationId === activeConversationId)
  const parentRef = useRef<HTMLDivElement|null>(null)

  const rowVirtualizer = useVirtual({
    size: visibleMessages.length,
    parentRef,
    estimateSize: React.useCallback(()=>80,[]),
    overscan: 5,
  })

  useEffect(()=>{
    if(parentRef.current) parentRef.current.scrollTop = parentRef.current.scrollHeight
  },[visibleMessages.length])

  async function loadMore(){
    if (!remoteSessionId || loadingMore || (totalMessages != null && messages.length >= totalMessages)) return
    setLoadingMore(true)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? ''
      const response = await fetch(`${backendUrl}/api/import/session/${remoteSessionId}/messages?limit=100&offset=${messages.length}`)
      if (!response.ok) throw new Error('Could not load the next message chunk.')
      const payload = await response.json()
      addMessages(payload.messages)
    } finally {
      setLoadingMore(false)
    }
  }

  function handleScroll(){
    const element = parentRef.current
    if (element && element.scrollTop + element.clientHeight >= element.scrollHeight - 300) {
      void loadMore()
    }
  }

  return (
    <div ref={parentRef} onScroll={handleScroll} className="h-full overflow-auto p-4">
      <div style={{height: rowVirtualizer.totalSize, position:'relative'}}>
        {rowVirtualizer.virtualItems.map(virtualRow => {
          const m = visibleMessages[virtualRow.index]
          return (
            <div key={m.id} style={{position:'absolute', top:virtualRow.start, left:0, width:'100%'}}>
              <MessageBubble message={m} />
            </div>
          )
        })}
      </div>
      {loadingMore && <div className="text-center text-xs text-gray-500">Loading more messages...</div>}
    </div>
  )
}
