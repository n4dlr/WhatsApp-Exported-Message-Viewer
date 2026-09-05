import React from 'react'
import MessageList from './MessageList'

export default function ChatArea(){
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="font-semibold">Select a conversation</div>
          <div className="text-xs text-gray-500">Import data to view messages</div>
        </div>
        <div className="text-sm text-gray-500">Options</div>
      </div>
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-[url('/wallpaper.jpg')] opacity-5"></div>
        <MessageList />
      </div>

      <div className="p-4 border-t bg-white">
        <input className="w-full p-3 rounded bg-gray-100" placeholder="Type a message... (viewer only)" disabled />
      </div>
    </div>
  )
}
