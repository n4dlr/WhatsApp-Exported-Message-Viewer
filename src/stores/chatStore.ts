import create from 'zustand'
import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

export type ChatFilter = 'all' | 'unread' | 'groups'

export type DatabaseStats = {
  totalMessages: number
  totalChats: number
  totalTables: number
  fileSizeBytes: number
  fileName: string
}

type ChatState = {
  // Remote session & stats
  remoteSessionId: string | null
  stats: DatabaseStats | null

  // Chats list state
  conversations: Conversation[]
  totalConversations: number
  conversationsOffset: number
  hasMoreConversations: boolean
  isLoadingConversations: boolean
  chatFilter: ChatFilter
  chatSearchQuery: string

  // Active chat state
  activeConversationId: string | null
  messages: Message[]
  hasMoreMessages: boolean
  isLoadingMessages: boolean
  oldestMessageId: number | null
  inChatSearchQuery: string

  // Inspect & modal states
  inspectedMessageId: number | null
  isTableExplorerOpen: boolean
  isChatDetailsOpen: boolean
  isImportCenterOpen: boolean

  // Settings
  theme: 'dark' | 'light'
  language: 'az' | 'en' | 'tr' | 'ru'

  // Actions
  setRemoteSession: (sessionId: string | null, stats?: DatabaseStats | null) => void
  setTheme: (theme: 'dark' | 'light') => void
  setLanguage: (lang: 'az' | 'en' | 'tr' | 'ru') => void
  setChatFilter: (filter: ChatFilter) => void
  setChatSearchQuery: (query: string) => void
  setInChatSearchQuery: (query: string) => void
  setInspectedMessageId: (id: number | null) => void
  setIsTableExplorerOpen: (open: boolean) => void
  setIsChatDetailsOpen: (open: boolean) => void
  setIsImportCenterOpen: (open: boolean) => void

  // Chat loading actions
  loadChats: (reset?: boolean) => Promise<void>
  loadMoreChats: () => Promise<void>
  selectConversation: (conversationId: string | null) => Promise<void>
  loadOlderMessages: () => Promise<void>
}

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || ''

