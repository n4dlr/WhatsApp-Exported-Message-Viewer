import React, { useState } from 'react'
import ChatList from './ChatList'
import { useChatStore, ChatFilter } from '../stores/chatStore'
import {
  Database,
  Sun,
  Moon,
  Search,
  X,
  Filter,
  MoreVertical,
  FolderOpen,
  Users
} from 'lucide-react'

export default function Sidebar() {
  const {
    stats,
    theme,
    setTheme,
    chatFilter,
    setChatFilter,
    chatSearchQuery,
    setChatSearchQuery,
    setIsTableExplorerOpen,
    setIsImportCenterOpen
  } = useChatStore()

  const [menuOpen, setMenuOpen] = useState(false)

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <div
      className="w-[420px] max-w-[40vw] min-w-[340px] h-full flex flex-col border-r flex-shrink-0 relative select-none"
      style={{
        backgroundColor: 'var(--wa-panel-bg)',
        borderColor: 'var(--wa-border)'
      }}
    >
      {/* WhatsApp Sidebar Top Header */}
      <div
        className="h-[60px] px-4 flex items-center justify-between border-b flex-shrink-0"
        style={{
          backgroundColor: 'var(--wa-header-bg)',
          borderColor: 'var(--wa-border)'
        }}
      >
        {/* User Avatar & DB Stats Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
            WA
          </div>
          {stats && (
            <div className="flex flex-col">
              <span className="text-[13.5px] font-semibold text-[var(--wa-text-primary)] leading-tight truncate max-w-[140px]">
                {stats.fileName}
              </span>
              <span className="text-[11.5px] text-[var(--wa-text-secondary)]">
                {(stats.totalMessages / 1000).toFixed(0)}k mesaj • {stats.totalChats} çat
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 text-[var(--wa-text-secondary)]">
          {/* Database Inspector / Table Explorer */}
          <button
            type="button"
            title="Bütün Cədvəllərə və Sxemə Bax (Database Explorer)"
            onClick={() => setIsTableExplorerOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors relative"
          >
            <Database size={20} />
            {stats && stats.totalTables && (
              <span className="absolute -top-1 -right-1 bg-[var(--wa-green)] text-[#111b21] text-[9px] font-bold px-1 rounded-full">
                {stats.totalTables}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            title={theme === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Import / Change DB */}
          <button
            type="button"
            title="Başqa Baza / Fayl Aç"
            onClick={() => setIsImportCenterOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
          >
            <FolderOpen size={20} />
          </button>

          {/* 3-dots Menu */}
          <div className="relative">
            <button
              type="button"
              title="Menyu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 py-2 rounded-lg shadow-xl z-50 text-sm animate-fade-in border"
                style={{
                  backgroundColor: 'var(--wa-header-bg)',
                  borderColor: 'var(--wa-border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsTableExplorerOpen(true)
                    setMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)]"
                >
                  <Database size={16} className="text-[var(--wa-green)]" />
                  <span>Baza Cədvəlləri ({stats?.totalTables || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportCenterOpen(true)
                    setMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)]"
                >
                  <FolderOpen size={16} />
                  <span>Yeni Baza / Fayl Seç</span>
                </button>
                <div className="h-px my-1 bg-[var(--wa-border)]" />
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme()
                    setMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)]"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === 'dark' ? 'İşıqlı Rejim' : 'Qaranlıq Rejim'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Search Bar */}
      <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--wa-border)' }}>
        <div
          className="flex-1 flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{ backgroundColor: 'var(--wa-search-bg)' }}
        >
          <Search size={17} className="text-[var(--wa-text-secondary)] flex-shrink-0" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={e => setChatSearchQuery(e.target.value)}
            placeholder="Axtarış edin və ya yeni söhbət..."
            className="w-full bg-transparent border-none outline-none text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)] text-[14px]"
          />
          {chatSearchQuery && (
            <button
              type="button"
              onClick={() => setChatSearchQuery('')}
              className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Unread Filter Toggle */}
        <button
          type="button"
          title="Oxunmamış söhbətlər"
          onClick={() => setChatFilter(chatFilter === 'unread' ? 'all' : 'unread')}
          className={`p-2 rounded-lg transition-colors ${
            chatFilter === 'unread'
              ? 'bg-[var(--wa-green)] text-[#111b21]'
              : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)]'
          }`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Pills Row */}
      <div className="px-3 py-1.5 flex items-center gap-2 border-b text-[13px]" style={{ borderColor: 'var(--wa-border)' }}>
        {(['all', 'unread', 'groups'] as ChatFilter[]).map(filter => {
          const labels: Record<ChatFilter, string> = {
            all: 'Hamısı',
            unread: 'Oxunmamış',
            groups: 'Qruplar'
          }
          const isActive = chatFilter === filter
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setChatFilter(filter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#00a884]/20 text-[var(--wa-green)] border border-[var(--wa-green)]/40 font-semibold'
                  : 'bg-[var(--wa-search-bg)] text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]'
              }`}
            >
              {labels[filter]}
            </button>
          )
        })}
      </div>

      {/* Chat List */}
      <div className="flex-1 min-h-0">
        <ChatList />
      </div>
    </div>
  )
}
