export type Conversation = {
  id: string
  name?: string
  type?: 'private'|'group'|'unknown'
  avatar?: string
  participants?: string[]
  lastMessage?: import('./message').Message | null
  lastTimestamp?: number | null
  unreadCount?: number
}
