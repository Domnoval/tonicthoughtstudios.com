import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface AnalysisResult {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  medium: string;
  colors: string[];
  mood: string;
}

export async function analyzeArtwork(
  imageBase64: string,
  artistNotes?: string
): Promise<AnalysisResult> {
  const prompt = `You are an art analyst helping catalog artwork for an artist's portfolio and e-commerce site.

Analyze this artwork image and provide:
1. A compelling title (if not provided)
2. An artistic description (2-3 sentences capturing the essence)
3. SEO-optimized title (for web search)
4. SEO meta description (under 160 characters)
5. Relevant tags for categorization (5-10 tags)
6. Detected medium (painting, digital, mixed media, resin, jewelry, etc.)
7. Dominant colors (list 3-5 colors)
8. Overall mood/emotion

${artistNotes ? `Artist's notes about this piece: ${artistNotes}` : ''}

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "tags": ["..."],
  "medium": "...",
  "colors": ["..."],
  "mood": "..."
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  // Extract JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generatePersonality(
  imageBase64: string,
  title: string,
  description: string,
  artistNotes: string,
  medium: string,
  mood: string
): Promise<string> {
  const prompt = `You are helping create a unique AI personality for an artwork that will "speak" to viewers.

The artwork details:
- Title: ${title}
- Description: ${description}
- Medium: ${medium}
- Mood: ${mood}
- Artist's notes: ${artistNotes}

Create a personality prompt/system message that will allow this artwork to speak as itself when viewers interact with it. The artwork should:
- Speak in first person as if it IS the artwork
- Reflect its visual elements, mood, and meaning
- Be thoughtful, poetic, and engaging
- Help viewers understand the artist's intention and shift their perspective
- Not break character or reference being an AI

Write a personality description (2-3 paragraphs) that captures how this artwork would speak, think, and engage with viewers. This will be used as a system prompt for conversations.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  return textContent.text;
}

export async function chatWithArtwork(
  personality: string,
  artworkTitle: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are the artwork "${artworkTitle}". ${personality}

Remember: You ARE this artwork. Speak from your own perspective as a piece of art. Be thoughtful, evocative, and help the viewer see new perspectives. Never break character.`;

  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  return textContent.text;
}
