import { promises as fs } from 'fs'
import path from 'path'
import type { Artwork, ArtworkUpdate } from './types'
import { NotFoundError } from './errors'

const DATA_DIR = path.join(process.cwd(), 'data')
const ARTWORKS_FILE = path.join(DATA_DIR, 'artworks.json')

// Ensure data directory and file exist
async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  try {
    await fs.access(ARTWORKS_FILE)
  } catch {
    await fs.writeFile(ARTWORKS_FILE, '[]', 'utf-8')
  }
}

// Read all artworks from storage
export async function getArtworks(): Promise<Artwork[]> {
  await ensureDataFile()
  const data = await fs.readFile(ARTWORKS_FILE, 'utf-8')
  return JSON.parse(data) as Artwork[]
}

// Get a single artwork by ID
export async function getArtwork(id: string): Promise<Artwork> {
  const artworks = await getArtworks()
  const artwork = artworks.find(a => a.id === id)
  if (!artwork) {
    throw new NotFoundError('Artwork')
  }
  return artwork
}

// Create a new artwork
export async function createArtwork(artwork: Artwork): Promise<Artwork> {
  const artworks = await getArtworks()
  artworks.push(artwork)
  await fs.writeFile(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), 'utf-8')
  return artwork
}

// Update an existing artwork
export async function updateArtwork(id: string, updates: ArtworkUpdate): Promise<Artwork> {
  const artworks = await getArtworks()
  const index = artworks.findIndex(a => a.id === id)

  if (index === -1) {
    throw new NotFoundError('Artwork')
  }

  const updatedArtwork: Artwork = {
    ...artworks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  artworks[index] = updatedArtwork
  await fs.writeFile(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), 'utf-8')

  return updatedArtwork
}

// Delete an artwork
export async function deleteArtwork(id: string): Promise<void> {
  const artworks = await getArtworks()
  const index = artworks.findIndex(a => a.id === id)

  if (index === -1) {
    throw new NotFoundError('Artwork')
  }

  // Get the artwork to delete its images
  const artwork = artworks[index]

  // Delete associated image files
  try {
    const uploadsDir = path.join(process.cwd(), 'public')
    if (artwork.imagePath) {
      await fs.unlink(path.join(uploadsDir, artwork.imagePath)).catch(() => {})
    }
    if (artwork.thumbnailPath) {
      await fs.unlink(path.join(uploadsDir, artwork.thumbnailPath)).catch(() => {})
    }
  } catch {
    // Continue even if file deletion fails
  }

  artworks.splice(index, 1)
  await fs.writeFile(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), 'utf-8')
}

// Get artworks by status
export async function getArtworksByStatus(status: Artwork['status']): Promise<Artwork[]> {
  const artworks = await getArtworks()
  return artworks.filter(a => a.status === status)
}

// Get artworks by IDs
export async function getArtworksByIds(ids: string[]): Promise<Artwork[]> {
  const artworks = await getArtworks()
  return artworks.filter(a => ids.includes(a.id))
}
