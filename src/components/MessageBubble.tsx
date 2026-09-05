import React, { useState } from 'react'
import { Message } from '../types/message'
import { useChatStore } from '../stores/chatStore'
import {
  Check,
  CheckCheck,
  Star,
  MoreVertical,
  Database,
  FileText,
  Play,
  Pause,
  MapPin,
  User,
  Vote,
  Lock,
  Copy
} from 'lucide-react'

function formatMessageTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getSenderColorIndex(senderName: string): number {
  let hash = 0
  for (let i = 0; i < senderName.length; i++) {
    hash = senderName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 8
}

function renderFormattedText(text: string) {
  if (!text) return null

  // URL link regex
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#53bdeb] underline hover:opacity-80 break-all"
        >
          {part}
        </a>
      )
    }

    // Bold formatting (*text*)
    const formatted = part
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<del>$1</del>')

    return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

export default function MessageBubble({
  message,
  isGroup
}: {
  message: Message
  isGroup?: boolean
}) {
  const { setInspectedMessageId } = useChatStore()
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isOut = Boolean(message.isOutgoing)
  const timeStr = formatMessageTime(message.timestamp)

  // System messages (encryption notice, group changes, calls)
  if (message.type === 'system' || message.rawMessageType === 7) {
    return (
      <div className="flex justify-center my-3 select-none px-4">
        <div className="wa-pill px-3.5 py-1.5 rounded-lg text-center max-w-[85%] text-xs flex items-center gap-1.5 shadow-sm">
          <Lock size={13} className="text-[#ffd279] flex-shrink-0" />
          <span>{message.body || 'Söhbətdəki mesajlar və zənglər uçdan-uca şifrələnir.'}</span>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    if (message.body) {
      navigator.clipboard.writeText(message.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const senderName = message.sender?.name || 'İştirakçı'
  const colorIdx = getSenderColorIndex(senderName)

  return (
    <div
      className={`group flex ${isOut ? 'justify-end' : 'justify-start'} mb-1.5 px-6 relative`}
      onMouseLeave={() => setActionMenuOpen(false)}
    >
      <div
        className={`max-w-[70%] sm:max-w-[65%] min-w-[120px] px-2.5 pt-1.5 pb-1 text-[14.2px] leading-[19px] relative ${
          isOut ? 'bubble-outgoing' : 'bubble-incoming'
        }`}
      >
        {/* Hover Action Menu Trigger */}
        <div className="absolute top-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={() => setActionMenuOpen(!actionMenuOpen)}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white/80 transition-colors"
            title="Seçimlər"
          >
            <MoreVertical size={14} />
          </button>

          {actionMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-56 py-1.5 rounded-lg shadow-2xl z-50 text-xs border animate-fade-in"
              style={{
                backgroundColor: 'var(--wa-header-bg)',
                borderColor: 'var(--wa-border)'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setInspectedMessageId(message.rowId || Number(message.id))
                  setActionMenuOpen(false)
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-[var(--wa-hover)] flex items-center gap-2 text-[var(--wa-text-primary)] font-medium"
              >
                <Database size={15} className="text-[var(--wa-green)]" />
                <span>Bütün Sütunlara Bax (DB Record)</span>
              </button>

              {message.body && (
                <button
                  type="button"
                  onClick={() => {
                    handleCopy()
                    setActionMenuOpen(false)
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[var(--wa-hover)] flex items-center gap-2 text-[var(--wa-text-primary)]"
                >
                  <Copy size={15} />
                  <span>{copied ? 'Kopyalandı!' : 'Mətni kopyala'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sender Name in Group Chats */}
        {!isOut && isGroup && (
          <div className={`text-[12.8px] font-semibold mb-1 participant-color-${colorIdx} flex items-center justify-between`}>
            <span>{senderName}</span>
            {message.sender?.phoneNumber && message.sender.phoneNumber !== senderName && (
              <span className="text-[10.5px] opacity-70 ml-2 font-normal">
                +{message.sender.phoneNumber}
              </span>
            )}
          </div>
        )}

        {/* Quoted / Reply Preview Card */}
        {message.quoted && (
          <div
            className="mb-1.5 p-2 rounded bg-black/10 dark:bg-black/25 border-l-4 text-xs select-none"
            style={{ borderLeftColor: 'var(--wa-green)' }}
          >
            <div className="font-semibold text-[var(--wa-green)] mb-0.5">
              {message.quoted.fromMe ? 'Siz' : (message.quoted.senderPhone || 'Söhbət iştirakçısı')}
            </div>
            <div className="text-[var(--wa-text-secondary)] line-clamp-2 italic">
              {message.quoted.body || 'Mesaj'}
            </div>
          </div>
        )}

        {/* Media: Image */}
        {message.type === 'image' && (
          <div className="my-1 rounded-md overflow-hidden bg-black/20 p-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--wa-text-secondary)]">
              <span className="text-xl">📷</span>
              <div>
                <div className="font-medium text-[var(--wa-text-primary)]">
                  {message.media?.mediaName || 'Şəkil'}
                </div>
                {message.media?.fileSize && (
                  <div>{(message.media.fileSize / 1024).toFixed(0)} KB</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Media: Audio / Voice Note */}
        {message.type === 'audio' && (
          <div className="my-1.5 flex items-center gap-3 p-2 rounded bg-black/10 dark:bg-black/20 select-none">
            <button
              type="button"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-9 h-9 rounded-full bg-[var(--wa-green)] text-[#111b21] flex items-center justify-center shadow hover:opacity-90 flex-shrink-0"
            >
              {isPlayingAudio ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-[140px]">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-[var(--wa-green)] transition-all duration-300"
                  style={{ width: isPlayingAudio ? '60%' : '15%' }}
                />
              </div>
              <div className="flex justify-between text-[10.5px] text-[var(--wa-text-secondary)]">
                <span>{isPlayingAudio ? '0:18' : '0:00'}</span>
                <span>{message.media?.duration ? `${Math.floor(message.media.duration / 60)}:${(message.media.duration % 60).toString().padStart(2, '0')}` : '0:42'}</span>
              </div>
            </div>
            <span className="text-sm">🎙️</span>
          </div>
        )}

        {/* Media: Video */}
        {message.type === 'video' && (
          <div className="my-1 p-2 rounded bg-black/20 text-xs flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center text-white">
              <Play size={16} />
            </div>
            <div>
              <div className="font-medium">{message.media?.mediaName || 'Video'}</div>
              {message.media?.fileSize && (
                <div className="text-[var(--wa-text-secondary)]">
                  {(message.media.fileSize / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media: Document */}
        {message.type === 'document' && (
          <div className="my-1 p-2.5 rounded bg-black/10 dark:bg-black/25 flex items-center gap-3 text-xs border border-white/10">
            <div className="p-2 rounded bg-[var(--wa-green)]/20 text-[var(--wa-green)]">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-[var(--wa-text-primary)]">
                {message.media?.mediaName || message.media?.filePath || 'Sənəd'}
              </div>
              {message.media?.fileSize && (
                <div className="text-[var(--wa-text-secondary)] mt-0.5">
                  {(message.media.fileSize / 1024).toFixed(0)} KB • {message.media.mimeType || 'Fayl'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Poll Message */}
        {message.type === 'poll' && message.poll && (
          <div className="my-1.5 p-2 rounded bg-black/10 dark:bg-black/20 text-xs select-none">
            <div className="font-semibold text-sm mb-2 flex items-center gap-1.5 text-[var(--wa-green)]">
              <Vote size={16} />
              <span>Anket: {message.body}</span>
            </div>
            <div className="space-y-1.5">
              {message.poll.options.map((opt, i) => (
                <div key={i} className="p-2 rounded bg-black/10 border border-white/5">
                  <div className="flex justify-between font-medium mb-1">
                    <span>{opt.name}</span>
                    <span className="text-[var(--wa-text-secondary)]">{opt.votes} səs</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--wa-green)]"
                      style={{ width: `${Math.min(100, (opt.votes / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Message */}
        {message.type === 'location' && message.location && (
          <div className="my-1 p-2 rounded bg-black/20 text-xs flex items-center gap-2">
            <MapPin size={20} className="text-[#ef5350]" />
            <div>
              <div className="font-semibold">{message.location.name || 'Paylaşılan Məkan'}</div>
              <div className="text-[var(--wa-text-secondary)]">
                {message.location.address || `${message.location.lat.toFixed(4)}, ${message.location.lng.toFixed(4)}`}
              </div>
            </div>
          </div>
        )}

        {/* Contact Message */}
        {message.type === 'contact' && (
          <div className="my-1 p-2.5 rounded bg-black/20 text-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <div className="font-semibold text-[var(--wa-text-primary)]">{message.body || 'Kontakt'}</div>
              <div className="text-[var(--wa-text-secondary)]">Kontakt kartı</div>
            </div>
          </div>
        )}

        {/* Message Text Body */}
        {message.type !== 'poll' && message.body && (
          <div className="whitespace-pre-wrap break-words pr-12 text-[var(--wa-text-primary)]">
            {renderFormattedText(message.body)}
          </div>
        )}

        {/* Metadata: Time, Star, Read Receipt */}
        <div className="float-right ml-3 -mb-0.5 mt-1 flex items-center gap-1 text-[11px] text-[var(--wa-text-secondary)] select-none">
          {message.starred && <Star size={11} className="text-[#ffd279] fill-[#ffd279]" />}
          <span>{timeStr}</span>
          {isOut && (
            <span>
              {message.status === 13 ? (
                <CheckCheck size={15} className="text-[var(--wa-blue-check)] inline" />
              ) : message.status === 4 || message.status === 5 ? (
                <CheckCheck size={15} className="text-[var(--wa-text-secondary)] inline" />
              ) : (
                <Check size={15} className="text-[var(--wa-text-secondary)] inline" />
              )}
            </span>
          )}
        </div>

        <div className="clear-both" />

        {/* Reactions Floating Badge */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--wa-header-bg)] border border-white/10 text-[12px] shadow-sm select-none">
            {Array.from(new Set(message.reactions.map(r => r.reaction))).map((rx, idx) => (
              <span key={idx}>{rx}</span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-[var(--wa-text-secondary)] ml-0.5 font-semibold">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
