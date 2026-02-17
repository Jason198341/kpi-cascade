// Vercel Edge Function for Fireworks AI proxy
export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.json()
  const API_KEY = process.env.FIREWORKS_API_KEY

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'accounts/fireworks/models/deepseek-v3p1',
      messages: body.messages,
      stream: true,
      max_tokens: body.max_tokens || 2048,
      temperature: body.temperature || 0.7,
    }),
  })

  return new Response(res.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
