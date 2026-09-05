export const encryptedBackupService = {
  async validateKeyMaterial(material:string){
    // Accept only hex strings of 32 or 64 bytes (64 or 128 hex chars) depending on format,
    const hex = /^[0-9a-fA-F]+$/.test(material)
    if(!hex) return {valid:false, reason:'Key material must be hex characters only'}
    if(!(material.length===64 || material.length===128)) return {valid:false, reason:'Key length invalid — expected 64 or 128 hex characters for supported formats'}
    return {valid:true}
  },
  async processEncryptedBackup(file:File, keyMaterial:string, backendUrl='/api/import/encrypted-backup'){
    // We will not attempt brute force. We only offer the backend adapter architecture.
    // Frontend validates key format and then streams to backend if backendUrl is provided.
    const v = await this.validateKeyMaterial(keyMaterial)
    if(!v.valid) throw new Error(v.reason)

    const form = new FormData()
    form.append('file', file)
    form.append('keyMaterial', keyMaterial)

    const res = await fetch(backendUrl, {method:'POST', body:form})
    if(!res.ok){
      const txt = await res.text()
      throw new Error(txt || 'Encrypted backup processing failed')
    }
    const blob = await res.blob()
    // backend should return decrypted msgstore.db as application/octet-stream
    return blob
  }
}
