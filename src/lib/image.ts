import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_MAIN_SIZE = 2000
const THUMBNAIL_SIZE = 400

interface ProcessedImage {
  imagePath: string
  thumbnailPath: string
  originalWidth: number
  originalHeight: number
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
}

// Ensure uploads directory exists
async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR)
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
  }
}

// Process uploaded image: resize, create thumbnail, generate base64
export async function processImage(
  buffer: Buffer,
  originalFilename: string
): Promise<ProcessedImage> {
  await ensureUploadsDir()

  const id = uuidv4()
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg'
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg'

  // Get original image metadata
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width || 0
  const originalHeight = metadata.height || 0

  // Determine output format and media type
  let outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg'
  let mediaType: ProcessedImage['mediaType'] = 'image/jpeg'

  if (safeExt === '.png') {
    outputFormat = 'png'
    mediaType = 'image/png'
  } else if (safeExt === '.webp') {
    outputFormat = 'webp'
    mediaType = 'image/webp'
  } else if (safeExt === '.gif') {
    // Convert GIF to PNG to preserve transparency
    outputFormat = 'png'
    mediaType = 'image/png'
  }

  // Process main image (resize if larger than max)
  const mainImageFilename = `${id}${safeExt === '.gif' ? '.png' : safeExt}`
  const mainImagePath = path.join(UPLOADS_DIR, mainImageFilename)

  let mainImage = sharp(buffer)
  if (originalWidth > MAX_MAIN_SIZE || originalHeight > MAX_MAIN_SIZE) {
    mainImage = mainImage.resize(MAX_MAIN_SIZE, MAX_MAIN_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  await mainImage.toFormat(outputFormat, { quality: 85 }).toFile(mainImagePath)

  // Create thumbnail
  const thumbnailFilename = `${id}_thumb${safeExt === '.gif' ? '.png' : safeExt}`
  const thumbnailPath = path.join(UPLOADS_DIR, thumbnailFilename)

  await sharp(buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'center',
    })
    .toFormat(outputFormat, { quality: 80 })
    .toFile(thumbnailPath)

  // Generate base64 for AI analysis (smaller size for efficiency)
  const base64Buffer = await sharp(buffer)
    .resize(1024, 1024, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFormat(outputFormat, { quality: 70 })
    .toBuffer()

  const base64 = base64Buffer.toString('base64')

  return {
    imagePath: `/uploads/${mainImageFilename}`,
    thumbnailPath: `/uploads/${thumbnailFilename}`,
    originalWidth,
    originalHeight,
    base64,
    mediaType,
  }
}

// Delete image files
export async function deleteImageFiles(imagePath: string, thumbnailPath: string): Promise<void> {
  const publicDir = path.join(process.cwd(), 'public')

  try {
    await fs.unlink(path.join(publicDir, imagePath))
  } catch {
    // Ignore errors
  }

  try {
    await fs.unlink(path.join(publicDir, thumbnailPath))
  } catch {
    // Ignore errors
  }
}
