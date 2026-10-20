import { describe, expect, it } from 'vitest'

import { parseSseBuffer } from '@/utils/sse'

describe('parseSseBuffer', () => {
  it('解析完整事件', () => {
    const { events, rest } = parseSseBuffer('event: token\ndata: "你"\n\nevent: done\ndata: {}\n\n')
    expect(events).toEqual([
      { event: 'token', data: '"你"' },
      { event: 'done', data: '{}' },
    ])
    expect(rest).toBe('')
  })

  it('不完整的事件留在缓冲区，与下一段数据拼接后解析', () => {
    const first = parseSseBuffer('event: token\ndata: "前')
    expect(first.events).toEqual([])
    const second = parseSseBuffer(first.rest + '半"\n\n')
    expect(second.events).toEqual([{ event: 'token', data: '"前半"' }])
  })

  it('没有 event 行时默认为 message', () => {
    expect(parseSseBuffer('data: 1\n\n').events).toEqual([{ event: 'message', data: '1' }])
  })
})
