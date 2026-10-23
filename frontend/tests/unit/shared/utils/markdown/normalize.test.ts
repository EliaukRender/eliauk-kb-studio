import { describe, expect, it } from 'vitest'

import { normalizeAnswer } from '@/shared/utils/markdown/normalize'

describe('normalizeAnswer', () => {
  it('统一换行符', () => {
    expect(normalizeAnswer('a\r\nb\rc')).toBe('a\nb\nc')
  })

  it('去掉零宽字符与控制字符，保留换行和制表符', () => {
    expect(normalizeAnswer('年​假﻿\u0007\t5 天\n')).toBe('年假\t5 天\n')
  })

  it('剥离思考过程，包括流式期间尚未闭合的标签', () => {
    expect(normalizeAnswer('<think>推理</think>\n答案')).toBe('答案')
    expect(normalizeAnswer('<think>推理中')).toBe('')
  })

  it('幂等', () => {
    const once = normalizeAnswer('<think>x</think>\r\n**a**​')
    expect(normalizeAnswer(once)).toBe(once)
  })
})
