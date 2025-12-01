import { NextRequest, NextResponse } from 'next/server';
import {
  getStoreInfo,
  getSyncProducts,
  createSyncProduct,
  PRINTFUL_PRODUCTS,
  SUGGESTED_PRICES,
  PrintfulProductKey,
} from '@/lib/printful';
import { getArtwork } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Printful API key not configured' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'products';

    if (action === 'store') {
      const store = await getStoreInfo(apiKey);
      return NextResponse.json(store);
    }

    if (action === 'products') {
      const products = await getSyncProducts(apiKey);
      return NextResponse.json(products);
    }

    if (action === 'catalog') {
      // Return available product types
      return NextResponse.json({
        products: Object.entries(PRINTFUL_PRODUCTS).map(([key, value]) => ({
          key,
          ...value,
          suggestedPrice: SUGGESTED_PRICES[key as PrintfulProductKey],
        })),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Printful GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Printful API error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Printful API key not configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { artworkId, productType, retailPrice, baseUrl } = body;

    if (!artworkId || !productType) {
      return NextResponse.json(
        { error: 'artworkId and productType are required' },
        { status: 400 }
      );
    }

    // Get artwork details
    const artwork = await getArtwork(artworkId);
    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // Create Printful product
    const imageUrl = `${baseUrl || 'http://localhost:3000'}${artwork.imagePath}`;
    const price = retailPrice || SUGGESTED_PRICES[productType as PrintfulProductKey] || 29.99;

    const result = await createSyncProduct(
      apiKey,
      {
        title: `${artwork.title} - ${PRINTFUL_PRODUCTS[productType as PrintfulProductKey].name}`,
        description: artwork.description,
        imageUrl,
        retailPrice: price,
      },
      productType as PrintfulProductKey
    );

    return NextResponse.json({
      success: true,
      product: result,
    });
  } catch (error) {
    console.error('Printful POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}
