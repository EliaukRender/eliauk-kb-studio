import type { AppStatus, Source } from '@/types/api'
import { parseSseBuffer } from '@/utils/sse'

import { get } from './http'

export type ChatStreamHandlers = {
  onSources: (sources: Source[]) => void
  onToken: (token: string) => void
}

export const fetchStatus = () => get<AppStatus>('/status')

/** 问答接口是 POST + SSE，EventSource 只支持 GET，所以用 fetch 手动读取流 */
export async function streamChat(
  question: string,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`请求失败（${res.status}）`)

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    const { events, rest } = parseSseBuffer(buffer + value)
    buffer = rest
    for (const { event, data } of events) {
      const payload = JSON.parse(data)
      if (event === 'sources') handlers.onSources(payload)
      else if (event === 'token') handlers.onToken(payload)
      else if (event === 'error') throw new Error(payload)
      else if (event === 'done') return
    }
  }
}
