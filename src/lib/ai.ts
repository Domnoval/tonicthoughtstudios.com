import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIAnalysisResult, ChatMessage } from './types'
import { ApiError } from './errors'

// Initialize client lazily to avoid errors if API key is not set
let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new ApiError('GOOGLE_API_KEY is not configured', 500)
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

// Analyze artwork image and generate metadata
export async function analyzeArtwork(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  artistNotes?: string
): Promise<AIAnalysisResult> {
  const client = getClient()

  const systemPrompt = `You are an expert art analyst and curator. Analyze the provided artwork image and generate comprehensive metadata.

Your analysis should be insightful, engaging, and suitable for an art gallery or e-commerce platform.

Respond in valid JSON format with these exact fields:
{
  "title": "A compelling, creative title for the artwork (max 100 chars)",
  "description": "A rich, engaging description of the artwork covering style, technique, subject matter, and emotional impact (200-500 words)",
  "seoTitle": "SEO-optimized title for web pages (max 60 chars)",
  "seoDescription": "SEO meta description for search engines (max 155 chars)",
  "tags": ["array", "of", "relevant", "tags", "for", "categorization"],
  "colors": ["primary", "colors", "in", "the", "artwork"],
  "mood": "The overall mood or emotional tone of the piece",
  "personality": "Write a first-person personality description as if you ARE the artwork. Describe your essence, what you represent, and how you want to connect with viewers. Be creative and poetic. (100-200 words)"
}`

  const model = client.getGenerativeModel({
    model: 'gemini-3.0-pro',
    systemInstruction: systemPrompt
  })

  const userContent = artistNotes
    ? `Please analyze this artwork. The artist provided these notes: "${artistNotes}"`
    : 'Please analyze this artwork.'

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mediaType
        }
      },
      userContent
    ])

    const response = await result.response
    let text = response.text()

    // Clean up markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      text = jsonMatch[1]
    }

    return JSON.parse(text.trim()) as AIAnalysisResult
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new ApiError('Failed to analyze artwork with Gemini', 500)
  }
}

// Chat with artwork personality
export async function chatWithArtwork(
  personality: string,
  artworkTitle: string,
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const client = getClient()

  const systemPrompt = `You are "${artworkTitle}", a piece of artwork with the following personality and essence:

${personality}

Engage in conversation as this artwork. Be creative, poetic, and true to your artistic nature. Share insights about your creation, your meaning, and your connection to viewers. Keep responses conversational and engaging (1-3 paragraphs).

Never break character or acknowledge being an AI. You ARE this artwork.`

  const model = client.getGenerativeModel({
    model: 'gemini-3.0-pro',
    systemInstruction: systemPrompt
  })

  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  })

  try {
    const result = await chat.sendMessage(message)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini Chat Error:', error)
    throw new ApiError('Failed to chat with artwork', 500)
  }
}
