// lightweight zip parser helper
import JSZip from 'jszip'

export async function listZip(file:File){
  const zip = await JSZip.loadAsync(file)
  return Object.keys(zip.files)
}
