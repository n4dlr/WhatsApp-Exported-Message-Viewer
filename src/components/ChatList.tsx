import React, { useMemo, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import ChatItem from './ChatItem'

export default function ChatList(){
  const { conversations } = useChatStore()
  const [query, setQuery] = useState('')
  const visibleConversations = useMemo(() => conversations.filter(conversation =>
    (conversation.name ?? '').toLowerCase().includes(query.toLowerCase())
  ), [conversations, query])
  return (
    <div>
      <div className="p-3 border-b">
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search conversations" className="w-full p-2 rounded bg-gray-100" />
      </div>
      {visibleConversations.map(c => (
        <ChatItem key={c.id} conversation={c} />
      ))}
      {visibleConversations.length===0 && (
        <div className="p-6 text-sm text-gray-500">No conversations yet. Import a chat or database to start.</div>
      )}
    </div>
  )
}
