import { ref } from 'vue'

import { streamChat } from '@/apps/chat/api/chat'
import type { Source } from '@/shared/types/rag'

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources: Source[]
  pending: boolean
  error?: string
}

let nextId = 0

export function useChatStream() {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  let controller: AbortController | null = null

  async function send(question: string) {
    messages.value.push({
      id: nextId++,
      role: 'user',
      content: question,
      sources: [],
      pending: false,
    })
    messages.value.push({
      id: nextId++,
      role: 'assistant',
      content: '',
      sources: [],
      pending: true,
    })
    // 必须通过响应式数组取回元素再修改，直接改上面 push 的字面量对象不会触发更新
    const reply = messages.value[messages.value.length - 1]

    loading.value = true
    controller = new AbortController()
    try {
      await streamChat(
        question,
        {
          onSources: (sources) => (reply.sources = sources),
          onToken: (token) => (reply.content += token),
        },
        controller.signal,
      )
    } catch (e) {
      if (!controller.signal.aborted) reply.error = e instanceof Error ? e.message : String(e)
    } finally {
      reply.pending = false
      loading.value = false
      controller = null
    }
  }

  function stop() {
    controller?.abort()
  }

  function clear() {
    stop()
    messages.value = []
  }

  return { messages, loading, send, stop, clear }
}
