const PRINTFUL_API = 'https://api.printful.com';

interface PrintfulConfig {
  apiKey: string;
}

// Common Printful product IDs for art
export const PRINTFUL_PRODUCTS = {
  poster_12x18: { id: 1, name: 'Enhanced Matte Poster 12×18', variant: 4783 },
  poster_18x24: { id: 1, name: 'Enhanced Matte Poster 18×24', variant: 4784 },
  poster_24x36: { id: 1, name: 'Enhanced Matte Poster 24×36', variant: 4785 },
  canvas_12x12: { id: 2, name: 'Canvas 12×12', variant: 2103 },
  canvas_16x16: { id: 2, name: 'Canvas 16×16', variant: 2104 },
  canvas_18x24: { id: 2, name: 'Canvas 18×24', variant: 2107 },
  framed_12x12: { id: 3, name: 'Framed Poster 12×12', variant: 10782 },
  framed_12x18: { id: 3, name: 'Framed Poster 12×18', variant: 10783 },
  tshirt_unisex: { id: 71, name: 'Unisex Staple T-Shirt', variant: 4012 },
  hoodie_unisex: { id: 380, name: 'Unisex Premium Hoodie', variant: 11193 },
  mug_11oz: { id: 19, name: 'White Glossy Mug 11oz', variant: 1320 },
  mug_15oz: { id: 19, name: 'White Glossy Mug 15oz', variant: 4830 },
  tote_bag: { id: 83, name: 'Tote Bag', variant: 4533 },
  phone_case: { id: 239, name: 'iPhone Case', variant: 8070 },
} as const;

export type PrintfulProductKey = keyof typeof PRINTFUL_PRODUCTS;

async function printfulFetch(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${PRINTFUL_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.result || `Printful API error: ${response.status}`);
  }

  return response.json();
}

export async function getStoreInfo(apiKey: string) {
  const data = await printfulFetch('/store', apiKey);
  return data.result;
}

export async function createSyncProduct(
  apiKey: string,
  artwork: {
    title: string;
    description: string;
    imageUrl: string;
    retailPrice: number;
  },
  productType: PrintfulProductKey
) {
  const product = PRINTFUL_PRODUCTS[productType];

  const syncProduct = {
    sync_product: {
      name: artwork.title,
      thumbnail: artwork.imageUrl,
    },
    sync_variants: [
      {
        variant_id: product.variant,
        retail_price: artwork.retailPrice.toFixed(2),
        files: [
          {
            type: 'default',
            url: artwork.imageUrl,
          },
        ],
      },
    ],
  };

  const data = await printfulFetch('/store/products', apiKey, {
    method: 'POST',
    body: JSON.stringify(syncProduct),
  });

  return data.result;
}

export async function createMockup(
  apiKey: string,
  imageUrl: string,
  productType: PrintfulProductKey
) {
  const product = PRINTFUL_PRODUCTS[productType];

  const mockupTask = {
    variant_ids: [product.variant],
    files: [
      {
        placement: 'default',
        image_url: imageUrl,
        position: {
          area_width: 1800,
          area_height: 2400,
          width: 1800,
          height: 2400,
          top: 0,
          left: 0,
        },
      },
    ],
  };

  const data = await printfulFetch(
    `/mockup-generator/create-task/${product.id}`,
    apiKey,
    {
      method: 'POST',
      body: JSON.stringify(mockupTask),
    }
  );

  return data.result;
}

export async function getMockupResult(apiKey: string, taskKey: string) {
  const data = await printfulFetch(
    `/mockup-generator/task?task_key=${taskKey}`,
    apiKey
  );
  return data.result;
}

export async function getSyncProducts(apiKey: string) {
  const data = await printfulFetch('/store/products', apiKey);
  return data.result;
}

export async function deleteSyncProduct(apiKey: string, productId: number) {
  const data = await printfulFetch(`/store/products/${productId}`, apiKey, {
    method: 'DELETE',
  });
  return data.result;
}

// Calculate suggested retail prices (2.5x markup from Printful base)
export const SUGGESTED_PRICES: Record<PrintfulProductKey, number> = {
  poster_12x18: 24.99,
  poster_18x24: 34.99,
  poster_24x36: 49.99,
  canvas_12x12: 59.99,
  canvas_16x16: 79.99,
  canvas_18x24: 99.99,
  framed_12x12: 49.99,
  framed_12x18: 59.99,
  tshirt_unisex: 29.99,
  hoodie_unisex: 54.99,
  mug_11oz: 14.99,
  mug_15oz: 17.99,
  tote_bag: 19.99,
  phone_case: 24.99,
};
