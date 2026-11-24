import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'

export function getProductImagesDirectory() {
  const dir = join(app.getPath('userData'), 'product-images')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function saveProductImage({ dataUrl, nombre = 'producto' }) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('No se recibió una imagen válida')
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl)
  if (!match) {
    throw new Error('El archivo no es una imagen válida')
  }

  const extension = match[1].split('/')[1] || 'png'
  const safeName =
    String(nombre || 'producto')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'producto'

  const fileName = `${safeName}-${randomUUID()}.${extension}`
  const filePath = join(getProductImagesDirectory(), fileName)
  const buffer = Buffer.from(match[2], 'base64')

  writeFileSync(filePath, buffer)
  return filePath
}
