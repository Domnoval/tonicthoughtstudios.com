import { NextRequest, NextResponse } from 'next/server';
import { getArtwork, updateArtwork, deleteArtwork } from '@/lib/db';
import { deleteImage } from '@/lib/image';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artwork = await getArtwork(id);

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artwork' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const artwork = await updateArtwork(id, data);

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Error updating artwork:', error);
    return NextResponse.json(
      { error: 'Failed to update artwork' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artwork = await getArtwork(id);

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // Delete associated images
    await deleteImage(artwork.imagePath, artwork.thumbnailPath);

    // Delete from database
    await deleteArtwork(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return NextResponse.json(
      { error: 'Failed to delete artwork' },
      { status: 500 }
    );
  }
}
