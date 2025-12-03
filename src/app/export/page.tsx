'use client'

import { useState, useEffect } from 'react'
import type { Artwork, PrintfulProduct } from '@/lib/types'

type ExportFormat = 'csv' | 'json' | 'velo'

export default function ExportPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [error, setError] = useState<string | null>(null)

  // Printful state
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [printfulResult, setPrintfulResult] = useState<PrintfulProduct[] | null>(null)

  useEffect(() => {
    fetchArtworks()
    fetchPrintfulProducts()
  }, [])

  const fetchArtworks = async () => {
    try {
      const response = await fetch('/api/artworks?status=published')
      const data = await response.json()
      if (data.success) {
        setArtworks(data.data)
        setSelectedIds(data.data.map((a: Artwork) => a.id))
      }
    } catch {
      setError('Failed to fetch artworks')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrintfulProducts = async () => {
    try {
      const response = await fetch('/api/printful')
      const data = await response.json()
      if (data.success) {
        setAvailableProducts(data.data)
      }
    } catch {
      // Silently fail for optional feature
    }
  }

  const toggleArtwork = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleProduct = (type: string) => {
    setSelectedProducts(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one artwork')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
          artworkIds: selectedIds,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Export failed')
      }

      // Download the file
      const blob = new Blob([data.data.data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrintful = async () => {
    if (selectedIds.length !== 1) {
      alert('Please select exactly one artwork for Printful')
      return
    }
    if (selectedProducts.length === 0) {
      alert('Please select at least one product type')
      return
    }

    setIsExporting(true)
    setError(null)
    setPrintfulResult(null)

    try {
      const response = await fetch('/api/printful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: selectedIds[0],
          productTypes: selectedProducts,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Printful request failed')
      }

      setPrintfulResult(data.data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Printful request failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Export Artworks
      </h1>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Artwork Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Artworks ({selectedIds.length} selected)
        </h2>

        {artworks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No published artworks available. Publish some artworks first.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artworks.map(artwork => (
              <button
                key={artwork.id}
                onClick={() => toggleArtwork(artwork.id)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedIds.includes(artwork.id)
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <img
                  src={artwork.thumbnailPath}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
                {selectedIds.includes(artwork.id) && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wix Export */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export for Wix
        </h2>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as ExportFormat)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="csv">CSV (Products)</option>
              <option value="json">JSON (CMS)</option>
              <option value="velo">Velo Code</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || selectedIds.length === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Download Export'}
          </button>
        </div>
      </div>

      {/* Printful */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Printful Products
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Select one artwork and product types to get pricing estimates.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {availableProducts.map(type => (
            <button
              key={type}
              onClick={() => toggleProduct(type)}
              className={`px-3 py-2 text-sm rounded border transition-colors ${
                selectedProducts.includes(type)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={handlePrintful}
          disabled={isExporting || selectedIds.length !== 1 || selectedProducts.length === 0}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Pricing
        </button>

        {printfulResult && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Product</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400">Base Cost</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400">Suggested Retail</th>
                </tr>
              </thead>
              <tbody>
                {printfulResult.map(product => (
                  <tr key={product.type} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-900 dark:text-white">{product.name}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-400">
                      ${product.basePrice.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                      ${product.suggestedRetail.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
