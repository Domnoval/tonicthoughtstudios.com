"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

interface UploadFile {
  file: File;
  preview: string;
  artistNotes: string;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      artistNotes: "",
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  const updateNotes = (index: number, notes: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, artistNotes: notes } : f))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAll = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);
        formData.append("artistNotes", files[i].artistNotes);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "complete" as const } : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error" as const, error: "Upload failed" }
              : f
          )
        );
      }
    }

    setUploading(false);

    // Check if all completed
    const allComplete = files.every(
      (f) => f.status === "complete" || f.status === "error"
    );
    if (allComplete && files.some((f) => f.status === "complete")) {
      setTimeout(() => router.push("/"), 1500);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upload Artwork</h2>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone p-12 text-center cursor-pointer mb-8 ${
          isDragActive ? "active" : ""
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {isDragActive ? (
            <p className="text-lg">Drop your artwork here...</p>
          ) : (
            <>
              <p className="text-lg mb-2">
                Drag & drop artwork images here
              </p>
              <p className="text-sm">or click to select files</p>
            </>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-4 mb-8">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 flex gap-4"
            >
              <img
                src={file.preview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium truncate">{file.file.name}</p>
                  {file.status === "pending" && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {file.status === "pending" && (
                  <textarea
                    placeholder="Artist notes about this piece (optional - helps AI understand your vision)"
                    value={file.artistNotes}
                    onChange={(e) => updateNotes(index, e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 text-sm resize-none h-16"
                  />
                )}
                {file.status === "uploading" && (
                  <div className="flex items-center gap-2 text-[var(--accent)]">
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Processing with AI...
                  </div>
                )}
                {file.status === "complete" && (
                  <p className="text-green-400">Complete!</p>
                )}
                {file.status === "error" && (
                  <p className="text-red-400">{file.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          onClick={uploadAll}
          disabled={uploading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 py-4 rounded-lg font-medium transition-colors"
        >
          {uploading
            ? "Processing..."
            : `Upload & Analyze ${pendingCount} ${
                pendingCount === 1 ? "Piece" : "Pieces"
              }`}
        </button>
      )}
    </div>
  );
}
