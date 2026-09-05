import { Conversation } from '../types/conversation'
import { Message } from '../types/message'

export type LargeDatabaseImport = {
  sessionId: string
  totalMessages: number
  conversations: Conversation[]
  messages: Message[]
}

export function uploadLargeDatabase(
  file: File,
  backendUrl: string,
  onProgress: (progress: number) => void
): Promise<LargeDatabaseImport> {
  const form = new FormData()
  form.append('file', file)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${backendUrl}/api/import/database`)
    request.responseType = 'json'
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = () => reject(new Error('Large database service is unavailable. Run ./start-linux.sh and try again.'))
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const response = typeof request.response === 'string' ? request.response : request.responseText
        reject(new Error(response || 'Large database import failed.'))
        return
      }
      resolve(request.response as LargeDatabaseImport)
    }
    request.send(form)
  })
}
