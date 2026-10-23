import { useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { type LocationQuery, useRoute, useRouter } from 'vue-router'

import { documentsApi } from '@/apps/admin/api/admin'
import type { DocumentQuery, KbDocument } from '@/apps/admin/types'
import { errorMessage } from '@/shared/utils/format'

export const PAGE_SIZES = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 20

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

/** 查询条件以 URL 为准：刷新、从上传页返回、浏览器后退都能还原到原来的页码和关键词 */
export function parseDocumentQuery(q: LocationQuery): DocumentQuery {
  const pageSize = toPositiveInt(q.page_size, DEFAULT_PAGE_SIZE)
  return {
    page: toPositiveInt(q.page, 1),
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
    keyword: typeof q.keyword === 'string' ? q.keyword.trim() : '',
  }
}

export function useDocumentList() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()

  const items = ref<KbDocument[]>([])
  const total = ref(0)
  const loading = ref(false)
  // 勾选只在当前页内有效，翻页或搜索后自动清掉不可见的行，避免误删看不到的文档
  const checkedIds = ref<number[]>([])
  const query = computed(() => parseDocumentQuery(route.query))
  const routeName = route.name

  function update(patch: Partial<DocumentQuery>) {
    const next = { ...query.value, ...patch }
    return router.replace({
      query: {
        page: String(next.page),
        page_size: String(next.pageSize),
        keyword: next.keyword || undefined,
      },
    })
  }

  async function load() {
    loading.value = true
    try {
      const res = await documentsApi.list(query.value)
      // 删除后当前页可能超出总页数，退回最后一页
      const lastPage = Math.max(1, Math.ceil(res.total / query.value.pageSize))
      if (query.value.page > lastPage) {
        await update({ page: lastPage })
        return
      }
      items.value = res.items
      total.value = res.total
      checkedIds.value = checkedIds.value.filter((id) => res.items.some((d) => d.id === id))
    } catch (e) {
      message.error(errorMessage(e))
    } finally {
      loading.value = false
    }
  }

  async function removeMany(ids: number[]) {
    try {
      const { deleted } = await documentsApi.batchRemove(ids)
      message.success(`已删除 ${deleted.length} 个文档`)
    } catch (e) {
      message.error(errorMessage(e))
    }
    await load()
  }

  // 离开本页时路由先变化、组件后卸载，只响应本页自身的查询变化
  watch(
    () => route.name === routeName && JSON.stringify(query.value),
    (key) => key && load(),
    { immediate: true },
  )

  return { items, total, loading, checkedIds, query, update, load, removeMany }
}
