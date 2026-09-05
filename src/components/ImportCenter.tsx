import React, { useEffect, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import {
  Database,
  Lock,
  UploadCloud,
  FileText,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  HardDrive
} from 'lucide-react'

type DetectedFile = {
  fileName: string
  filePath: string
  sizeBytes: number
  sizeFormatted: string
  modifiedAt: number
}

export default function ImportCenter() {
  const { isImportCenterOpen, setIsImportCenterOpen, setRemoteSession } = useChatStore()

  const [activeTab, setActiveTab] = useState<'local' | 'upload' | 'encrypted'>('local')
  const [detectedFiles, setDetectedFiles] = useState<DetectedFile[]>([])
  const [manualPath, setManualPath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Encrypted state
  const [cryptFile, setCryptFile] = useState<File | null>(null)
  const [keyMaterial, setKeyMaterial] = useState('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL || ''

  // Auto-detect local databases on mount
  useEffect(() => {
    if (!isImportCenterOpen) return
    fetch(`${backendUrl}/api/detect-local`)
      .then(res => res.json())
      .then(d => {
        if (d.detected) {
          setDetectedFiles(d.detected)
          if (d.detected.length > 0) {
            setManualPath(d.detected[0].filePath)
          }
        }
      })
      .catch(console.error)
  }, [isImportCenterOpen])

  if (!isImportCenterOpen) return null

  // Open local file directly in <50ms without any upload
  const handleOpenLocal = async (path: string) => {
    setIsLoading(true)
    setErrorMessage('')
    setStatusText('Lokal verilənlər bazası açılır...')

    try {
      const res = await fetch(`${backendUrl}/api/import/local-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path })
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()
      setStatusText('Uğurla açıldı!')
      setRemoteSession(data.sessionId, data.stats)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Baza açıla bilmədi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Upload DB via multipart
  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setErrorMessage('')
    setStatusText(`'${file.name}' yüklənir və indekslənir...`)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${backendUrl}/api/import/database`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()
      setStatusText('Uğurla yükləndi!')
      setRemoteSession(data.sessionId, data.stats)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Yükləmə uğursuz oldu.')
    } finally {
      setIsLoading(false)
    }
  }

  // Decrypt encrypted backup
  const handleEncryptedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cryptFile || !keyMaterial.trim()) return

    setIsLoading(true)
    setErrorMessage('')
    setStatusText('Şifrə açılır və SQLite bazası indekslənir...')

    const formData = new FormData()
    formData.append('file', cryptFile)
    formData.append('keyMaterial', keyMaterial.trim())

    try {
      const res = await fetch(`${backendUrl}/api/import/encrypted-backup`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()
      setStatusText('Şifrə açıldı və baza indeksləndi!')
      setRemoteSession(data.sessionId, data.stats)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Şifrənin açılması uğursuz oldu.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div
        className="w-[720px] max-w-[96vw] rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-slide-left"
        style={{
          backgroundColor: 'var(--wa-panel-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Header */}
        <div
          className="h-[65px] px-6 flex items-center justify-between border-b"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--wa-green)] text-[#111b21] shadow-md">
              <Database size={22} />
            </div>
            <div>
              <div className="font-semibold text-base text-[var(--wa-text-primary)]">
                WhatsApp Verilənlər Bazası Girişi
              </div>
              <div className="text-xs text-[var(--wa-text-secondary)]">
                600MB və 5GB+ bazalar donmadan, dərhal işlənir
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsImportCenterOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b text-xs font-semibold" style={{ borderColor: 'var(--wa-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'local'
                ? 'border-[var(--wa-green)] text-[var(--wa-green)] bg-[var(--wa-green)]/10'
                : 'border-transparent text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
            }`}
          >
            <HardDrive size={16} />
            <span>Lokal Fayllar (Dərhal Aç / 0ms)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-[var(--wa-green)] text-[var(--wa-green)] bg-[var(--wa-green)]/10'
                : 'border-transparent text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
            }`}
          >
            <UploadCloud size={16} />
            <span>Fayl Yüklə (SQLite / TXT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('encrypted')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'encrypted'
                ? 'border-[var(--wa-green)] text-[var(--wa-green)] bg-[var(--wa-green)]/10'
                : 'border-transparent text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
            }`}
          >
            <Lock size={16} />
            <span>Şifrələnmiş Backup (.crypt15)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
          {/* Tab 1: Local Instant Open */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <div className="text-xs text-[var(--wa-text-secondary)] leading-relaxed">
                Kompüterinizdə olan böyük bazalar (məsələn, 1.33GB <code className="text-[var(--wa-green)]">msgstore.db_decrypted.db</code>) brauzerə yüklənmədən birbaşa diskdən <span className="font-semibold text-[var(--wa-text-primary)]">50 millisaniyədə</span> açılır.
              </div>

              {detectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--wa-text-primary)]">
                    Aşkar Edilən Yerli Bazalar:
                  </div>

                  <div className="space-y-2">
                    {detectedFiles.map(file => (
                      <div
                        key={file.filePath}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-3 hover:border-[var(--wa-green)] transition-colors group"
                        style={{
                          backgroundColor: 'var(--wa-header-bg)',
                          borderColor: 'var(--wa-border)'
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-[var(--wa-green)]/20 text-[var(--wa-green)] flex-shrink-0">
                            <Database size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-[var(--wa-text-primary)] truncate font-mono">
                              {file.fileName}
                            </div>
                            <div className="text-xs text-[var(--wa-text-secondary)] truncate">
                              {file.sizeFormatted} • {file.filePath}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleOpenLocal(file.filePath)}
                          className="px-4 py-2 rounded-lg bg-[var(--wa-green)] text-[#111b21] font-semibold text-xs flex-shrink-0 hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                          Dərhal Aç
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Path Input */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--wa-border)' }}>
                <label className="block text-xs font-semibold text-[var(--wa-text-primary)] mb-2">
                  Və ya İstənilən Fayl Yolunu Daxil Edin:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualPath}
                    onChange={e => setManualPath(e.target.value)}
                    placeholder="/home/user/.../msgstore.db"
                    className="flex-1 p-2.5 rounded-lg text-xs font-mono border outline-none text-[var(--wa-text-primary)]"
                    style={{
                      backgroundColor: 'var(--wa-search-bg)',
                      borderColor: 'var(--wa-border)'
                    }}
                  />
                  <button
                    type="button"
                    disabled={isLoading || !manualPath.trim()}
                    onClick={() => handleOpenLocal(manualPath.trim())}
                    className="px-4 py-2.5 rounded-lg bg-[var(--wa-green)] text-[#111b21] font-semibold text-xs hover:opacity-90 disabled:opacity-50"
                  >
                    Aç
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label
                className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--wa-green)] transition-colors text-center"
                style={{
                  backgroundColor: 'var(--wa-search-bg)',
                  borderColor: 'var(--wa-border)'
                }}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) void handleFileUpload(f)
                  }}
                />
                <UploadCloud size={40} className="text-[var(--wa-green)] mb-3" />
                <div className="font-semibold text-sm text-[var(--wa-text-primary)] mb-1">
                  SQLite Verilənlər Bazasını Seçin və ya Sürükləyin
                </div>
                <div className="text-xs text-[var(--wa-text-secondary)]">
                  msgstore.db, .sqlite, .db faylları dəstəklənir
                </div>
              </label>
            </div>
          )}

          {/* Tab 3: Encrypted Backup */}
          {activeTab === 'encrypted' && (
            <form onSubmit={handleEncryptedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--wa-text-primary)] mb-1.5">
                  1. Şifrələnmiş WhatsApp Backup Faylını Seçin (.crypt14 / .crypt15):
                </label>
                <input
                  type="file"
                  accept=".crypt14,.crypt15,.crypt"
                  onChange={e => setCryptFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[var(--wa-text-secondary)] p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--wa-search-bg)',
                    borderColor: 'var(--wa-border)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--wa-text-primary)] mb-1.5">
                  2. 64-Simvollu Şifrələmə Açarı (Hex Key Material):
                </label>
                <input
                  type="password"
                  value={keyMaterial}
                  onChange={e => setKeyMaterial(e.target.value)}
                  placeholder="Məsələn: a1b2c3d4e5f6..."
                  className="w-full p-2.5 rounded-lg text-xs font-mono border outline-none text-[var(--wa-text-primary)]"
                  style={{
                    backgroundColor: 'var(--wa-search-bg)',
                    borderColor: 'var(--wa-border)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !cryptFile || !keyMaterial.trim()}
                className="w-full py-3 rounded-lg bg-[var(--wa-green)] text-[#111b21] font-semibold text-xs hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Şifrə Açılır...' : 'Backup-ın Şifrəsini Aç və Bazanı İndekslə'}
              </button>
            </form>
          )}

          {/* Status & Feedback */}
          {isLoading && (
            <div className="p-3 rounded-lg bg-[var(--wa-green)]/10 text-[var(--wa-green)] text-xs flex items-center gap-2 border border-[var(--wa-green)]/20 animate-fade-in">
              <Loader2 size={16} className="animate-spin" />
              <span>{statusText || 'Gözləyin...'}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-500/10 text-red-400 text-xs flex items-center gap-2 border border-red-500/20 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
