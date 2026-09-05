import create from 'zustand'
import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

type ChatState = {
  conversations: Conversation[]
  messages: Message[]
  remoteSessionId: string | null
  totalMessages: number | null
  activeConversationId: string | null
  theme: 'light'|'dark'
  setConversations: (c:Conversation[])=>void
  setMessages: (m:Message[])=>void
  addMessages: (m:Message[])=>void
  setRemoteSession: (id:string|null, total:number|null)=>void
  selectConversation: (id:string|null)=>void
  setTheme: (theme:'light'|'dark')=>void
}

export const useChatStore = create<ChatState>((set)=>({
  conversations: [],
  messages: [],
  remoteSessionId: null,
  totalMessages: null,
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
  setRemoteSession: (id, total)=>set({remoteSessionId:id, totalMessages:total}),
  selectConversation: (id)=>set({activeConversationId:id}),
  setTheme: (theme)=>set({theme})
}))
