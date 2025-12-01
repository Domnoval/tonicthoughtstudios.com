import { NextRequest, NextResponse } from 'next/server';
import { getAllArtworks, Artwork } from '@/lib/db';

// Wix Products CSV format
function artworkToWixCSV(artworks: Artwork[]): string {
  const headers = [
    'handleId',
    'fieldType',
    'name',
    'description',
    'productImageUrl',
    'collection',
    'sku',
    'ribbon',
    'price',
    'surcharge',
    'visible',
    'discountMode',
    'discountValue',
    'inventory',
    'weight',
    'productOptionName1',
    'productOptionType1',
    'productOptionDescription1',
    'productOptionName2',
    'productOptionType2',
    'productOptionDescription2',
  ];

  const rows = artworks
    .filter(a => a.status === 'published')
    .map(artwork => {
      return [
        artwork.id, // handleId
        'Product', // fieldType
        artwork.title, // name
        artwork.description.replace(/"/g, '""'), // description (escape quotes)
        artwork.imagePath, // productImageUrl - you'll need full URL
        artwork.medium || 'Art', // collection
        artwork.id.slice(0, 8).toUpperCase(), // sku
        artwork.status === 'sold' ? 'Sold' : '', // ribbon
        artwork.price || '', // price
        '', // surcharge
        'true', // visible
        '', // discountMode
        '', // discountValue
        '1', // inventory
        '', // weight
        'Medium', // productOptionName1
        'DROP_DOWN', // productOptionType1
        artwork.medium, // productOptionDescription1
        '', // productOptionName2
        '', // productOptionType2
        '', // productOptionDescription2
      ];
    });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Wix CMS JSON format
function artworkToWixCMS(artworks: Artwork[], baseUrl: string) {
  return artworks.map(artwork => ({
    _id: artwork.id,
    title: artwork.title,
    slug: artwork.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: artwork.description,
    seoTitle: artwork.seoTitle,
    seoDescription: artwork.seoDescription,
    image: `${baseUrl}${artwork.imagePath}`,
    thumbnail: `${baseUrl}${artwork.thumbnailPath}`,
    medium: artwork.medium,
    dimensions: artwork.dimensions,
    year: artwork.year,
    price: artwork.price,
    status: artwork.status,
    tags: artwork.tags,
    colors: artwork.colors,
    hasChat: !!artwork.personality,
    createdAt: artwork.createdAt,
    updatedAt: artwork.updatedAt,
  }));
}

// Velo-ready code snippet
function generateVeloCode(collectionName: string): string {
  return `// Wix Velo Code - Add to your site's backend
// This code syncs with your Tonic Thought companion app

import { fetch } from 'wix-fetch';

const COMPANION_API = 'YOUR_DEPLOYED_URL/api/export?format=json';

export async function syncArtworks() {
  try {
    const response = await fetch(COMPANION_API);
    const artworks = await response.json();

    // Import to your Wix CMS collection
    const wixData = require('wix-data');

    for (const artwork of artworks) {
      await wixData.save('${collectionName}', artwork);
    }

    return { success: true, count: artworks.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// For the interactive chat widget, add this to your page:
/*
<iframe
  src="YOUR_DEPLOYED_URL/embed/chat/{artworkId}"
  width="100%"
  height="400"
  frameborder="0"
></iframe>
*/
`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const baseUrl = searchParams.get('baseUrl') || 'http://localhost:3000';

    const artworks = await getAllArtworks();

    if (format === 'csv') {
      const csv = artworkToWixCSV(artworks);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="wix-products.csv"',
        },
      });
    }

    if (format === 'velo') {
      const collectionName = searchParams.get('collection') || 'Artworks';
      const code = generateVeloCode(collectionName);
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="velo-sync.js"',
        },
      });
    }

    // Default: JSON format for CMS
    const cmsData = artworkToWixCMS(artworks, baseUrl);
    return NextResponse.json(cmsData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export artworks' },
      { status: 500 }
    );
  }
}
