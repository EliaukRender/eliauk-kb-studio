export type SseEvent = { event: string; data: string }

/**
 * 增量解析 SSE 文本流。网络分包可能把一个事件拆在两次 read 之间，
 * 所以返回已完整解析的事件和剩余未完成的缓冲区，下次与新数据拼接后继续解析。
 */
export function parseSseBuffer(buffer: string): { events: SseEvent[]; rest: string } {
  const blocks = buffer.split('\n\n')
  const rest = blocks.pop() ?? ''
  const events = blocks
    .map((block) => {
      let event = 'message'
      const dataLines: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7)
        else if (line.startsWith('data: ')) dataLines.push(line.slice(6))
      }
      return { event, data: dataLines.join('\n') }
    })
    .filter((e) => e.data !== '')
  return { events, rest }
}
