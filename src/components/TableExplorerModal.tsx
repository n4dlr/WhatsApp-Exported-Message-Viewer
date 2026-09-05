import React, { useEffect, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import {
  X,
  Database,
  Search,
  Table as TableIcon,
  Code,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react'

export default function TableExplorerModal() {
  const { isTableExplorerOpen, setIsTableExplorerOpen, remoteSessionId } = useChatStore()

  const [tables, setTables] = useState<{ name: string; rowCount: number | null }[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('chat')
  const [tableSearch, setTableSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'browse' | 'query'>('browse')

  // Table browse state
  const [tableData, setTableData] = useState<any>(null)
  const [tableLoading, setTableLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowSearch, setRowSearch] = useState('')

  // Custom SQL state
  const [customSql, setCustomSql] = useState('SELECT * FROM chat LIMIT 20')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || ''

  // Load tables list on open
  useEffect(() => {
    if (!isTableExplorerOpen || !remoteSessionId) return
    fetch(`${backendUrl}/api/session/${remoteSessionId}/tables`)
      .then(res => res.json())
      .then(d => {
        if (d.tables) {
          setTables(d.tables)
          if (!selectedTable && d.tables.length > 0) {
            setSelectedTable(d.tables[0].name)
          }
        }
      })
      .catch(console.error)
  }, [isTableExplorerOpen, remoteSessionId])

  // Load selected table data
  useEffect(() => {
    if (!isTableExplorerOpen || !remoteSessionId || !selectedTable || activeTab !== 'browse') return

    setTableLoading(true)
    const limit = 50
    const offset = page * limit
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    })
    if (rowSearch) params.set('search', rowSearch)

    fetch(`${backendUrl}/api/session/${remoteSessionId}/table/${selectedTable}?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        setTableData(d)
        setTableLoading(false)
      })
      .catch(err => {
        console.error(err)
        setTableLoading(false)
      })
  }, [isTableExplorerOpen, remoteSessionId, selectedTable, page, rowSearch, activeTab])

  const runCustomQuery = () => {
    if (!customSql.trim() || !remoteSessionId) return
    setQueryLoading(true)
    setQueryError(null)

    fetch(`${backendUrl}/api/session/${remoteSessionId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: customSql })
    })
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(d => {
        setQueryResult(d)
        setQueryLoading(false)
      })
      .catch(err => {
        setQueryError(err instanceof Error ? err.message : 'Sorğu icra olunmadı')
        setQueryLoading(false)
      })
  }

  if (!isTableExplorerOpen) return null

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-fade-in">
      <div
        className="w-[1280px] max-w-[96vw] h-[88vh] rounded-xl flex flex-col shadow-2xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--wa-panel-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* Header */}
        <div
          className="h-[60px] px-6 flex items-center justify-between border-b flex-shrink-0"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--wa-green)] text-[#111b21]">
              <Database size={20} />
            </div>
            <div>
              <div className="font-semibold text-base text-[var(--wa-text-primary)]">
                Baza Cədvəlləri və Sxem Baxıcısı (Database Explorer)
              </div>
              <div className="text-xs text-[var(--wa-text-secondary)]">
                Cəmi {tables.length} cədvəl mövcuddur
              </div>
            </div>
          </div>

          {/* Navigation Tabs & Close */}
          <div className="flex items-center gap-3">
            <div className="flex bg-[var(--wa-search-bg)] p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                  activeTab === 'browse'
                    ? 'bg-[var(--wa-green)] text-[#111b21]'
                    : 'text-[var(--wa-text-secondary)]'
                }`}
              >
                <TableIcon size={14} />
                <span>Cədvəllər</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('query')}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                  activeTab === 'query'
                    ? 'bg-[var(--wa-green)] text-[#111b21]'
                    : 'text-[var(--wa-text-secondary)]'
                }`}
              >
                <Code size={14} />
                <span>SQL Sorğu İcraçısı</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsTableExplorerOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'browse' ? (
          <div className="flex-1 flex min-h-0">
            {/* Tables List Sidebar */}
            <div
              className="w-[280px] border-r flex flex-col flex-shrink-0"
              style={{
                backgroundColor: 'var(--wa-header-bg)',
                borderColor: 'var(--wa-border)'
              }}
            >
              <div className="p-3 border-b" style={{ borderColor: 'var(--wa-border)' }}>
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs"
                  style={{ backgroundColor: 'var(--wa-search-bg)' }}
                >
                  <Search size={14} className="text-[var(--wa-text-secondary)]" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder="Cədvəl axtar..."
                    className="w-full bg-transparent border-none outline-none text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5 text-xs">
                {filteredTables.map(t => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setSelectedTable(t.name)
                      setPage(0)
                      setRowSearch('')
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                      selectedTable === t.name
                        ? 'bg-[var(--wa-green)]/20 text-[var(--wa-green)] font-semibold'
                        : 'text-[var(--wa-text-primary)] hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{t.name}</span>
                    <span className="text-[11px] text-[var(--wa-text-secondary)] opacity-80">
                      {t.rowCount != null ? t.rowCount.toLocaleString() : '-'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Viewer */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--wa-panel-bg)]">
              {/* Table Toolbar */}
              <div
                className="p-3 border-b flex items-center justify-between gap-4"
                style={{
                  backgroundColor: 'var(--wa-header-bg)',
                  borderColor: 'var(--wa-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-[var(--wa-text-primary)] font-mono">
                    {selectedTable}
                  </span>
                  {tableData && (
                    <span className="text-xs text-[var(--wa-text-secondary)]">
                      {tableData.totalCount.toLocaleString()} sətir • {tableData.columns?.length || 0} sütun
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-xs w-64"
                    style={{ backgroundColor: 'var(--wa-search-bg)' }}
                  >
                    <Search size={13} className="text-[var(--wa-text-secondary)]" />
                    <input
                      type="text"
                      value={rowSearch}
                      onChange={e => {
                        setRowSearch(e.target.value)
                        setPage(0)
                      }}
                      placeholder="Bu cədvəldə axtar..."
                      className="w-full bg-transparent border-none outline-none text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)]"
                    />
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--wa-text-secondary)]">
                    <button
                      type="button"
                      disabled={page === 0 || tableLoading}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span>Səhifə {page + 1}</span>
                    <button
                      type="button"
                      disabled={!tableData || (page + 1) * 50 >= tableData.totalCount || tableLoading}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Grid */}
              <div className="flex-1 overflow-auto">
                {tableLoading ? (
                  <div className="h-full flex items-center justify-center text-sm text-[var(--wa-text-secondary)] gap-2">
                    <Loader2 size={20} className="animate-spin text-[var(--wa-green)]" />
                    <span>Cədvəl məlumatları oxunur...</span>
                  </div>
                ) : tableData && tableData.rows?.length > 0 ? (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-[var(--wa-header-bg)] border-b shadow-sm" style={{ borderColor: 'var(--wa-border)' }}>
                      <tr>
                        {tableData.columns.map((col: any) => (
                          <th key={col.name} className="p-3 font-semibold text-[var(--wa-text-secondary)] whitespace-nowrap">
                            <div>{col.name}</div>
                            <div className="text-[10px] font-normal opacity-60 font-mono">{col.type || 'TEXT'}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tableData.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors font-mono">
                          {tableData.columns.map((col: any) => {
                            const val = row[col.name]
                            const isNull = val === null
                            const str = isNull ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val)
                            return (
                              <td key={col.name} className="p-2.5 max-w-[280px] truncate text-[var(--wa-text-primary)]" title={str}>
                                <span className={isNull ? 'text-gray-500 italic' : typeof val === 'number' ? 'text-amber-400' : ''}>
                                  {str}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-sm text-[var(--wa-text-secondary)]">
                    Heç bir məlumat tapılmadı.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SQL Query Runner Tab */
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--wa-text-primary)]">
                SQL SELECT Sorğusu İcra Edin
              </span>
              <button
                type="button"
                onClick={runCustomQuery}
                disabled={queryLoading}
                className="px-4 py-2 rounded-lg bg-[var(--wa-green)] text-[#111b21] font-semibold text-xs flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
              >
                {queryLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                <span>İcra et (Run SQL)</span>
              </button>
            </div>

            <textarea
              value={customSql}
              onChange={e => setCustomSql(e.target.value)}
              rows={4}
              placeholder="SELECT * FROM chat WHERE unseen_message_count > 0 LIMIT 50"
              className="w-full p-3 rounded-lg font-mono text-sm border outline-none text-[var(--wa-text-primary)]"
              style={{
                backgroundColor: 'var(--wa-header-bg)',
                borderColor: 'var(--wa-border)'
              }}
            />

            {queryError && (
              <div className="p-3 rounded bg-red-500/20 text-red-300 text-xs border border-red-500/30">
                {queryError}
              </div>
            )}

            {queryResult && (
              <div className="flex-1 rounded-lg border overflow-hidden flex flex-col" style={{ borderColor: 'var(--wa-border)' }}>
                <div className="p-2.5 bg-black/20 text-xs text-[var(--wa-text-secondary)] border-b" style={{ borderColor: 'var(--wa-border)' }}>
                  Nəticə: {queryResult.count} sətir tapıldı
                </div>
                <div className="flex-1 overflow-auto max-h-[400px]">
                  {queryResult.rows && queryResult.rows.length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse font-mono">
                      <thead className="sticky top-0 bg-[var(--wa-header-bg)] border-b" style={{ borderColor: 'var(--wa-border)' }}>
                        <tr>
                          {Object.keys(queryResult.rows[0]).map(k => (
                            <th key={k} className="p-2.5 font-semibold text-[var(--wa-text-secondary)]">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {queryResult.rows.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5">
                            {Object.values(row).map((v: any, vIdx: number) => (
                              <td key={vIdx} className="p-2.5 max-w-[240px] truncate text-[var(--wa-text-primary)]">
                                {v === null ? <span className="text-gray-500 italic">NULL</span> : String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-xs text-[var(--wa-text-secondary)]">0 sətir</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
