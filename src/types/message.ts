export type MessageReaction = {
  reaction: string
  fromMe: boolean
  senderJid?: string
}

export type MessageMedia = {
  filePath?: string | null
  fileSize?: number | null
  mimeType?: string | null
  mediaName?: string | null
  caption?: string | null
  duration?: number | null
  transcription?: string | null
  width?: number | null
  height?: number | null
}

export type MessageQuoted = {
  rowId?: number | null
  body?: string | null
  senderJid?: string | null
  senderPhone?: string | null
  fromMe?: boolean
}

export type MessagePoll = {
  options: {
    name: string
    votes: number
  }[]
}

export type MessageLocation = {
  lat: number
  lng: number
  name?: string | null
  address?: string | null
  url?: string | null
}

export type Message = {
  id: string
  rowId?: number
  conversationId: string
  keyId?: string
  timestamp: number
  receivedTimestamp?: number
  isOutgoing?: boolean
  status?: number // 0: sent, 4/5: delivered, 13: read
  starred?: boolean
  body?: string
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'gif' | 'system' | 'poll' | 'location' | 'contact' | 'call'
  rawMessageType?: number
  sender?: {
    name: string
    jid?: string
    phoneNumber?: string
  }
  media?: MessageMedia | null
  quoted?: MessageQuoted | null
  reactions?: MessageReaction[]
  poll?: MessagePoll | null
  location?: MessageLocation | null
  vcard?: string | null
  forwarded?: boolean
  deleted?: boolean
  edited?: boolean
}
