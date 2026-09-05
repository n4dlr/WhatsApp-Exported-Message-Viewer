export type Message = {
  id: string
  conversationId: string
  senderId?: string
  senderName?: string
  timestamp: number
  type?: 'text'|'image'|'video'|'audio'|'document'|'sticker'|'system'
  body?: string
  isOutgoing?: boolean
  status?: 'sent'|'delivered'|'read'|null
  quotedMessageId?: string | null
  media?: import('./media').Media | null
  caption?: string | null
  deleted?: boolean
  edited?: boolean
  forwarded?: boolean
}
