import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/lib/image';
import { analyzeArtwork, generatePersonality } from '@/lib/ai';
import { createArtwork } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const artistNotes = formData.get('artistNotes') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image (optimize, create thumbnail, get base64)
    const processedImage = await processImage(buffer, file.name);

    // Analyze artwork with AI
    const analysis = await analyzeArtwork(processedImage.base64, artistNotes);

    // Generate personality for the artwork
    const personality = await generatePersonality(
      processedImage.base64,
      analysis.title,
      analysis.description,
      artistNotes,
      analysis.medium,
      analysis.mood
    );

    // Save to database
    const artwork = await createArtwork({
      title: analysis.title,
      description: analysis.description,
      seoTitle: analysis.seoTitle,
      seoDescription: analysis.seoDescription,
      tags: analysis.tags,
      medium: analysis.medium,
      colors: analysis.colors,
      imagePath: processedImage.imagePath,
      thumbnailPath: processedImage.thumbnailPath,
      originalFilename: file.name,
      personality,
      artistNotes,
    });

    return NextResponse.json({ success: true, artwork });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
