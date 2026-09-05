import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

const app = express()
const upload = multer({ dest: 'tmp/' })

app.post('/api/import/encrypted-backup', upload.single('file'), async (req,res)=>{
  // This adapter validates input but does not implement unsupported crypt15 decryption.
  try{
    const key = req.body.keyMaterial
    const file = req.file
    if(!file) return res.status(400).send('No file uploaded')
    if(!key) return res.status(400).send('Key material missing')
    if(!/^[0-9a-fA-F]+$/.test(key)) return res.status(400).send('Invalid key material format')
    // For security we refuse to accept unknown crypt versions. Return clear message.
    const ext = path.extname(file.originalname || '')
    if(!ext.includes('crypt')){
      // if file appears to be a raw msgstore.db we can return it back
      const buf = fs.readFileSync(file.path)
      res.setHeader('Content-Type','application/octet-stream')
      res.setHeader('Content-Disposition','attachment; filename=decrypted-msgstore.db')
      res.send(buf)
      fs.unlinkSync(file.path)
      return
    }

    // We do NOT implement crypt15 decryption in this backend. Provide explicit unsupported response.
    fs.unlinkSync(file.path)
    return res.status(422).send('Unsupported encrypted backup format or additional key material required. This backend provides a secure adapter API but does not perform crypt15 decryption. Provide an unencrypted msgstore.db or use a local tool to decrypt your backup first.')
  }catch(e:any){
    return res.status(500).send('Server error: '+e.message)
  }
})

const port = process.env.PORT || 3001
app.listen(port, ()=>{
  console.log('Encrypted backup adapter listening on', port)
})
