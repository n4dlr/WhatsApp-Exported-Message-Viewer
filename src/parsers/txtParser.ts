export function parseTxt(content:string){
  // Basic WhatsApp exported TXT parser: lines like [12/12/20, 10:10 - Name: message]
  const lines = content.split(/\r?\n/)
  const messages:any[] = []
  const conversations:any[] = [{id:'imported-txt', name:'Imported Chat', type:'unknown'}]
  const re = /^\[?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s(\d{1,2}:\d{2}(?:\s?[APMapm]{2})?)(?:[:\d{2}]*)?\s?[-–]\s(.*)$/
  let current: any = null
  for(const line of lines){
    const m = line.match(re)
    if(m){
      const senderAndBody = m[3].match(/^([^:]+):\s([\s\S]*)$/)
      const ts = parseDate(m[1], m[2])
      current = {
        id: crypto.randomUUID(),
        conversationId:'imported-txt',
        senderName: senderAndBody?.[1]?.trim(),
        timestamp: ts,
        body: senderAndBody?.[2] ?? m[3],
        isOutgoing: false,
        type:'text'
      }
      messages.push(current)
    } else if (current && line.trim()) {
      current.body += `\n${line}`
    }
  }
  return {conversations, messages}
}

function parseDate(d:string,t:string){
  // naive dd/mm/yy
  try{
    const parts = d.split(/[\/.-]/)
    let day = Number(parts[0]), month = Number(parts[1])-1, year = Number(parts[2])
    if(year<100) year += 2000
    const isPm = /pm/i.test(t)
    const timeParts = t.replace(/\s?[APMapm]{2}/, '').split(':')
    let hour = Number(timeParts[0]), minute = Number(timeParts[1])
    if (isPm && hour < 12) hour += 12
    if (!isPm && /am/i.test(t) && hour === 12) hour = 0
    return new Date(year,month,day,hour,minute).getTime()
  }catch(e){ return Date.now() }
}
