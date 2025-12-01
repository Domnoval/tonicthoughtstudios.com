"use client";

import { useEffect, useState } from "react";
import { Artwork } from "@/lib/db";
import ArtworkCard from "@/components/ArtworkCard";

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks();
  }, []);

  async function fetchArtworks() {
    try {
      const res = await fetch("/api/artworks");
      const data = await res.json();
      setArtworks(data);
    } catch (error) {
      console.error("Failed to fetch artworks:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Loading gallery...</div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-400 text-lg">No artworks yet</p>
        <a
          href="/upload"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-6 py-3 rounded-lg transition-colors"
        >
          Upload Your First Piece
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Your Gallery</h2>
        <span className="text-gray-400">{artworks.length} pieces</span>
      </div>
      <div className="gallery-grid">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  );
}
