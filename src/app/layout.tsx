import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tonic Thought Studios - Art Companion",
  description: "Artwork catalog and management companion app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <nav className="border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--accent)]">
              Tonic Thought Studios
            </h1>
            <div className="flex gap-4">
              <a href="/" className="hover:text-[var(--accent)] transition-colors">
                Gallery
              </a>
              <a href="/upload" className="hover:text-[var(--accent)] transition-colors">
                Upload
              </a>
              <a href="/export" className="hover:text-[var(--accent)] transition-colors">
                Export
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
