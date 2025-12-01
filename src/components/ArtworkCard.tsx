"use client";

import { Artwork } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

interface ArtworkCardProps {
  artwork: Artwork;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <Link href={`/artwork/${artwork.id}`}>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-all hover:scale-[1.02] cursor-pointer">
        <div className="relative aspect-square">
          <Image
            src={artwork.thumbnailPath}
            alt={artwork.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">{artwork.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{artwork.medium}</p>
          <div className="flex gap-1 flex-wrap">
            {artwork.colors.slice(0, 4).map((color, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-full border border-[var(--border)]"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                artwork.status === "published"
                  ? "bg-green-500/20 text-green-400"
                  : artwork.status === "sold"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {artwork.status}
            </span>
            {artwork.personality && (
              <span className="text-xs text-[var(--accent)]">Chat enabled</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
