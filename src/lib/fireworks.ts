const API_KEY = import.meta.env.VITE_FIREWORKS_API_KEY as string
const BASE = import.meta.env.DEV ? '/api/fireworks' : 'https://api.fireworks.ai'

export async function* streamChat(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/inference/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'accounts/fireworks/models/deepseek-v3p1',
      messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    }),
    signal,
  })

  if (!res.ok) throw new Error(`Fireworks ${res.status}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch { /* skip malformed */ }
    }
  }
}
