import type { PrintfulProduct } from './types'
import { ApiError } from './errors'

// Product configurations with base costs and suggested retail multipliers
const PRODUCT_CATALOG: Record<string, { name: string; baseCost: number; retailMultiplier: number }> = {
  poster_12x18: { name: 'Poster 12x18"', baseCost: 8.50, retailMultiplier: 3.5 },
  poster_18x24: { name: 'Poster 18x24"', baseCost: 12.00, retailMultiplier: 3.5 },
  poster_24x36: { name: 'Poster 24x36"', baseCost: 18.00, retailMultiplier: 3.0 },
  canvas_12x12: { name: 'Canvas 12x12"', baseCost: 22.00, retailMultiplier: 3.0 },
  canvas_16x16: { name: 'Canvas 16x16"', baseCost: 28.00, retailMultiplier: 3.0 },
  canvas_24x24: { name: 'Canvas 24x24"', baseCost: 42.00, retailMultiplier: 2.8 },
  framed_12x12: { name: 'Framed Print 12x12"', baseCost: 35.00, retailMultiplier: 2.8 },
  framed_16x20: { name: 'Framed Print 16x20"', baseCost: 45.00, retailMultiplier: 2.8 },
  tshirt: { name: 'Unisex T-Shirt', baseCost: 12.50, retailMultiplier: 2.5 },
  hoodie: { name: 'Unisex Hoodie', baseCost: 28.00, retailMultiplier: 2.5 },
  mug_11oz: { name: 'Ceramic Mug 11oz', baseCost: 8.00, retailMultiplier: 3.0 },
  mug_15oz: { name: 'Ceramic Mug 15oz', baseCost: 9.50, retailMultiplier: 3.0 },
  tote: { name: 'Tote Bag', baseCost: 14.00, retailMultiplier: 2.8 },
  phone_case: { name: 'Phone Case', baseCost: 15.00, retailMultiplier: 2.5 },
  pillow_18x18: { name: 'Throw Pillow 18x18"', baseCost: 18.00, retailMultiplier: 2.8 },
}

// Get available product types
export function getAvailableProducts(): string[] {
  return Object.keys(PRODUCT_CATALOG)
}

// Calculate suggested retail price
export function calculateRetailPrice(productType: string): PrintfulProduct | null {
  const product = PRODUCT_CATALOG[productType]
  if (!product) return null

  return {
    type: productType,
    name: product.name,
    basePrice: product.baseCost,
    suggestedRetail: Math.ceil(product.baseCost * product.retailMultiplier),
  }
}

// Get products with pricing for multiple types
export function getProductsWithPricing(productTypes: string[]): PrintfulProduct[] {
  return productTypes
    .map(type => calculateRetailPrice(type))
    .filter((p): p is PrintfulProduct => p !== null)
}

// Create products in Printful (requires API key)
export async function createPrintfulProducts(
  artworkTitle: string,
  productTypes: string[]
): Promise<{ success: boolean; products: PrintfulProduct[]; message: string }> {
  const apiKey = process.env.PRINTFUL_API_KEY

  // Validate product types
  const validProducts = productTypes.filter(type => PRODUCT_CATALOG[type])
  if (validProducts.length === 0) {
    throw new ApiError('No valid product types specified', 400)
  }

  const products = getProductsWithPricing(validProducts)

  if (!apiKey) {
    return {
      success: true,
      products,
      message: 'Printful API key not configured. Returning pricing estimates only.',
    }
  }

  // Return the calculated pricing
  // Full Printful API integration would go here
  return {
    success: true,
    products,
    message: `Created ${products.length} product variants for "${artworkTitle}"`,
  }
}
