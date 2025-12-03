import { NextRequest, NextResponse } from 'next/server'
import { getArtworks, getArtworksByIds, getArtworksByStatus } from '@/lib/db'
import { exportSchema } from '@/lib/validation'
import { handleApiError, ValidationError, checkRateLimit, RateLimitError } from '@/lib/errors'
import type { ApiResponse, Artwork, ExportFormat } from '@/lib/types'

// Generate CSV export for Wix products
function generateCSV(artworks: Artwork[]): string {
  const headers = [
    'handleId',
    'name',
    'description',
    'price',
    'sku',
    'visible',
    'productImageUrl',
    'collection',
  ]

  const rows = artworks.map(artwork => [
    artwork.id,
    `"${artwork.title.replace(/"/g, '""')}"`,
    `"${artwork.description.replace(/"/g, '""').slice(0, 8000)}"`,
    artwork.price || '',
    artwork.id.slice(0, 8).toUpperCase(),
    artwork.status === 'published' ? 'true' : 'false',
    artwork.imagePath,
    `"${artwork.tags.slice(0, 3).join(', ')}"`,
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

// Generate JSON export for Wix CMS
function generateJSON(artworks: Artwork[]): string {
  const cmsItems = artworks.map(artwork => ({
    _id: artwork.id,
    title: artwork.title,
    description: artwork.description,
    seoTitle: artwork.seoTitle,
    seoDescription: artwork.seoDescription,
    price: artwork.price,
    tags: artwork.tags,
    colors: artwork.colors,
    mood: artwork.mood,
    image: artwork.imagePath,
    thumbnail: artwork.thumbnailPath,
    status: artwork.status,
    createdAt: artwork.createdAt,
  }))

  return JSON.stringify(cmsItems, null, 2)
}

// Generate Velo code for Wix automation
function generateVeloCode(artworks: Artwork[]): string {
  const artworkData = artworks.map(artwork => ({
    id: artwork.id,
    title: artwork.title,
    price: artwork.price,
    tags: artwork.tags,
  }))

  return `// Wix Velo Code - Auto-generated artwork import
// Add this to your Wix backend code

import wixData from 'wix-data';

const artworks = ${JSON.stringify(artworkData, null, 2)};

export async function importArtworks() {
  const results = [];

  for (const artwork of artworks) {
    try {
      const result = await wixData.insert('Artworks', {
        _id: artwork.id,
        title: artwork.title,
        price: artwork.price,
        tags: artwork.tags,
      });
      results.push({ id: artwork.id, success: true });
    } catch (error) {
      results.push({ id: artwork.id, success: false, error: error.message });
    }
  }

  return results;
}

// Call importArtworks() from a page or backend trigger
`
}

// POST /api/export - Export artworks in various formats
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ExportFormat>>> {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`export:${clientIp}`, 10, 60000)) {
      throw new RateLimitError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = exportSchema.safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
    }

    const { format, artworkIds, status } = validationResult.data

    // Get artworks based on filters
    let artworks: Artwork[]

    if (artworkIds && artworkIds.length > 0) {
      artworks = await getArtworksByIds(artworkIds)
    } else if (status) {
      artworks = await getArtworksByStatus(status)
    } else {
      artworks = await getArtworks()
    }

    if (artworks.length === 0) {
      throw new ValidationError('No artworks found matching the criteria')
    }

    // Generate export based on format
    let data: string
    let filename: string

    switch (format) {
      case 'csv':
        data = generateCSV(artworks)
        filename = `artworks-export-${Date.now()}.csv`
        break
      case 'json':
        data = generateJSON(artworks)
        filename = `artworks-export-${Date.now()}.json`
        break
      case 'velo':
        data = generateVeloCode(artworks)
        filename = `artworks-velo-${Date.now()}.js`
        break
      default:
        throw new ValidationError('Invalid export format')
    }

    return NextResponse.json({
      success: true,
      data: { type: format, data, filename },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
