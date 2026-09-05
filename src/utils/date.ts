export function formatTimestamp(ts:number){
  const d = new Date(ts)
  return d.toLocaleString()
}
