import { NextRequest, NextResponse } from 'next/server'
import { getArtwork } from '@/lib/db'
import { printfulSchema } from '@/lib/validation'
import { createPrintfulProducts, getAvailableProducts } from '@/lib/printful'
import { handleApiError, ValidationError, checkRateLimit, RateLimitError } from '@/lib/errors'
import type { ApiResponse, PrintfulProduct } from '@/lib/types'

interface PrintfulResponse {
  products: PrintfulProduct[]
  message: string
}

// GET /api/printful - Get available product types
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<string[]>>> {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`printful:list:${clientIp}`, 100, 60000)) {
      throw new RateLimitError()
    }

    const products = getAvailableProducts()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/printful - Create Printful products for artwork
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PrintfulResponse>>> {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`printful:create:${clientIp}`, 10, 60000)) {
      throw new RateLimitError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = printfulSchema.safeParse(body)

    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
    }

    const { artworkId, productTypes } = validationResult.data

    // Get artwork
    const artwork = await getArtwork(artworkId)

    // Create Printful products
    const result = await createPrintfulProducts(artwork.title, productTypes)

    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        message: result.message,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
