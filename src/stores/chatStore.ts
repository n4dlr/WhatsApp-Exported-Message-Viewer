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

  // Archive state
  archivedCount: number
  isArchivedView: boolean
  setIsArchivedView: (isArchived: boolean) => void

  // Active chat state
  activeConversationId: string | null
  messages: Message[]
  hasMoreMessages: boolean
  isLoadingMessages: boolean
  oldestMessageId: number | null
  inChatSearchQuery: string

  // Delete chat modal state
  chatToDelete: Conversation | null
  setChatToDelete: (conv: Conversation | null) => void

  // Custom contact names (saved in localStorage)
  customContacts: Record<string, string>
  setCustomContact: (identifier: string, name: string) => void
  editingContact: { identifier: string; currentName: string } | null
  setEditingContact: (contact: { identifier: string; currentName: string } | null) => void

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

  // Chat actions
  loadChats: (reset?: boolean) => Promise<void>
  loadMoreChats: () => Promise<void>
  selectConversation: (conversationId: string | null) => Promise<void>
  loadOlderMessages: () => Promise<void>
  markAsRead: (chatId: string) => void
  markAsUnread: (chatId: string) => void
  deleteChat: (chatId: string) => void
  sendMessage: (
    chatId: string,
    text: string,
    isOutgoing: boolean,
    senderInfo?: { name: string; phoneNumber?: string }
  ) => void
}

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || ''

const loadStoredContacts = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('chatvault_custom_contacts')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const loadStoredSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

const saveStoredSet = (key: string, set: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch {}
}

