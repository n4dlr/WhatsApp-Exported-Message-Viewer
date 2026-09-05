import React, { useEffect, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import {
  X,
  Database,
  Copy,
  Check,
  Search,
  FileCode,
  Table as TableIcon,
  Loader2
} from 'lucide-react'

export default function MessageInspectorDrawer() {
  const { inspectedMessageId, setInspectedMessageId, remoteSessionId } = useChatStore()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!inspectedMessageId || !remoteSessionId) {
      setData(null)
      return
    }

    setIsLoading(true)
    setError(null)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''

    fetch(`${backendUrl}/api/session/${remoteSessionId}/messages/${inspectedMessageId}/raw`)
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(resData => {
        setData(resData)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Məlumat oxunmadı')
        setIsLoading(false)
      })
  }, [inspectedMessageId, remoteSessionId])

  if (!inspectedMessageId) return null

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyName)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const renderSection = (title: string, obj: any) => {
    if (!obj || typeof obj !== 'object') return null

    const entries = Object.entries(obj).filter(([key, val]) => {
      if (!searchFilter) return true
      const matchKey = key.toLowerCase().includes(searchFilter.toLowerCase())
      const matchVal = String(val).toLowerCase().includes(searchFilter.toLowerCase())
      return matchKey || matchVal
    })

    if (entries.length === 0 && searchFilter) return null

    return (
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--wa-green)] mb-2 flex items-center gap-1.5 border-b pb-1" style={{ borderColor: 'var(--wa-border)' }}>
          <Database size={13} />
          <span>{title} ({Object.keys(obj).length} sütun)</span>
        </div>

        <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--wa-border)', backgroundColor: 'var(--wa-search-bg)' }}>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b text-[var(--wa-text-secondary)] bg-black/20" style={{ borderColor: 'var(--wa-border)' }}>
                <th className="p-2.5 font-semibold w-1/3">Sütun Adı</th>
                <th className="p-2.5 font-semibold">Dəyər (Value)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map(([k, v]) => {
                const strVal = v === null ? 'NULL' : typeof v === 'object' ? JSON.stringify(v) : String(v)
                const isNull = v === null
                return (
                  <tr key={k} className="hover:bg-white/5 group transition-colors">
                    <td className="p-2.5 font-mono text-[var(--wa-text-primary)] font-medium">
                      {k}
                    </td>
                    <td className="p-2.5 font-mono break-all relative pr-8">
                      <span className={isNull ? 'text-gray-500 italic' : typeof v === 'number' ? 'text-amber-400' : 'text-[var(--wa-text-primary)]'}>
                        {strVal}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(strVal, k)}
                        title="Kopyala"
                        className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 rounded hover:bg-white/10 text-[var(--wa-text-secondary)]"
                      >
                        {copiedKey === k ? <Check size={12} className="text-[var(--wa-green)]" /> : <Copy size={12} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-[580px] max-w-[90vw] h-full flex flex-col shadow-2xl border-l animate-slide-left"
        style={{
          backgroundColor: 'var(--wa-header-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Header */}
        <div
          className="h-[60px] px-5 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: 'var(--wa-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--wa-green)]/20 text-[var(--wa-green)]">
              <Database size={20} />
            </div>
            <div>
              <div className="font-semibold text-sm text-[var(--wa-text-primary)]">
                Mesajın Bütün Sütunları (DB Inspector)
              </div>
              <div className="text-xs text-[var(--wa-text-secondary)]">
                Message ID: #{inspectedMessageId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(JSON.stringify(data, null, 2), 'all_json')}
              className="px-2.5 py-1 rounded text-xs border border-white/10 hover:bg-white/5 flex items-center gap-1.5 text-[var(--wa-text-secondary)]"
            >
              {copiedKey === 'all_json' ? <Check size={13} className="text-[var(--wa-green)]" /> : <Copy size={13} />}
              <span>Bütün JSON-u Kopyala</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectedMessageId(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search and View Tabs */}
        <div className="p-3 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--wa-border)' }}>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--wa-search-bg)' }}>
            <Search size={14} className="text-[var(--wa-text-secondary)]" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Sütun adı və ya dəyər üzrə filtr..."
              className="w-full bg-transparent border-none outline-none text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)]"
            />
            {searchFilter && (
              <button type="button" onClick={() => setSearchFilter('')} className="text-[var(--wa-text-secondary)]">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[var(--wa-search-bg)] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                activeTab === 'table' ? 'bg-[var(--wa-green)] text-[#111b21]' : 'text-[var(--wa-text-secondary)]'
              }`}
            >
              <TableIcon size={13} />
              <span>Cədvəl</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                activeTab === 'json' ? 'bg-[var(--wa-green)] text-[#111b21]' : 'text-[var(--wa-text-secondary)]'
              }`}
            >
              <FileCode size={13} />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="h-64 flex flex-col items-center justify-center text-[var(--wa-text-secondary)] gap-3">
              <Loader2 size={26} className="animate-spin text-[var(--wa-green)]" />
              <span className="text-sm">Bütün sütun məlumatları oxunur...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded bg-red-500/20 text-red-300 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          {!isLoading && data && activeTab === 'table' && (
            <div>
              {renderSection('`message` Cədvəlinin Sütunları', data.message)}
              {data.media && renderSection('`message_media` Əlaqəli Fayl Sütunları', data.media)}
              {data.quoted && renderSection('`message_quoted` Sitat Gətirilən Mesaj Sütunları', data.quoted)}
              {data.reactions && data.reactions.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--wa-green)] mb-2 flex items-center gap-1.5 border-b pb-1" style={{ borderColor: 'var(--wa-border)' }}>
                    <Database size={13} />
                    <span>`message_add_on_reaction` Reaksiyalar ({data.reactions.length})</span>
                  </div>
                  <pre className="text-xs p-3 rounded bg-[var(--wa-search-bg)] overflow-auto font-mono text-emerald-400">
                    {JSON.stringify(data.reactions, null, 2)}
                  </pre>
                </div>
              )}
              {data.senderJid && renderSection('`jid` Göndərənin İdentifikator Sütunları', data.senderJid)}
              {data.jidMap && renderSection('`jid_map` LID -> Telefon Xəritələmə Sütunları', data.jidMap)}
              {data.location && renderSection('`message_location` Lokasiya Sütunları', data.location)}
              {data.vcard && renderSection('`message_vcard` Kontakt Sütunları', data.vcard)}
            </div>
          )}

          {!isLoading && data && activeTab === 'json' && (
            <pre className="text-xs p-4 rounded-lg bg-[var(--wa-search-bg)] border overflow-auto font-mono text-[var(--wa-text-primary)] leading-relaxed" style={{ borderColor: 'var(--wa-border)' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
