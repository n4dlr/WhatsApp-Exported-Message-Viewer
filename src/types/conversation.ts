export type Conversation = {
  id: string
  jidRowId?: number
  jid?: string
  phoneNumber?: string
  name?: string
  subject?: string
  server?: string
  isGroup?: boolean
  archived?: boolean
  type?: 'private' | 'group' | 'channel' | 'unknown'
  avatar?: string
  participants?: string[]
  messageCount?: number
  unreadCount?: number
  lastTimestamp?: number | null
  lastMessage?: {
    text?: string
    timestamp?: number
    fromMe?: boolean
    type?: number
    status?: number
  } | null
}
