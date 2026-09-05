import create from 'zustand'

type ImportSession = {
  sessionId: string
  name: string
  sourceType: string
  messageCount: number
}

type ImportState = {
  hasSession: boolean
  sessionCount: number
  openSessions: ImportSession[]
  progress:number
  status:string
  importFile: (f:File)=>Promise<void>
  setProgress: (p:number)=>void
  setStatus: (s:string)=>void
}

export const useImportStore = create<ImportState>((set)=>({
  hasSession: false,
  sessionCount:0,
  openSessions:[],
  progress:0,
  status:'idle',
  importFile: async (f:File)=>{},
  setProgress: (p)=>set({progress:p}),
  setStatus: (s)=>set({status:s})
}))
