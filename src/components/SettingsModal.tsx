import React from 'react'
import { useChatStore } from '../stores/chatStore'

export default function SettingsModal({onClose}:{onClose:()=>void}){
  const { theme, language, setTheme, setLanguage } = useChatStore()
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={onClose}>
      <section className="w-[360px] rounded-lg bg-white p-5 shadow-xl" onClick={event=>event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Close settings">×</button>
        </div>
        <label className="mt-5 block text-sm font-medium">
          Appearance
          <select value={theme} onChange={event=>setTheme(event.target.value as 'light'|'dark')} className="mt-2 w-full rounded border p-2">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium">
          Language
          <select value={language} onChange={event=>setLanguage(event.target.value as 'az'|'en'|'tr'|'ru')} className="mt-2 w-full rounded border p-2">
            <option value="az">Azərbaycan dili</option>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="ru">Русский</option>
          </select>
        </label>
        <button type="button" onClick={onClose} className="mt-5 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white">Done</button>
      </section>
    </div>
  )
}
