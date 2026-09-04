import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'

export const uploadRouter = Router()

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 8) * 1024 * 1024

// Assinatura binária (magic bytes) dos formatos aceitos — nunca confiamos na
// extensão do arquivo nem no Content-Type que o cliente declarou.
const SIGNATURES: Array<{ ext: string; mime: string; check: (buf: Buffer) => boolean }> = [
  { ext: 'jpg', mime: 'image/jpeg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: 'png',
    mime: 'image/png',
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
})

uploadRouter.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' })

  const signature = SIGNATURES.find((s) => s.check(req.file!.buffer))
  if (!signature) {
    return res.status(400).json({ error: 'Formato inválido. Envie JPG, PNG ou WebP.' })
  }

  // Escopado por usuário: ninguém escreve fora da própria pasta.
  const userDir = path.join(UPLOAD_DIR, req.userId!)
  fs.mkdirSync(userDir, { recursive: true })

  const filename = `${randomUUID()}.${signature.ext}`
  fs.writeFileSync(path.join(userDir, filename), req.file.buffer)

  res.status(201).json({ url: `/uploads/${req.userId}/${filename}` })
})
