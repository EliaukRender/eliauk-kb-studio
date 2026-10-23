import { describe, expect, it } from 'vitest'

import { parseDocumentQuery } from '@/apps/admin/composables/useDocumentList'

describe('parseDocumentQuery', () => {
  it('没有参数时使用默认值', () => {
    expect(parseDocumentQuery({})).toEqual({ page: 1, pageSize: 20, keyword: '' })
  })

  it('读取页码、每页条数和关键词', () => {
    expect(parseDocumentQuery({ page: '3', page_size: '50', keyword: ' 制度 ' })).toEqual({
      page: 3,
      pageSize: 50,
      keyword: '制度',
    })
  })

  it('非法值回退为默认值', () => {
    expect(parseDocumentQuery({ page: '-1', page_size: '999', keyword: ['a', 'b'] })).toEqual({
      page: 1,
      pageSize: 20,
      keyword: '',
    })
    expect(parseDocumentQuery({ page: '1.5', page_size: 'abc' })).toMatchObject({
      page: 1,
      pageSize: 20,
    })
  })
})
