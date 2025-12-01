import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface ProcessedImage {
  imagePath: string;
  thumbnailPath: string;
  base64: string;
  width: number;
  height: number;
}

async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

export async function processImage(
  buffer: Buffer,
  originalFilename: string
): Promise<ProcessedImage> {
  await ensureUploadsDir();

  const id = uuidv4();
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const baseName = `${id}`;

  // Get original dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Process main image - optimize for web
  const mainImagePath = path.join(UPLOADS_DIR, `${baseName}${ext}`);
  await sharp(buffer)
    .resize(2000, 2000, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, progressive: true })
    .toFile(mainImagePath.replace(ext, '.jpg'));

  // Create thumbnail
  const thumbnailPath = path.join(UPLOADS_DIR, `${baseName}_thumb.jpg`);
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  // Create base64 for AI analysis (smaller size)
  const base64Buffer = await sharp(buffer)
    .resize(1024, 1024, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  const base64 = base64Buffer.toString('base64');

  return {
    imagePath: `/uploads/${baseName}.jpg`,
    thumbnailPath: `/uploads/${baseName}_thumb.jpg`,
    base64,
    width,
    height,
  };
}

export async function deleteImage(imagePath: string, thumbnailPath: string) {
  const fullImagePath = path.join(process.cwd(), 'public', imagePath);
  const fullThumbnailPath = path.join(process.cwd(), 'public', thumbnailPath);

  try {
    await fs.unlink(fullImagePath);
    await fs.unlink(fullThumbnailPath);
  } catch {
    // Files may not exist
  }
}
