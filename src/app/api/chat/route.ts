import { NextRequest, NextResponse } from 'next/server'
import { getArtwork } from '@/lib/db'
import { chatWithArtwork } from '@/lib/ai'
import { chatMessageSchema } from '@/lib/validation'
import { handleApiError, ValidationError, checkRateLimit, RateLimitError } from '@/lib/errors'
import type { ApiResponse } from '@/lib/types'

interface ChatResponse {
  response: string
}

// POST /api/chat - Chat with artwork personality
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ChatResponse>>> {
  try {
    // Rate limiting (stricter for AI calls)
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`chat:${clientIp}`, 20, 60000)) {
      throw new RateLimitError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = chatMessageSchema.safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
    }

    const { artworkId, message, history } = validationResult.data

    // Get artwork for personality and title
    const artwork = await getArtwork(artworkId)

    if (!artwork.personality) {
      throw new ValidationError('This artwork does not have a personality configured')
    }

    // Generate response from artwork personality
    const response = await chatWithArtwork(
      artwork.personality,
      artwork.title,
      message,
      history || []
    )

    return NextResponse.json({
      success: true,
      data: { response },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
