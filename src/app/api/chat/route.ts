import { NextRequest, NextResponse } from 'next/server';
import { getArtwork } from '@/lib/db';
import { chatWithArtwork } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { artworkId, message, history } = await request.json();

    if (!artworkId || !message) {
      return NextResponse.json(
        { error: 'Artwork ID and message are required' },
        { status: 400 }
      );
    }

    const artwork = await getArtwork(artworkId);

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    if (!artwork.personality) {
      return NextResponse.json(
        { error: 'This artwork does not have a personality yet' },
        { status: 400 }
      );
    }

    const response = await chatWithArtwork(
      artwork.personality,
      artwork.title,
      history || [],
      message
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to chat with artwork' },
      { status: 500 }
    );
  }
}
