// WhatsApp participant colors (curated palette matching WhatsApp Web)
export const PARTICIPANT_COLORS = [
  '#00a884', // teal green
  '#53bdeb', // sky blue
  '#e542a3', // rose pink
  '#f28b22', // orange
  '#a476f7', // purple
  '#d69800', // amber
  '#26a69a', // mint
  '#ef5350', // coral
  '#20c997', // turquoise
  '#fd7e14'  // warm orange
]

export function getParticipantColor(identifier: string): string {
  if (!identifier) return PARTICIPANT_COLORS[0]
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PARTICIPANT_COLORS[Math.abs(hash) % PARTICIPANT_COLORS.length]
}

// Format phone numbers nicely (e.g. 994505228080 -> +994 50 522 80 80)
export function formatPhoneNumber(raw?: string | null): string {
  if (!raw) return ''
  const cleaned = raw.replace(/\D/g, '')

  // Azerbaijan numbers (994XXXXXXXXX)
  if (cleaned.startsWith('994') && cleaned.length === 12) {
    const code = cleaned.slice(3, 5)
    const p1 = cleaned.slice(5, 8)
    const p2 = cleaned.slice(8, 10)
    const p3 = cleaned.slice(10, 12)
    return `+994 ${code} ${p1} ${p2} ${p3}`
  }

  // Turkey numbers (905XXXXXXXXX)
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    return `+90 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
  }

  // Russia numbers (7XXXXXXXXXX)
  if (cleaned.startsWith('7') && cleaned.length === 11) {
    return `+7 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`
  }

  // US/Canada numbers (1XXXXXXXXXX)
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`
  }

  // Fallback: If it's a long number, prefix with +
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return `+${cleaned}`
  }

  return raw
}

// WhatsApp Web time format: "14:32", "Dünən", "05.09.2026"
export function formatWhatsAppTime(timestamp?: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Dünən'
  }

  // This week (show day name e.g. "Bazar ertəsi")
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    const days = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə']
    return days[date.getDay()]
  }

  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
}

// File size formatter (e.g. 1024 -> 1 KB, 1048576 -> 1 MB)
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
