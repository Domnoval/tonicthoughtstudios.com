'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Artwork } from '@/lib/types'

interface ArtworkCardProps {
  artwork: Artwork
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <Link href={`/artwork/${artwork.id}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-square">
          <Image
            src={artwork.thumbnailPath}
            alt={artwork.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[artwork.status]}`}
            >
              {artwork.status}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {artwork.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {artwork.description}
          </p>
          {artwork.price && (
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
              ${artwork.price.toFixed(2)}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {artwork.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
