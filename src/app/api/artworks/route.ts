import { NextResponse } from 'next/server';
import { getAllArtworks } from '@/lib/db';

export async function GET() {
  try {
    const artworks = await getAllArtworks();
    return NextResponse.json(artworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artworks' },
      { status: 500 }
    );
  }
}
