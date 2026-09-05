import React from 'react'
import { useChatStore } from '../stores/chatStore'
import ChatItem from './ChatItem'

export default function ChatList(){
  const { conversations } = useChatStore()
  return (
    <div>
      {conversations.map(c => (
        <ChatItem key={c.id} conversation={c} />
      ))}
      {conversations.length===0 && (
        <div className="p-6 text-sm text-gray-500">No conversations yet. Import a chat or database to start.</div>
      )}
    </div>
  )
}
