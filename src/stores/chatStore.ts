import create from 'zustand'
import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

type ChatState = {
  conversations: Conversation[]
  messages: Message[]
  activeConversationId: string | null
  theme: 'light'|'dark'
  setConversations: (c:Conversation[])=>void
  setMessages: (m:Message[])=>void
  addMessages: (m:Message[])=>void
  selectConversation: (id:string|null)=>void
}

export const useChatStore = create<ChatState>((set)=>({
  conversations: [],
  messages: [],
  activeConversationId: null,
  theme: 'light',
  setConversations: (c)=>set((state)=>({
    conversations:c,
    activeConversationId: c.some(item => item.id === state.activeConversationId)
      ? state.activeConversationId
      : c[0]?.id ?? null
  })),
  setMessages: (m)=>set({messages:m}),
  addMessages: (m)=>set((s)=>({messages:[...s.messages,...m]}))
  ,
  selectConversation: (id)=>set({activeConversationId:id})
}))
