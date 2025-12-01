"use client";

import { useState, useEffect } from "react";
import { Artwork } from "@/lib/db";

interface PrintfulProduct {
  key: string;
  id: number;
  name: string;
  suggestedPrice: number;
}

export default function ExportPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [printfulProducts, setPrintfulProducts] = useState<PrintfulProduct[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    fetchArtworks();
    fetchPrintfulCatalog();
    setBaseUrl(window.location.origin);
  }, []);

  async function fetchArtworks() {
    const res = await fetch("/api/artworks");
    const data = await res.json();
    setArtworks(data);
  }

  async function fetchPrintfulCatalog() {
    try {
      const res = await fetch("/api/printful?action=catalog");
      const data = await res.json();
      if (data.products) {
        setPrintfulProducts(data.products);
      }
    } catch {
      // Printful not configured
    }
  }

  async function exportWix(format: string) {
    setLoading(true);
    try {
      const url = `/api/export?format=${format}&baseUrl=${encodeURIComponent(baseUrl)}`;

      if (format === "json") {
        const res = await fetch(url);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        downloadBlob(blob, "wix-artworks.json");
      } else {
        const res = await fetch(url);
        const text = await res.text();
        const blob = new Blob([text], { type: format === "csv" ? "text/csv" : "text/plain" });
        downloadBlob(blob, format === "csv" ? "wix-products.csv" : "velo-sync.js");
      }

      setMessage({ type: "success", text: `Exported ${format.toUpperCase()} successfully!` });
    } catch {
      setMessage({ type: "error", text: "Export failed" });
    }
    setLoading(false);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function createPrintfulProduct() {
    if (!selectedArtwork || !selectedProduct) {
      setMessage({ type: "error", text: "Select an artwork and product type" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/printful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artworkId: selectedArtwork,
          productType: selectedProduct,
          baseUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Product created in Printful!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create product" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to Printful" });
    }
    setLoading(false);
  }

  const publishedCount = artworks.filter((a) => a.status === "published").length;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Export & Integrations</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Base URL Setting */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Deployment URL</h3>
        <p className="text-gray-400 text-sm mb-4">
          Set your deployed app URL for image links in exports
        </p>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://your-app.vercel.app"
          className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2"
        />
      </div>

      {/* Wix Export */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">Wix Export</h3>
        <p className="text-gray-400 text-sm mb-4">
          Export your published artworks ({publishedCount} pieces) for Wix
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <button
            onClick={() => exportWix("json")}
            disabled={loading || publishedCount === 0}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 py-3 rounded-lg transition-colors"
          >
            JSON (CMS)
          </button>
          <button
            onClick={() => exportWix("csv")}
            disabled={loading || publishedCount === 0}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 py-3 rounded-lg transition-colors"
          >
            CSV (Products)
          </button>
          <button
            onClick={() => exportWix("velo")}
            disabled={loading}
            className="border border-[var(--border)] hover:border-[var(--accent)] py-3 rounded-lg transition-colors"
          >
            Velo Code
          </button>
        </div>

        <div className="mt-4 p-4 bg-[var(--background)] rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-2">How to use:</h4>
          <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
            <li>Export JSON for Wix CMS collections</li>
            <li>Export CSV for Wix Stores products</li>
            <li>Download Velo code for automatic sync</li>
          </ol>
        </div>
      </div>

      {/* Printful Integration */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">Printful Products</h3>
        <p className="text-gray-400 text-sm mb-4">
          Create print-on-demand products from your artwork
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Artwork</label>
            <select
              value={selectedArtwork}
              onChange={(e) => setSelectedArtwork(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2"
            >
              <option value="">Select artwork...</option>
              {artworks.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Product Type</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2"
            >
              <option value="">Select product...</option>
              {printfulProducts.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name} (${p.suggestedPrice})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={createPrintfulProduct}
          disabled={loading || !selectedArtwork || !selectedProduct}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 py-3 rounded-lg transition-colors"
        >
          {loading ? "Creating..." : "Create Printful Product"}
        </button>

        <div className="mt-4 p-4 bg-[var(--background)] rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Setup required:</h4>
          <p className="text-sm text-gray-500">
            Add your Printful API key to <code className="text-[var(--accent)]">.env.local</code>:
          </p>
          <code className="block mt-2 text-xs bg-black/50 p-2 rounded">
            PRINTFUL_API_KEY=your_key_here
          </code>
        </div>
      </div>
    </div>
  );
}
