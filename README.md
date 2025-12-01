# Tonic Thought Studios - Art Companion App

A companion app for managing artwork catalog, generating AI-powered descriptions, and creating interactive art experiences.

## Features

- **Batch Upload** - Drag-and-drop multiple artwork images at once
- **AI Analysis** - Automatic title suggestions, SEO descriptions, tags, and color extraction
- **Image Optimization** - Automatic resizing and thumbnail generation
- **Artwork Personalities** - Each piece gets its own AI personality that can "speak" to viewers
- **Interactive Chat** - Visitors can have conversations with your artwork
- **Gallery View** - Beautiful responsive gallery for your catalog
- **CMS Ready** - Export artwork data for use with Wix or other platforms

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template and add your API key:
   ```bash
   cp .env.example .env.local
   ```
4. Add your Anthropic API key to `.env.local`
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/
    api/
      artworks/     - CRUD endpoints for artwork
      chat/         - AI chat endpoint
      upload/       - File upload and processing
    artwork/[id]/   - Individual artwork pages
    upload/         - Upload interface
  components/
    ArtworkCard.tsx - Gallery card component
    ArtworkChat.tsx - Interactive chat component
  lib/
    ai.ts          - Claude AI integration
    db.ts          - JSON-based data storage
    image.ts       - Image processing with Sharp
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API
- **Image Processing**: Sharp
- **Database**: JSON file storage (upgradeable to Postgres)

## Workflow

1. **Upload** - Drag and drop artwork images, optionally add artist notes
2. **Processing** - AI analyzes the image, generates metadata and personality
3. **Review** - Edit generated titles, descriptions, and tags
4. **Publish** - Set status and export to your website

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude AI |

## Future Enhancements

- Wix Velo integration for direct CMS sync
- Printful product generation
- Bulk export to CSV/JSON
- Public gallery mode
- Analytics dashboard
