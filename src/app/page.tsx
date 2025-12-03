'use client'

import { useState, useEffect } from 'react'
import ArtworkCard from '@/components/ArtworkCard'
import type { Artwork } from '@/lib/types'

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  useEffect(() => {
    fetchArtworks()
  }, [filter])

  const fetchArtworks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = filter === 'all' ? '/api/artworks' : `/api/artworks?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch artworks')
      }

      setArtworks(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gallery
        </h1>
        <div className="flex gap-2">
          {(['all', 'draft', 'published', 'archived'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchArtworks}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && artworks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No artworks found. Upload your first artwork to get started.
          </p>
          <a
            href="/upload"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Upload Artwork
          </a>
        </div>
      )}

      {!isLoading && !error && artworks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map(artwork => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  )
}
