import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

export const encryptedBackupService = {
  async validateKeyMaterial(material:string){
    // Accept only hex strings of 32 or 64 bytes (64 or 128 hex chars) depending on format,
    const hex = /^[0-9a-fA-F]+$/.test(material)
    if(!hex) return {valid:false, reason:'Key material must be hex characters only'}
    if(!(material.length===64 || material.length===128)) return {valid:false, reason:'Key length invalid — expected 64 or 128 hex characters for supported formats'}
    return {valid:true}
  },
  async processEncryptedBackup(
    file:File,
    keyMaterial:string,
    backendUrl='/api/import/encrypted-backup',
    onUploadProgress?: (progress:number)=>void
  ){
    // We will not attempt brute force. We only offer the backend adapter architecture.
    // Frontend validates key format and then streams to backend if backendUrl is provided.
    const v = await this.validateKeyMaterial(keyMaterial)
    if(!v.valid) throw new Error(v.reason)

    const form = new FormData()
    form.append('file', file)
    form.append('keyMaterial', keyMaterial)

    return await new Promise<{
      sessionId:string
      totalMessages:number
      conversations:Conversation[]
      messages:Message[]
    }>((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open('POST', backendUrl)
      request.responseType = 'json'
      request.upload.onprogress = event => {
        if (event.lengthComputable) onUploadProgress?.(Math.round((event.loaded / event.total) * 100))
      }
      request.onerror = () => reject(new Error('Encrypted backup service is unavailable. Run ./start-linux.sh and try again.'))
      request.onload = () => {
        if (request.status < 200 || request.status >= 300) {
          const response = typeof request.response === 'string' ? request.response : request.responseText
          reject(new Error(response || 'Encrypted backup processing failed'))
          return
        }
        resolve(request.response)
      }
      request.send(form)
    })
  }
}
