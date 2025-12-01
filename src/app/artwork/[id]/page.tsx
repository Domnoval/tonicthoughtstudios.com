"use client";

import { useEffect, useState, use } from "react";
import { Artwork } from "@/lib/db";
import Image from "next/image";
import ArtworkChat from "@/components/ArtworkChat";

export default function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Artwork>>({});

  useEffect(() => {
    fetchArtwork();
  }, [id]);

  async function fetchArtwork() {
    try {
      const res = await fetch(`/api/artworks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setArtwork(data);
        setEditData(data);
      }
    } catch (error) {
      console.error("Failed to fetch artwork:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    try {
      const res = await fetch(`/api/artworks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setArtwork(updated);
        setEditing(false);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Loading artwork...</div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Artwork not found</div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left column - Image and details */}
      <div>
        <div className="relative aspect-square rounded-xl overflow-hidden mb-6">
          <Image
            src={artwork.imagePath}
            alt={artwork.title}
            fill
            className="object-contain bg-black"
          />
        </div>

        {/* Color palette */}
        <div className="flex gap-2 mb-6">
          {artwork.colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 h-8 rounded-lg first:rounded-l-xl last:rounded-r-xl"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {artwork.tags.map((tag, i) => (
            <span
              key={i}
              className="bg-[var(--card)] border border-[var(--border)] px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right column - Info and Chat */}
      <div>
        {editing ? (
          <div className="space-y-4 mb-8">
            <input
              type="text"
              value={editData.title || ""}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2 text-2xl font-bold"
            />
            <textarea
              value={editData.description || ""}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2 h-32 resize-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Medium"
                value={editData.medium || ""}
                onChange={(e) =>
                  setEditData({ ...editData, medium: e.target.value })
                }
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2"
              />
              <input
                type="text"
                placeholder="Dimensions"
                value={editData.dimensions || ""}
                onChange={(e) =>
                  setEditData({ ...editData, dimensions: e.target.value })
                }
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2"
              />
              <input
                type="text"
                placeholder="Year"
                value={editData.year || ""}
                onChange={(e) =>
                  setEditData({ ...editData, year: e.target.value })
                }
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2"
              />
              <input
                type="text"
                placeholder="Price"
                value={editData.price || ""}
                onChange={(e) =>
                  setEditData({ ...editData, price: e.target.value })
                }
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2"
              />
            </div>
            <select
              value={editData.status || "draft"}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  status: e.target.value as "draft" | "published" | "sold",
                })
              }
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="sold">Sold</option>
            </select>
            <div className="flex gap-4">
              <button
                onClick={saveChanges}
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] py-2 rounded-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold">{artwork.title}</h1>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-[var(--accent)]"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-300 mb-4">{artwork.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <span className="block text-gray-500">Medium</span>
                {artwork.medium || "—"}
              </div>
              <div>
                <span className="block text-gray-500">Dimensions</span>
                {artwork.dimensions || "—"}
              </div>
              <div>
                <span className="block text-gray-500">Year</span>
                {artwork.year || "—"}
              </div>
              <div>
                <span className="block text-gray-500">Price</span>
                {artwork.price || "—"}
              </div>
            </div>
          </div>
        )}

        {/* SEO Preview */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mb-8">
          <h3 className="text-sm text-gray-500 mb-2">SEO Preview</h3>
          <p className="text-blue-400 text-lg">{artwork.seoTitle}</p>
          <p className="text-green-400 text-sm">
            tonicthoughtstudios.com/artwork/{artwork.id.slice(0, 8)}
          </p>
          <p className="text-gray-400 text-sm mt-1">{artwork.seoDescription}</p>
        </div>

        {/* Chat with Artwork */}
        {artwork.personality && (
          <ArtworkChat artworkId={artwork.id} artworkTitle={artwork.title} />
        )}
      </div>
    </div>
  );
}