export const useChatStore = create<ChatState>((set, get) => ({
  remoteSessionId: null,
  stats: null,

  conversations: [],
  totalConversations: 0,
  conversationsOffset: 0,
  hasMoreConversations: false,
  isLoadingConversations: false,
  chatFilter: 'all',
  chatSearchQuery: '',

  activeConversationId: null,
  messages: [],
  hasMoreMessages: false,
  isLoadingMessages: false,
  oldestMessageId: null,
  inChatSearchQuery: '',

  inspectedMessageId: null,
  isTableExplorerOpen: false,
  isChatDetailsOpen: false,
  isImportCenterOpen: true,

  theme: 'dark', // Modern WhatsApp default
  language: 'az',

  setRemoteSession: (sessionId, stats) => {
    set({
      remoteSessionId: sessionId,
      stats: stats || null,
      isImportCenterOpen: !sessionId,
      conversations: [],
      conversationsOffset: 0,
      totalConversations: stats?.totalChats || 0,
      activeConversationId: null,
      messages: []
    })
    if (sessionId) {
      void get().loadChats(true)
    }
  },

  setTheme: theme => set({ theme }),
  setLanguage: language => set({ language }),

  setChatFilter: filter => {
    set({ chatFilter: filter, conversationsOffset: 0 })
    void get().loadChats(true)
  },

  setChatSearchQuery: query => {
    set({ chatSearchQuery: query, conversationsOffset: 0 })
    void get().loadChats(true)
  },

  setInChatSearchQuery: query => {
    set({ inChatSearchQuery: query })
    const { activeConversationId } = get()
    if (activeConversationId) {
      void get().selectConversation(activeConversationId)
    }
  },

  setInspectedMessageId: id => set({ inspectedMessageId: id }),
  setIsTableExplorerOpen: open => set({ isTableExplorerOpen: open }),
  setIsChatDetailsOpen: open => set({ isChatDetailsOpen: open }),
  setIsImportCenterOpen: open => set({ isImportCenterOpen: open }),

  loadChats: async (reset = false) => {
    const { remoteSessionId, chatFilter, chatSearchQuery, isLoadingConversations } = get()
    if (!remoteSessionId || isLoadingConversations) return

    set({ isLoadingConversations: true })
    try {
      const offset = reset ? 0 : get().conversationsOffset
      const limit = 50
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        filter: chatFilter,
        search: chatSearchQuery
      })

      const res = await fetch(`${getBackendUrl()}/api/session/${remoteSessionId}/chats?${params.toString()}`)
      if (!res.ok) throw new Error('Çatlar yüklənə bilmədi.')

      const data = await res.json()
      const newChats = data.chats as Conversation[]

      set(state => {
        const combined = reset ? newChats : [...state.conversations, ...newChats]
        // Deduplicate
        const seen = new Set()
        const deduped = combined.filter(c => {
          if (seen.has(c.id)) return false
          seen.add(c.id)
          return true
        })

        // Auto select first chat if none selected
        const currentActive = state.activeConversationId
        const activeConversationId = currentActive && deduped.some(c => c.id === currentActive)
          ? currentActive
          : (deduped[0]?.id ?? null)

        return {
          conversations: deduped,
          totalConversations: data.total,
          conversationsOffset: offset + newChats.length,
          hasMoreConversations: data.hasMore,
          activeConversationId,
          isLoadingConversations: false
        }
      })

      // If a chat was auto-selected and messages are empty, load its messages
      const activeId = get().activeConversationId
      if (activeId && get().messages.length === 0) {
        void get().selectConversation(activeId)
      }
    } catch (err) {
      console.error('loadChats error:', err)
      set({ isLoadingConversations: false })
    }
  },

  loadMoreChats: async () => {
    const { hasMoreConversations, isLoadingConversations } = get()
    if (!hasMoreConversations || isLoadingConversations) return
    await get().loadChats(false)
  },

  selectConversation: async conversationId => {
    if (!conversationId) {
      set({ activeConversationId: null, messages: [], hasMoreMessages: false, oldestMessageId: null })
      return
    }

    const { remoteSessionId, inChatSearchQuery } = get()
    set({
      activeConversationId: conversationId,
      isLoadingMessages: true,
      messages: [],
      oldestMessageId: null,
      hasMoreMessages: false
    })

    if (!remoteSessionId) {
      set({ isLoadingMessages: false })
      return
    }

    try {
      const params = new URLSearchParams({ limit: '50' })
      if (inChatSearchQuery) params.set('search', inChatSearchQuery)

      const res = await fetch(`${getBackendUrl()}/api/session/${remoteSessionId}/chats/${conversationId}/messages?${params.toString()}`)
      if (!res.ok) throw new Error('Mesajlar oxunmadı.')

      const data = await res.json()
      set({
        messages: data.messages,
        hasMoreMessages: data.hasMore,
        oldestMessageId: data.oldestId,
        isLoadingMessages: false
      })
    } catch (err) {
      console.error('selectConversation error:', err)
      set({ isLoadingMessages: false })
    }
  },

  loadOlderMessages: async () => {
    const { remoteSessionId, activeConversationId, oldestMessageId, hasMoreMessages, isLoadingMessages, inChatSearchQuery } = get()
    if (!remoteSessionId || !activeConversationId || !oldestMessageId || !hasMoreMessages || isLoadingMessages) return

    set({ isLoadingMessages: true })
    try {
      const params = new URLSearchParams({
        limit: '50',
        beforeId: String(oldestMessageId)
      })
      if (inChatSearchQuery) params.set('search', inChatSearchQuery)

      const res = await fetch(`${getBackendUrl()}/api/session/${remoteSessionId}/chats/${activeConversationId}/messages?${params.toString()}`)
      if (!res.ok) throw new Error('Əvvəlki mesajlar oxunmadı.')

      const data = await res.json()
      const olderMessages = data.messages as Message[]

      set(state => ({
        messages: [...olderMessages, ...state.messages],
        hasMoreMessages: data.hasMore,
        oldestMessageId: data.oldestId,
        isLoadingMessages: false
      }))
    } catch (err) {
      console.error('loadOlderMessages error:', err)
      set({ isLoadingMessages: false })
    }
  }
}))
