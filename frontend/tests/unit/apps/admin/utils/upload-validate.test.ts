import { describe, expect, it } from 'vitest'

import { UPLOAD_MAX_FILE_BYTES } from '@/apps/admin/constants/upload'
import { validateSelection } from '@/apps/admin/utils/upload-validate'

const file = (name: string, size = 100) => ({ name, size })

describe('validateSelection', () => {
  it('接受支持的格式，后缀不区分大小写', () => {
    const { accepted, errors } = validateSelection([], [file('a.md'), file('b.TXT')])
    expect(accepted.map((f) => f.name)).toEqual(['a.md', 'b.TXT'])
    expect(errors).toEqual([])
  })

  it('拒绝不支持的格式和超过 10MB 的文件，正好 10MB 可以上传', () => {
    const { accepted, errors } = validateSelection(
      [],
      [
        file('a.pdf'),
        file('big.md', UPLOAD_MAX_FILE_BYTES + 1),
        file('ok.md', UPLOAD_MAX_FILE_BYTES),
      ],
    )
    expect(accepted.map((f) => f.name)).toEqual(['ok.md'])
    expect(errors[0]).toContain('只支持')
    expect(errors[1]).toContain('10MB')
  })

  it('跳过列表中已有的同名文件', () => {
    const { accepted, errors } = validateSelection(['a.md'], [file('a.md')])
    expect(accepted).toEqual([])
    expect(errors[0]).toContain('已在列表中')
  })

  it('列表最多 10 个文件，超出部分逐个拒绝', () => {
    const queued = Array.from({ length: 8 }, (_, i) => `q${i}.md`)
    const { accepted, errors } = validateSelection(queued, [
      file('a.md'),
      file('b.md'),
      file('c.md'),
    ])
    expect(accepted.map((f) => f.name)).toEqual(['a.md', 'b.md'])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('最多选择 10 个')
  })
})
