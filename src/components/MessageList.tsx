import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import { useVirtual } from 'react-virtual'

export default function MessageList(){
  const { messages } = useChatStore()
  const parentRef = useRef<HTMLDivElement|null>(null)

  const rowVirtualizer = useVirtual({
    size: messages.length,
    parentRef,
    estimateSize: React.useCallback(()=>80,[]),
    overscan: 5,
  })

  useEffect(()=>{
    if(parentRef.current) parentRef.current.scrollTop = parentRef.current.scrollHeight
  },[messages.length])

  return (
    <div ref={parentRef} className="h-full overflow-auto p-4">
      <div style={{height: rowVirtualizer.totalSize, position:'relative'}}>
        {rowVirtualizer.virtualItems.map(virtualRow => {
          const m = messages[virtualRow.index]
          return (
            <div key={m.id} style={{position:'absolute', top:virtualRow.start, left:0, width:'100%'}}>
              <MessageBubble message={m} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
