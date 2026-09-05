import create from 'zustand'
import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

type ChatState = {
  conversations: Conversation[]
  messages: Message[]
  theme: 'light'|'dark'
  setConversations: (c:Conversation[])=>void
  addMessages: (m:Message[])=>void
}

export const useChatStore = create<ChatState>((set)=>({
  conversations: [],
  messages: [],
  theme: 'light',
  setConversations: (c)=>set({conversations:c}),
  addMessages: (m)=>set((s)=>({messages:[...s.messages,...m]}))
}))
