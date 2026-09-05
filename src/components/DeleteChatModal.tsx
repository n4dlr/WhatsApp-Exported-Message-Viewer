import React from 'react'
import { useChatStore } from '../stores/chatStore'
import { formatPhoneNumber } from '../utils/formatters'
import { Trash2, AlertTriangle, X } from 'lucide-react'

export default function DeleteChatModal() {
  const { chatToDelete, setChatToDelete, deleteChat, customContacts } = useChatStore()

  if (!chatToDelete) return null

  const customName = chatToDelete.phoneNumber ? customContacts[chatToDelete.phoneNumber] : null
  const displayName = customName || chatToDelete.contactName || chatToDelete.name || formatPhoneNumber(chatToDelete.phoneNumber) || 'Bu söhbət'

  const handleConfirm = () => {
    deleteChat(chatToDelete.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl border flex flex-col gap-4 animate-scale-up"
        style={{
          backgroundColor: 'var(--wa-header-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ef5350]/15 text-[#ef5350] flex items-center justify-center flex-shrink-0">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--wa-text-primary)] font-sans">
                Söhbət silinsin?
              </h3>
              <p className="text-xs text-[var(--wa-text-secondary)]">
                Bu əməliyyat söhbəti siyahıdan çıxaracaq
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChatToDelete(null)}
            className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] p-1 rounded-full hover:bg-[var(--wa-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-sm text-[var(--wa-text-secondary)] leading-relaxed bg-[var(--wa-search-bg)] p-3.5 rounded-xl border border-white/5">
          <span className="font-semibold text-[var(--wa-text-primary)]">"{displayName}"</span> ilə olan söhbət və bütün mesajlar arxiv siyahısından silinəcək.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setChatToDelete(null)}
            className="px-4 py-2 rounded-lg text-sm text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition-colors cursor-pointer"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#ef5350] hover:bg-[#d32f2f] text-white shadow transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Söhbəti Sil</span>
          </button>
        </div>
      </div>
    </div>
  )
}
