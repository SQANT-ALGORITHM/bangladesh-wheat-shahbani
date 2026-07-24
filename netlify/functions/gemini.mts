import type { Config, Context } from '@netlify/functions'

export async function callGemini(promptText?: string, rawContents?: any) {
  const GEMINI_API_KEY = Netlify.env.get('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || ''
  const GEMINI_BASE_URL = Netlify.env.get('GOOGLE_GEMINI_BASE_URL') || process.env.GOOGLE_GEMINI_BASE_URL || ''

  const contents = rawContents || [{
    parts: [{ text: promptText || 'Hello!' }]
  }]

  const response = await fetch(
    `${GEMINI_BASE_URL}/v1beta/models/gemini-2.5-pro:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({ contents })
    }
  )

  return await response.json()
}

export default async (req: Request, context: Context) => {
  try {
    let promptText: string | undefined
    let rawContents: any

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (body.contents) {
          rawContents = body.contents
        } else if (body.prompt) {
          promptText = body.prompt
        } else if (body.text) {
          promptText = body.text
        }
      } catch (e) {
        // Fall back to default if JSON body parsing fails
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url)
      promptText = url.searchParams.get('prompt') || url.searchParams.get('text') || undefined
    }

    const data = await callGemini(promptText, rawContents)

    return Response.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    return Response.json(
      { error: error?.message || 'Failed to call Gemini API' },
      { status: 500 }
    )
  }
}

export const config: Config = {
  path: ['/api/gemini', '/.netlify/functions/gemini']
}
