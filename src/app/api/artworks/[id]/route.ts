import { NextRequest, NextResponse } from 'next/server'
import { getArtwork, updateArtwork, deleteArtwork } from '@/lib/db'
import { artworkUpdateSchema, uuidSchema } from '@/lib/validation'
import { handleApiError, ValidationError, checkRateLimit, RateLimitError } from '@/lib/errors'
import type { ApiResponse, Artwork } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/artworks/[id] - Get single artwork
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Artwork>>> {
  try {
    const { id } = await params

    // Validate ID format
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      throw new ValidationError('Invalid artwork ID format')
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`artworks:get:${clientIp}`, 100, 60000)) {
      throw new RateLimitError()
    }

    const artwork = await getArtwork(id)
    return NextResponse.json({ success: true, data: artwork })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/artworks/[id] - Update artwork
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Artwork>>> {
  try {
    const { id } = await params

    // Validate ID format
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      throw new ValidationError('Invalid artwork ID format')
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`artworks:update:${clientIp}`, 30, 60000)) {
      throw new RateLimitError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = artworkUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
    }

    const artwork = await updateArtwork(id, validationResult.data)
    return NextResponse.json({ success: true, data: artwork })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/artworks/[id] - Delete artwork
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params

    // Validate ID format
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      throw new ValidationError('Invalid artwork ID format')
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`artworks:delete:${clientIp}`, 10, 60000)) {
      throw new RateLimitError()
    }

    await deleteArtwork(id)
    return NextResponse.json({ success: true, message: 'Artwork deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
