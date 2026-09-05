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
  Archive,
  ArrowLeft,
  CircleDashed,
  Users2,
  Newspaper
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
    archivedCount,
    isArchivedView,
    setIsArchivedView,
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
      {/* View 1: Top Header in Archived Mode (WhatsApp Web style) */}
      {isArchivedView ? (
        <div
          className="h-[60px] px-4 flex items-center gap-4 border-b flex-shrink-0"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          <button
            type="button"
            onClick={() => setIsArchivedView(false)}
            className="p-1.5 rounded-full hover:bg-[var(--wa-hover)] text-[var(--wa-text-primary)] transition-colors"
            title="Geri qayıt"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex flex-col">
            <span className="text-[17px] font-semibold text-[var(--wa-text-primary)] font-sans">
              Arxivlənmiş
            </span>
            <span className="text-[11.5px] text-[var(--wa-text-secondary)]">
              {archivedCount} söhbət
            </span>
          </div>
        </div>
      ) : (
        /* View 2: Normal Sidebar Header */
        <div
          className="h-[60px] px-4 flex items-center justify-between border-b flex-shrink-0"
          style={{
            backgroundColor: 'var(--wa-header-bg)',
            borderColor: 'var(--wa-border)'
          }}
        >
          {/* User Avatar & DB Title */}
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div
              className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
              title="İstifadəçi Profili"
            >
              WA
            </div>
            {stats && (
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[13.5px] font-semibold text-[var(--wa-text-primary)] leading-tight truncate"
                  title={stats.fileName}
                >
                  {stats.fileName}
                </span>
                <span className="text-[11px] text-[var(--wa-text-secondary)] truncate">
                  {(stats.totalMessages / 1000).toFixed(0)}k mesaj • {stats.totalChats} çat
                </span>
              </div>
            )}
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center gap-0.5 text-[var(--wa-text-secondary)] flex-shrink-0">
            {/* Communities */}
            <button
              type="button"
              title="İcmalar (Communities)"
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors opacity-80 hover:opacity-100"
            >
              <Users2 size={19} />
            </button>

            {/* Status */}
            <button
              type="button"
              title="Status"
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors opacity-80 hover:opacity-100"
            >
              <CircleDashed size={19} />
            </button>

            {/* Channels */}
            <button
              type="button"
              title="Kanallar"
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors opacity-80 hover:opacity-100"
            >
              <Newspaper size={19} />
            </button>

            {/* Database Explorer */}
            <button
              type="button"
              title="Baza Cədvəlləri və Sxem (Database Explorer)"
              onClick={() => setIsTableExplorerOpen(true)}
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors relative"
            >
              <Database size={19} />
              {stats && stats.totalTables && (
                <span className="absolute top-0.5 right-0.5 bg-[var(--wa-green)] text-[#111b21] text-[9px] font-bold px-1 rounded-full shadow">
                  {stats.totalTables}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              title={theme === 'dark' ? 'İşıqlı rejim' : 'Qaranlıq rejim'}
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* 3-dots Menu */}
            <div className="relative">
              <button
                type="button"
                title="Seçimlər menyusu"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition-colors"
              >
                <MoreVertical size={19} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 py-2 rounded-lg shadow-2xl z-50 text-sm animate-fade-in border"
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
                      setIsArchivedView(true)
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--wa-hover)] flex items-center gap-2.5 text-[var(--wa-text-primary)]"
                  >
                    <Archive size={16} />
                    <span>Arxivlənmiş Söhbətlər ({archivedCount})</span>
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
      )}

      {/* WhatsApp Search Bar */}
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--wa-border)' }}>
        <div
          className="flex-1 flex items-center gap-3 px-3.5 py-1.5 rounded-lg text-sm transition-all focus-within:ring-1 focus-within:ring-[var(--wa-green)]/40"
          style={{ backgroundColor: 'var(--wa-search-bg)' }}
        >
          <Search size={16} className="text-[var(--wa-text-secondary)] flex-shrink-0" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={e => setChatSearchQuery(e.target.value)}
            placeholder={isArchivedView ? "Arxivdə axtarış..." : "Axtarış edin və ya yeni söhbət..."}
            className="w-full bg-transparent border-none outline-none text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)] text-[14px]"
          />
          {chatSearchQuery && (
            <button
              type="button"
              onClick={() => setChatSearchQuery('')}
              className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Unread Filter Toggle Button (Only in Normal View) */}
        {!isArchivedView && (
          <button
            type="button"
            title="Oxunmamış söhbətlər filtri"
            onClick={() => setChatFilter(chatFilter === 'unread' ? 'all' : 'unread')}
            className={`p-2 rounded-lg transition-colors ${
              chatFilter === 'unread'
                ? 'bg-[var(--wa-green)] text-[#111b21]'
                : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)]'
            }`}
          >
            <Filter size={17} />
          </button>
        )}
      </div>

      {/* Filter Chips Pill Row (Only in Normal View) */}
      {!isArchivedView && (
        <div className="px-3 py-2 flex items-center gap-2 border-b text-[13px] overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--wa-border)' }}>
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
                className={`px-3 py-1 rounded-full text-xs transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#00a884]/20 text-[var(--wa-green)] border border-[var(--wa-green)]/50 font-semibold shadow-sm'
                    : 'bg-[var(--wa-search-bg)] text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] border border-transparent'
                }`}
              >
                {labels[filter]}
              </button>
            )
          })}
        </div>
      )}

      {/* WhatsApp Official "Arxivlənmiş" Row (Above Chats in Normal View) */}
      {!isArchivedView && archivedCount > 0 && !chatSearchQuery && (
        <button
          type="button"
          onClick={() => setIsArchivedView(true)}
          className="w-full px-4 py-3 flex items-center justify-between border-b hover:bg-[var(--wa-hover)] transition-colors cursor-pointer select-none group"
          style={{ borderColor: 'var(--wa-border)' }}
        >
          <div className="flex items-center gap-4">
            <Archive size={19} className="text-[var(--wa-green)] group-hover:scale-105 transition-transform" />
            <span className="text-[15px] font-semibold text-[var(--wa-text-primary)] font-sans">
              Arxivlənmiş
            </span>
          </div>

          <span className="text-[12px] font-bold text-[var(--wa-green)] px-1.5 py-0.5 rounded-full bg-[var(--wa-green)]/15">
            {archivedCount}
          </span>
        </button>
      )}

      {/* Chat List */}
      <div className="flex-1 min-h-0">
        <ChatList />
      </div>
    </div>
  )
}
