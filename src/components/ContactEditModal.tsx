import React, { useState, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { formatPhoneNumber } from '../utils/formatters'
import { User, X, Check } from 'lucide-react'

export default function ContactEditModal() {
  const { editingContact, setEditingContact, setCustomContact } = useChatStore()
  const [name, setName] = useState('')

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.currentName || '')
    }
  }, [editingContact])

  if (!editingContact) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomContact(editingContact.identifier, name)
  }

  const formattedId = formatPhoneNumber(editingContact.identifier) || editingContact.identifier

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div
        className="w-[400px] max-w-[92vw] rounded-xl shadow-2xl border overflow-hidden animate-slide-left"
        style={{
          backgroundColor: 'var(--wa-panel-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Header */}
        <div
          className="h-[52px] px-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--wa-text-primary)]">
            <User size={18} className="text-[var(--wa-green)]" />
            <span>Kontakt Adını Təyin Et</span>
          </div>
          <button
            type="button"
            onClick={() => setEditingContact(null)}
            className="p-1 rounded-full hover:bg-white/10 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <div className="text-xs text-[var(--wa-text-secondary)] mb-1">
              İdentifikator / Nömrə:
            </div>
            <div className="text-xs font-mono font-semibold text-[var(--wa-green)] p-2 rounded bg-[var(--wa-search-bg)] border border-white/5 truncate">
              {formattedId}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--wa-text-primary)] mb-1.5">
              Görünəcək Ad:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Məsələn: Əli, Vüsal Müəllim..."
              autoFocus
              className="w-full p-2.5 rounded-lg text-sm border outline-none text-[var(--wa-text-primary)] focus:ring-1 focus:ring-[var(--wa-green)]"
              style={{
                backgroundColor: 'var(--wa-search-bg)',
                borderColor: 'var(--wa-border)'
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingContact(null)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--wa-text-secondary)] hover:bg-white/5"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--wa-green)] text-[#111b21] hover:opacity-90 flex items-center gap-1.5 shadow"
            >
              <Check size={14} />
              <span>Yadda saxla</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
