'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UploadFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  artistNotes?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const updateFileNotes = (index: number, notes: string) => {
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, artistNotes: notes } : f))
    )
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const file = prev[index]
      URL.revokeObjectURL(file.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadFile = async (uploadFile: UploadFile, index: number) => {
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f))
    )

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      if (uploadFile.artistNotes) {
        formData.append('artistNotes', uploadFile.artistNotes)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      setFiles(prev =>
        prev.map((f, i) => (i === index ? { ...f, status: 'success' } : f))
      )
    } catch (err) {
      setFiles(prev =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error',
                error: err instanceof Error ? err.message : 'Upload failed',
              }
            : f
        )
      )
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i)
      }
    }
  }

  const allDone = files.length > 0 && files.every(f => f.status === 'success')
  const hasUploading = files.some(f => f.status === 'uploading')
  const hasPending = files.some(f => f.status === 'pending')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Upload Artwork
      </h1>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="space-y-4">
          <div className="text-gray-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-300">
              Drag and drop artwork images here, or
            </p>
            <label className="mt-2 inline-block">
              <span className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600">
                Browse Files
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports JPEG, PNG, WebP, GIF (max 10MB each)
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </h2>
            <div className="space-x-2">
              {allDone ? (
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  View Gallery
                </button>
              ) : (
                <button
                  onClick={uploadAll}
                  disabled={!hasPending || hasUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasUploading ? 'Uploading...' : 'Upload All'}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <img
                  src={uploadFile.preview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <textarea
                    placeholder="Artist notes (optional)"
                    value={uploadFile.artistNotes || ''}
                    onChange={e => updateFileNotes(index, e.target.value)}
                    disabled={uploadFile.status !== 'pending'}
                    className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col items-end justify-between">
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                  {uploadFile.status === 'uploading' && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  )}
                  {uploadFile.status === 'success' && (
                    <span className="text-green-500">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  )}
                  {uploadFile.status === 'error' && (
                    <span className="text-red-500 text-sm">
                      {uploadFile.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
