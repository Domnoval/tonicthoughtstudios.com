import { z } from 'zod'

// Sanitize string input to prevent XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim()
    .slice(0, 10000) // Limit string length
}

// Artwork validation schemas
export const artworkCreateSchema = z.object({
  title: z.string().max(200).optional().transform(v => v ? sanitizeString(v) : v),
  description: z.string().max(5000).optional().transform(v => v ? sanitizeString(v) : v),
  artistNotes: z.string().max(2000).optional().transform(v => v ? sanitizeString(v) : v),
  price: z.number().min(0).max(1000000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const artworkUpdateSchema = z.object({
  title: z.string().max(200).optional().transform(v => v ? sanitizeString(v) : v),
  description: z.string().max(5000).optional().transform(v => v ? sanitizeString(v) : v),
  seoTitle: z.string().max(70).optional().transform(v => v ? sanitizeString(v) : v),
  seoDescription: z.string().max(160).optional().transform(v => v ? sanitizeString(v) : v),
  tags: z.array(z.string().max(50).transform(sanitizeString)).max(20).optional(),
  colors: z.array(z.string().max(20).transform(sanitizeString)).max(10).optional(),
  mood: z.string().max(100).optional().transform(v => v ? sanitizeString(v) : v),
  personality: z.string().max(2000).optional().transform(v => v ? sanitizeString(v) : v),
  price: z.number().min(0).max(1000000).nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  artistNotes: z.string().max(2000).nullable().optional().transform(v => v ? sanitizeString(v) : v),
})

export const chatMessageSchema = z.object({
  artworkId: z.string().uuid(),
  message: z.string().min(1).max(2000).transform(sanitizeString),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000),
  })).max(50).optional(),
})

export const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'velo']),
  artworkIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const printfulSchema = z.object({
  artworkId: z.string().uuid(),
  productTypes: z.array(z.string().max(50)).min(1).max(20),
})

// UUID validation helper
export const uuidSchema = z.string().uuid()

// File validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` }
  }
  return { valid: true }
}
