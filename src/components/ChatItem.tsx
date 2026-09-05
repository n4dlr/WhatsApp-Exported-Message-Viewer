import React from 'react'
import { Conversation } from '../types/conversation'
import { useChatStore } from '../stores/chatStore'

export default function ChatItem({conversation}:{conversation:Conversation}){
  const { activeConversationId, selectConversation } = useChatStore()
  return (
    <button type="button" onClick={()=>selectConversation(conversation.id)} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer ${conversation.id===activeConversationId ? 'bg-gray-100' : ''}`}>
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">A</div>
      <div className="flex-1">
        <div className="flex justify-between">
          <div className="font-semibold">{conversation.name || 'Unknown'}</div>
          <div className="text-xs text-gray-400">{conversation.lastTimestamp? new Date(conversation.lastTimestamp).toLocaleString():''}</div>
        </div>
        <div className="text-sm text-gray-500 truncate">{conversation.lastMessage?.body ?? ''}</div>
      </div>
    </button>
  )
}
