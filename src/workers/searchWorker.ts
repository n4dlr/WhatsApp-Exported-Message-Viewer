import { useChatStore } from '../stores/chatStore'

self.addEventListener('message', (e:any)=>{
  const {type,payload} = e.data
  if(type==='search'){
    const {query} = payload
    const state = useChatStore.getState()
    const results = state.messages.filter(m=> m.body && m.body.toLowerCase().includes(query.toLowerCase()))
    self.postMessage({type:'results', results: results.slice(0,200)})
  }
})
