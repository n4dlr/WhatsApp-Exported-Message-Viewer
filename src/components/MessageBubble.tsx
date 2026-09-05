import React from 'react'
import { Message } from '../types/message'

export default function MessageBubble({message}:{message:Message}){
  const outgoing = message.isOutgoing
  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'} mb-3`}> 
      <div className={`message-bubble p-3 rounded-lg ${outgoing ? 'bg-green-500 text-white' : 'bg-white border'} shadow-sm`}>
        {message.forwarded && <div className="text-xs text-gray-400">Forwarded</div>}
        {message.deleted ? <em className="text-gray-500">Message deleted</em> : <div dangerouslySetInnerHTML={{__html:escapeHtml(message.body||'')}}></div>}
        <div className="text-xs text-right text-gray-200 mt-1">{new Date(message.timestamp).toLocaleString()}</div>
      </div>
    </div>
  )
}

function escapeHtml(unsafe?:string){
  if(!unsafe) return ''
  return unsafe.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;")
}
