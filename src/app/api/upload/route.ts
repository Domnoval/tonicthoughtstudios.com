import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { processImage } from '@/lib/image'
import { analyzeArtwork } from '@/lib/ai'
import { createArtwork } from '@/lib/db'
import { artworkCreateSchema, validateImageFile, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/validation'
import { handleApiError, ValidationError, checkRateLimit, RateLimitError } from '@/lib/errors'
import type { ApiResponse, Artwork } from '@/lib/types'

// POST /api/upload - Upload and process artwork image
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Artwork>>> {
  try {
    // Rate limiting (stricter for uploads)
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`upload:${clientIp}`, 10, 60000)) {
      throw new RateLimitError()
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const artistNotes = formData.get('artistNotes') as string | null
    const title = formData.get('title') as string | null
    const price = formData.get('price') as string | null

    if (!file) {
      throw new ValidationError('No file provided')
    }

    // Validate file
    const fileValidation = validateImageFile(file)
    if (!fileValidation.valid) {
      throw new ValidationError(fileValidation.error || 'Invalid file')
    }

    // Validate optional fields
    const createData = artworkCreateSchema.safeParse({
      title: title || undefined,
      artistNotes: artistNotes || undefined,
      price: price ? parseFloat(price) : undefined,
    })

    if (!createData.success) {
      throw new ValidationError(createData.error.errors[0]?.message || 'Invalid input')
    }

    // Process the image
    const buffer = Buffer.from(await file.arrayBuffer())
    const processed = await processImage(buffer, file.name)

    // Analyze with AI
    const analysis = await analyzeArtwork(
      processed.base64,
      processed.mediaType,
      createData.data.artistNotes
    )

    // Create artwork record
    const now = new Date().toISOString()
    const artwork: Artwork = {
      id: uuidv4(),
      title: createData.data.title || analysis.title,
      description: analysis.description,
      seoTitle: analysis.seoTitle,
      seoDescription: analysis.seoDescription,
      tags: analysis.tags,
      colors: analysis.colors,
      mood: analysis.mood,
      personality: analysis.personality,
      price: createData.data.price ?? null,
      status: 'draft',
      imagePath: processed.imagePath,
      thumbnailPath: processed.thumbnailPath,
      originalWidth: processed.originalWidth,
      originalHeight: processed.originalHeight,
      artistNotes: createData.data.artistNotes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    await createArtwork(artwork)

    return NextResponse.json({ success: true, data: artwork }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// Return upload constraints for clients
export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: true,
    data: {
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_IMAGE_TYPES,
    },
  })
}
