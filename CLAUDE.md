# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tonic Thought Studios is a Next.js 16 full-stack application for managing artwork catalogs with AI-powered analysis. It uses Google's Gemini 3.0 Pro API to generate titles, descriptions, SEO metadata, and unique "personalities" for artworks that enable interactive conversations.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Tech Stack
- Next.js 16 with App Router, React 19, TypeScript
- Tailwind CSS 4 for styling
- Google Gemini API for AI analysis and chat
- Sharp for image processing
- JSON file storage (Prisma installed for future PostgreSQL migration)

### Key Directories
- `src/app/api/` - API routes for artworks CRUD, chat, upload, export, Printful
- `src/lib/` - Core modules: `ai.ts` (Gemini integration), `db.ts` (JSON storage), `image.ts` (Sharp processing), `printful.ts` (print-on-demand)
- `src/components/` - Reusable components: `ArtworkCard`, `ArtworkChat`
- `data/` - JSON data storage
- `public/uploads/` - Uploaded artwork images

### Data Flow
Upload images → Sharp processes (2000px main, 400px thumbnail) → Gemini analyzes via vision API → Generates metadata + personality → Stored in JSON → Displayed in gallery → Chat via personality → Export to Wix/Printful

### API Routes
- `POST /api/upload` - Upload and process artwork images
- `GET/POST /api/artworks` - List/create artworks
- `GET/PUT/DELETE /api/artworks/[id]` - Individual artwork CRUD
- `POST /api/chat` - Conversation with artwork personality
- `POST /api/export` - Generate Wix exports (CSV, JSON, Velo code)
- `POST /api/printful` - Create Printful print-on-demand products

## Environment Variables

Required in `.env`:
- `GOOGLE_API_KEY` - Gemini API access
- `PRINTFUL_API_KEY` - Optional, for print-on-demand integration