const loadStoredSimulatedMessages = (): Record<string, Message[]> => {
  try {
    const raw = localStorage.getItem('chatvault_simulated_messages')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saveStoredSimulatedMessages = (data: Record<string, Message[]>) => {
  try {
    localStorage.setItem('chatvault_simulated_messages', JSON.stringify(data))
  } catch {}
}

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

  archivedCount: 0,
  isArchivedView: false,

  activeConversationId: null,
  messages: [],
  hasMoreMessages: false,
  isLoadingMessages: false,
  oldestMessageId: null,
  inChatSearchQuery: '',

  chatToDelete: null,
  setChatToDelete: conv => set({ chatToDelete: conv }),

  customContacts: loadStoredContacts(),
  editingContact: null,

  inspectedMessageId: null,
  isTableExplorerOpen: false,
  isChatDetailsOpen: false,
  isImportCenterOpen: true,

  theme: 'dark',
  language: 'az',

  setIsArchivedView: isArchived => {
    set({ isArchivedView: isArchived, conversationsOffset: 0 })
    void get().loadChats(true)
  },

  setCustomContact: (identifier, name) => {
    const trimmed = name.trim()
    set(state => {
      const updated = { ...state.customContacts }
      if (trimmed) {
        updated[identifier] = trimmed
      } else {
        delete updated[identifier]
      }
      try {
        localStorage.setItem('chatvault_custom_contacts', JSON.stringify(updated))
      } catch {}
      return { customContacts: updated, editingContact: null }
    })
  },

  setEditingContact: contact => set({ editingContact: contact }),

  setRemoteSession: (sessionId, stats) => {
    set({
      remoteSessionId: sessionId,
      stats: stats || null,
      isImportCenterOpen: !sessionId,
      conversations: [],
      conversationsOffset: 0,
      totalConversations: stats?.totalChats || 0,
      activeConversationId: null,
      messages: [],
      isArchivedView: false
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
    const { remoteSessionId, chatFilter, chatSearchQuery, isArchivedView, isLoadingConversations } = get()
    if (!remoteSessionId || isLoadingConversations) return

    set({ isLoadingConversations: true })
    try {
      const offset = reset ? 0 : get().conversationsOffset
      // Fetch up to 2000 chats at once so all ~387 chats are loaded instantly without jumping
      const limit = 2000
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        filter: chatFilter,
        search: chatSearchQuery,
        view: isArchivedView ? 'archived' : 'active'
      })

      const res = await fetch(`${getBackendUrl()}/api/session/${remoteSessionId}/chats?${params.toString()}`)
      if (!res.ok) throw new Error('Çatlar yüklənə bilmədi.')

      const data = await res.json()
      const newChats = (data.chats || []) as Conversation[]

      const deletedSet = loadStoredSet('chatvault_deleted_chats')
      const readSet = loadStoredSet('chatvault_read_chats')
      const unreadSet = loadStoredSet('chatvault_unread_chats')
      const simulatedMap = loadStoredSimulatedMessages()

      set(state => {
        const combined = reset ? newChats : [...state.conversations, ...newChats]
        const seen = new Set<string>()
        const deduped: Conversation[] = []

        for (const c of combined) {
          if (seen.has(c.id)) continue
          if (deletedSet.has(c.id)) continue // Exclude user-deleted chats
          seen.add(c.id)

          // Read/unread overrides
          let unreadCount = c.unreadCount
          if (readSet.has(c.id)) {
            unreadCount = 0
          } else if (unreadSet.has(c.id)) {
            unreadCount = Math.max(unreadCount, 1)
          }

          // If user sent simulated messages, update the preview & timestamp
          let lastMessage = c.lastMessage
          let lastTimestamp = c.lastTimestamp
          const simMsgs = simulatedMap[c.id]
          if (simMsgs && simMsgs.length > 0) {
            const lastSim = simMsgs[simMsgs.length - 1]
            if (lastSim.timestamp > lastTimestamp) {
              lastTimestamp = lastSim.timestamp
              lastMessage = {
                text: lastSim.body || '',
                timestamp: lastSim.timestamp,
                fromMe: Boolean(lastSim.isOutgoing),
                type: 0,
                status: 13
              }
            }
          }

          deduped.push({
            ...c,
            unreadCount,
            lastMessage,
            lastTimestamp
          })
        }

        // Sort descending by last timestamp so active/recent chats stay on top
        deduped.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))

        // CRITICAL BUGFIX FOR AUTO-JUMPING:
        // If an active conversation is already selected and exists, preserve it!
        // Never jump to deduped[0] when scrolling or reloading.
        const currentActive = state.activeConversationId
        let activeConversationId = currentActive && deduped.some(c => c.id === currentActive)
          ? currentActive
          : null

        // Only default to first chat on the initial load if no chat was ever selected
        if (!activeConversationId && !currentActive && deduped.length > 0) {
          activeConversationId = deduped[0].id
        }

        return {
          conversations: deduped,
          totalConversations: deduped.length,
          archivedCount: data.archivedCount ?? state.archivedCount,
          conversationsOffset: offset + newChats.length,
          hasMoreConversations: data.hasMore && deduped.length < data.total,
          activeConversationId,
          isLoadingConversations: false
        }
      })

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

  markAsRead: (chatId: string) => {
    const readSet = loadStoredSet('chatvault_read_chats')
    readSet.add(chatId)
    saveStoredSet('chatvault_read_chats', readSet)

    const unreadSet = loadStoredSet('chatvault_unread_chats')
    if (unreadSet.has(chatId)) {
      unreadSet.delete(chatId)
      saveStoredSet('chatvault_unread_chats', unreadSet)
    }

    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
      messages: state.activeConversationId === chatId
        ? state.messages.map(m => m.isOutgoing && m.status !== 13 ? { ...m, status: 13 } : m)
        : state.messages
    }))
  },

  markAsUnread: (chatId: string) => {
    const unreadSet = loadStoredSet('chatvault_unread_chats')
    unreadSet.add(chatId)
    saveStoredSet('chatvault_unread_chats', unreadSet)

    const readSet = loadStoredSet('chatvault_read_chats')
    if (readSet.has(chatId)) {
      readSet.delete(chatId)
      saveStoredSet('chatvault_read_chats', readSet)
    }

    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === chatId ? { ...c, unreadCount: Math.max(c.unreadCount || 0, 1) } : c
      )
    }))
  },

  deleteChat: (chatId: string) => {
    const { conversations, activeConversationId } = get()
    const deletedSet = loadStoredSet('chatvault_deleted_chats')
    deletedSet.add(chatId)
    saveStoredSet('chatvault_deleted_chats', deletedSet)

    const updatedConversations = conversations.filter(c => c.id !== chatId)
    const isCurrentlyActive = activeConversationId === chatId
    const nextActive = isCurrentlyActive ? (updatedConversations[0]?.id || null) : activeConversationId

    set({
      conversations: updatedConversations,
      totalConversations: Math.max(0, updatedConversations.length),
      activeConversationId: nextActive,
      chatToDelete: null
    })

    if (isCurrentlyActive) {
      if (nextActive) {
        void get().selectConversation(nextActive)
      } else {
        set({ messages: [], oldestMessageId: null, hasMoreMessages: false })
      }
    }
  },

  sendMessage: (chatId, text, isOutgoing, senderInfo) => {
    const trimmed = text.trim()
    if (!trimmed || !chatId) return

    const simulatedMap = loadStoredSimulatedMessages()
    const existingForChat = simulatedMap[chatId] || []

    const now = Date.now()
    const newMessage: Message = {
      id: now + Math.floor(Math.random() * 1000),
      conversationId: chatId,
      timestamp: now,
      body: trimmed,
      isOutgoing,
      status: 13, // Read receipt (Blue double checkmark)
      type: 'text',
      sender: isOutgoing
        ? { name: 'Siz' }
        : {
            name: senderInfo?.name || 'Həmsöhbət',
            phoneNumber: senderInfo?.phoneNumber,
            displayName: senderInfo?.name || 'Həmsöhbət'
          }
    }

    const updatedChatSimulated = [...existingForChat, newMessage]
    simulatedMap[chatId] = updatedChatSimulated
    saveStoredSimulatedMessages(simulatedMap)

    set(state => {
      // If currently active chat, append message to the timeline
      const updatedMessages = state.activeConversationId === chatId
        ? [...state.messages, newMessage]
        : state.messages

      // Update target chat's preview and move it to index 0 (top of the list)
      const targetConv = state.conversations.find(c => c.id === chatId)
      const otherConvs = state.conversations.filter(c => c.id !== chatId)

      if (targetConv) {
        const updatedConv: Conversation = {
          ...targetConv,
          unreadCount: 0,
          lastTimestamp: now,
          lastMessage: {
            text: trimmed,
            timestamp: now,
            fromMe: isOutgoing,
            type: 0,
            status: 13
          }
        }
        return {
          messages: updatedMessages,
          conversations: [updatedConv, ...otherConvs]
        }
      }

      return { messages: updatedMessages }
    })
  },

  selectConversation: async conversationId => {
    if (!conversationId) {
      set({ activeConversationId: null, messages: [], hasMoreMessages: false, oldestMessageId: null })
      return
    }

    // Automatically mark the opened chat as read (unread count -> 0, read receipt)
    get().markAsRead(conversationId)

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
      const dbMessages = (data.messages || []) as Message[]

      // Load user-written / simulated messages for this chat
      const simulatedMap = loadStoredSimulatedMessages()
      const simulatedForChat = simulatedMap[conversationId] || []

      // Mark outgoing messages as seen/read (status 13) when viewing
      const allCombined = [...dbMessages, ...simulatedForChat]

      set({
        messages: allCombined,
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
      const olderMessages = (data.messages || []) as Message[]

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
