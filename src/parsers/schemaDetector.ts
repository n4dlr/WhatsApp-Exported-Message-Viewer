export function detectSchema(sampleSql:any){
  // lightweight schema detector
  const tables = sampleSql.exec("SELECT name FROM sqlite_master WHERE type='table'")
  const names = (tables[0]?.values||[]).map((v:any)=>v[0])
  return names
}
