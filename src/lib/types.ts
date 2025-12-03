export interface Artwork {
  id: string
  title: string
  description: string
  seoTitle: string
  seoDescription: string
  tags: string[]
  colors: string[]
  mood: string
  personality: string
  price: number | null
  status: 'draft' | 'published' | 'archived'
  imagePath: string
  thumbnailPath: string
  originalWidth: number
  originalHeight: number
  artistNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface ArtworkCreate {
  title?: string
  description?: string
  artistNotes?: string
  price?: number
  status?: 'draft' | 'published' | 'archived'
}

export interface ArtworkUpdate {
  title?: string
  description?: string
  seoTitle?: string
  seoDescription?: string
  tags?: string[]
  colors?: string[]
  mood?: string
  personality?: string
  price?: number | null
  status?: 'draft' | 'published' | 'archived'
  artistNotes?: string | null
}

export interface AIAnalysisResult {
  title: string
  description: string
  seoTitle: string
  seoDescription: string
  tags: string[]
  colors: string[]
  mood: string
  personality: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ExportFormat {
  type: 'csv' | 'json' | 'velo'
  data: string
  filename: string
}

export interface PrintfulProduct {
  type: string
  name: string
  basePrice: number
  suggestedRetail: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
