export function normalizePhoneNumber(n:string){
  return n.replace(/[^0-9]/g,'')
}
