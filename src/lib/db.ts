import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTWORKS_FILE = path.join(DATA_DIR, 'artworks.json');

export interface Artwork {
  id: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  medium: string;
  dimensions: string;
  year: string;
  price: string;
  status: 'draft' | 'published' | 'sold';
  imagePath: string;
  thumbnailPath: string;
  originalFilename: string;
  colors: string[];
  personality: string;
  artistNotes: string;
  createdAt: string;
  updatedAt: string;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory exists
  }
}

async function readArtworks(): Promise<Artwork[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(ARTWORKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeArtworks(artworks: Artwork[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ARTWORKS_FILE, JSON.stringify(artworks, null, 2));
}

export async function getAllArtworks(): Promise<Artwork[]> {
  return readArtworks();
}

export async function getArtwork(id: string): Promise<Artwork | null> {
  const artworks = await readArtworks();
  return artworks.find(a => a.id === id) || null;
}

export async function createArtwork(data: Partial<Artwork>): Promise<Artwork> {
  const artworks = await readArtworks();
  const now = new Date().toISOString();

  const artwork: Artwork = {
    id: uuidv4(),
    title: data.title || 'Untitled',
    description: data.description || '',
    seoTitle: data.seoTitle || '',
    seoDescription: data.seoDescription || '',
    tags: data.tags || [],
    medium: data.medium || '',
    dimensions: data.dimensions || '',
    year: data.year || new Date().getFullYear().toString(),
    price: data.price || '',
    status: data.status || 'draft',
    imagePath: data.imagePath || '',
    thumbnailPath: data.thumbnailPath || '',
    originalFilename: data.originalFilename || '',
    colors: data.colors || [],
    personality: data.personality || '',
    artistNotes: data.artistNotes || '',
    createdAt: now,
    updatedAt: now,
  };

  artworks.push(artwork);
  await writeArtworks(artworks);
  return artwork;
}

export async function updateArtwork(id: string, data: Partial<Artwork>): Promise<Artwork | null> {
  const artworks = await readArtworks();
  const index = artworks.findIndex(a => a.id === id);

  if (index === -1) return null;

  artworks[index] = {
    ...artworks[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await writeArtworks(artworks);
  return artworks[index];
}

export async function deleteArtwork(id: string): Promise<boolean> {
  const artworks = await readArtworks();
  const filtered = artworks.filter(a => a.id !== id);

  if (filtered.length === artworks.length) return false;

  await writeArtworks(filtered);
  return true;
}
