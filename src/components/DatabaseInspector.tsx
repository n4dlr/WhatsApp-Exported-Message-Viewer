import React, { useState } from 'react'
import { Conversation } from '../types/conversation'

export default function DatabaseInspector(){
  const [tables, setTables] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<string|undefined>()

  return (
    <div className="p-4">
      <div className="font-semibold">Database Inspector</div>
      <div className="mt-2 text-sm text-gray-500">Open a SQLite database to inspect tables and rows.</div>
      <div className="mt-4 flex gap-4">
        <div className="w-48 border p-2">
          <div className="font-semibold">Tables</div>
          <ul className="mt-2">
            {tables.map(t => <li key={t} className={`cursor-pointer ${t===selected? 'font-bold':''}`} onClick={()=>setSelected(t)}>{t}</li>)}
          </ul>
        </div>
        <div className="flex-1 border p-2">
          <div className="font-semibold">Rows</div>
          <pre className="text-xs mt-2 h-48 overflow-auto bg-gray-50 p-2">{JSON.stringify(rows.slice(0,50),null,2)}</pre>
        </div>
      </div>
    </div>
  )
}
