import { describe, expect, it } from 'vitest'

import { itemProgress } from '@/apps/admin/composables/useUploadQueue'

describe('itemProgress', () => {
  it('传输占前一半，入库占后一半', () => {
    expect(itemProgress({ phase: 'waiting', percent: 0 })).toBe(0)
    expect(itemProgress({ phase: 'uploading', percent: 50 })).toBe(0.25)
    expect(itemProgress({ phase: 'ingesting', percent: 100 })).toBe(0.5)
  })

  it('完成、失败、取消都计为已结束', () => {
    for (const phase of ['done', 'failed', 'canceled'] as const) {
      expect(itemProgress({ phase, percent: 0 })).toBe(1)
    }
  })
})
