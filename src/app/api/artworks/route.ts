import { NextRequest, NextResponse } from 'next/server'
import { getArtworks, getArtworksByStatus } from '@/lib/db'
import { handleApiError, checkRateLimit, RateLimitError } from '@/lib/errors'
import type { ApiResponse, Artwork } from '@/lib/types'

// GET /api/artworks - List all artworks
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Artwork[]>>> {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`artworks:list:${clientIp}`, 100, 60000)) {
      throw new RateLimitError()
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as Artwork['status'] | null

    let artworks: Artwork[]

    if (status && ['draft', 'published', 'archived'].includes(status)) {
      artworks = await getArtworksByStatus(status)
    } else {
      artworks = await getArtworks()
    }

    // Sort by createdAt descending (newest first)
    artworks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ success: true, data: artworks })
  } catch (error) {
    return handleApiError(error)
  }
}
