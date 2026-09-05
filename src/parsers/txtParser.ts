export function parseTxt(content:string){
  // Basic WhatsApp exported TXT parser: lines like [12/12/20, 10:10 - Name: message]
  const lines = content.split(/\r?\n/)
  const messages:any[] = []
  const conversations:any[] = [{id:'imported-txt', name:'Imported Chat'}]
  const re = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2})(?:[:\d{2}]*)?\s?[APMapm\.]*\s?[-–]\s([^:]+):\s(.*)$/
  for(const line of lines){
    const m = line.match(re)
    if(m){
      const ts = parseDate(m[1], m[2])
      messages.push({
        id:Math.random().toString(36).slice(2,12),
        conversationId:'imported-txt',
        senderName: m[3].trim(),
        timestamp: ts,
        body: m[4],
        isOutgoing: false,
        type:'text'
      })
    }
  }
  return {conversations, messages}
}

function parseDate(d:string,t:string){
  // naive dd/mm/yy
  try{
    const parts = d.split('/')
    let day = Number(parts[0]), month = Number(parts[1])-1, year = Number(parts[2])
    if(year<100) year += 2000
    const timeParts = t.split(':')
    const hour = Number(timeParts[0]), minute = Number(timeParts[1])
    return new Date(year,month,day,hour,minute).getTime()
  }catch(e){ return Date.now() }
}
