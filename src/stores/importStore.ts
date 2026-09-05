import create from 'zustand'
import { sessionService } from '../services/sessionService'
import { importService } from '../services/importService'

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
  progress: number
  status: string
  importFile: (f: File)=>Promise<void>
  setProgress: (p:number)=>void
  setStatus: (s:string)=>void
  loadSessions: ()=>Promise<void>
  openSession: (sessionId:string)=>Promise<void>
  deleteSession: (sessionId:string)=>Promise<void>
}

export const useImportStore = create<ImportState>((set,get)=>({
  hasSession: false,
  sessionCount:0,
  openSessions:[],
  progress:0,
  status:'idle',
  importFile: async (f:File) => {
    set({status:'Starting import...', progress:0})
    try{
      await importService.processFile(f)
      const { conversations, messages } = (await import('..//stores/chatStore')).useChatStore.getState()
      const meta = { sessionId: 's_'+Math.random().toString(36).slice(2,9), name: f.name, sourceType: f.type || 'file', messageCount: messages.length }
      await sessionService.saveSession(meta, { conversations, messages })
      await get().loadSessions()
      set({status:'Import complete', progress:100, hasSession:true})
    }catch(e:any){
      set({status:'Import failed: '+(e?.message||String(e)), progress:0})
    }
  },
  setProgress: (p)=>set({progress:p}),
  setStatus: (s)=>set({status:s}),
  loadSessions: async ()=>{
    const list = await sessionService.listSessions()
    set({openSessions: list || [], sessionCount: (list||[]).length, hasSession: (list||[]).length>0})
  },
  openSession: async (sessionId:string)=>{
    const s = await sessionService.getSession(sessionId)
    if(s?.data){
      const chatStore = (await import('../stores/chatStore')).useChatStore
      chatStore.getState().setConversations(s.data.conversations || [])
      chatStore.getState().addMessages(s.data.messages || [])
      set({status:'Session loaded', hasSession:true})
    } else {
      set({status:'Session data not available'})
    }
  },
  deleteSession: async (sessionId:string)=>{
    await sessionService.deleteSession(sessionId)
    await get().loadSessions()
  }
}))
