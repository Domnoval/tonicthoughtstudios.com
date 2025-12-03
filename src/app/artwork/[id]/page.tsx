'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import ArtworkChat from '@/components/ArtworkChat'
import type { Artwork } from '@/lib/types'

export default function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<Artwork>>({})

  useEffect(() => {
    fetchArtwork()
  }, [id])

  const fetchArtwork = async () => {
    try {
      const response = await fetch(`/api/artworks/${id}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch artwork')
      }

      setArtwork(data.data)
      setEditData(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const saveChanges = async () => {
    if (!artwork) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setArtwork(data.data)
      setIsEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteArtwork = async () => {
    if (!confirm('Are you sure you want to delete this artwork?')) return

    try {
      const response = await fetch(`/api/artworks/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete artwork')
      }

      router.push('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Artwork not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Back to Gallery
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Gallery
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={artwork.imagePath}
            alt={artwork.title}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            {isEditing ? (
              <input
                type="text"
                value={editData.title || ''}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="text-3xl font-bold w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {artwork.title}
              </h1>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={editData.status || artwork.status}
              onChange={e => setEditData(prev => ({ ...prev, status: e.target.value as Artwork['status'] }))}
              disabled={!isEditing}
              className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-70"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            {artwork.price !== null && (
              <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                ${artwork.price.toFixed(2)}
              </span>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editData.description || ''}
              onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {artwork.description}
            </p>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {artwork.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Colors
            </h3>
            <div className="flex flex-wrap gap-2">
              {artwork.colors.map(color => (
                <span
                  key={color}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Mood
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{artwork.mood}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <>
                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditData(artwork)
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Chat with Artwork
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={deleteArtwork}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ArtworkChat
        artworkId={artwork.id}
        artworkTitle={artwork.title}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  )
}
