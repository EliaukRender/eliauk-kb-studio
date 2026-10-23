<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { type PaginationProps, useDialog, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { documentsApi } from '@/apps/admin/api/admin'
import { PAGE_SIZES, useDocumentList } from '@/apps/admin/composables/useDocumentList'
import type { KbDocument } from '@/apps/admin/types'
import { errorMessage } from '@/shared/utils/format'

import VersionDrawer from './components/VersionDrawer.vue'
import { createDocumentColumns } from './document-columns'

const message = useMessage()
const dialog = useDialog()
const { items, total, loading, checkedIds, query, update, load, removeMany } = useDocumentList()

const keyword = ref(query.value.keyword)
watch(
  () => query.value.keyword,
  (k) => (keyword.value = k),
)
const search = () => update({ keyword: keyword.value.trim(), page: 1 })
const searchDebounced = useDebounceFn(search, 300)

const selected = ref<KbDocument | null>(null)
const showVersions = ref(false)

async function reindex(doc: KbDocument) {
  try {
    const updated = await documentsApi.reindex(doc.id)
    if (updated.error) message.error(updated.error)
    else message.success('已重新入库')
  } catch (e) {
    message.error(errorMessage(e))
  }
  await load()
}

function confirmRemove(docs: KbDocument[], title: string) {
  if (!docs.length) return
  const names = docs.slice(0, 5).map((d) => d.filename)
  const more = docs.length > names.length ? ` 等 ${docs.length} 个文档` : ''
  dialog.warning({
    title,
    content: `从当前索引中移除：${names.join('、')}${more}。原文件和版本记录会保留，重新上传即可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => removeMany(docs.map((d) => d.id)),
  })
}

const checkedDocs = computed(() => items.value.filter((d) => checkedIds.value.includes(d.id)))

const columns = createDocumentColumns({
  versions: (d) => {
    selected.value = d
    showVersions.value = true
  },
  reindex,
  remove: (d) => confirmRemove([d], '删除文档'),
})

const pagination = computed<PaginationProps>(() => ({
  page: query.value.page,
  pageSize: query.value.pageSize,
  itemCount: total.value,
  pageSizes: PAGE_SIZES,
  showSizePicker: true,
  prefix: ({ itemCount }) => `共 ${itemCount} 个`,
}))
</script>

<template>
  <!-- 高度限定为可视区域（减去外层 p-6）：表格在内部滚动，分页器固定在底部 -->
  <div class="flex h-[calc(100vh-3rem)] flex-col gap-4">
    <div class="flex shrink-0 items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">文档列表</h2>
        <p class="mt-1 text-xs text-muted">
          状态以当前索引版本为准：切换到旧索引后，后来新增或更新过的文档会显示为“待同步”，点“重新入库”即可写入当前索引。
        </p>
      </div>
      <RouterLink :to="{ name: 'admin-upload' }">
        <n-button type="primary" size="small">上传文档</n-button>
      </RouterLink>
    </div>
    <n-card size="small" class="min-h-0 flex-1" content-class="flex min-h-0 flex-col">
      <div class="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        <n-input
          v-model:value="keyword"
          style="width: 18rem"
          size="small"
          clearable
          placeholder="按文件名查找"
          @input="searchDebounced"
          @clear="search"
          @keyup.enter="search"
        >
          <template #prefix><i-ri-search-line /></template>
        </n-input>
        <div class="flex-1" />
        <n-button
          size="small"
          type="error"
          ghost
          :disabled="!checkedDocs.length"
          @click="confirmRemove(checkedDocs, '删除选中的文档')"
        >
          删除选中{{ checkedDocs.length ? `（${checkedDocs.length}）` : '' }}
        </n-button>
        <n-button
          size="small"
          type="error"
          ghost
          :disabled="!items.length"
          @click="confirmRemove(items, '删除本页文档')"
        >
          删除本页
        </n-button>
        <n-button size="small" quaternary :loading="loading" @click="load">刷新</n-button>
      </div>
      <n-data-table
        v-model:checked-row-keys="checkedIds"
        remote
        flex-height
        class="min-h-0 flex-1"
        :columns="columns"
        :data="items"
        :loading="loading"
        :pagination="pagination"
        :row-key="(d: KbDocument) => d.id"
        @update:page="(page: number) => update({ page })"
        @update:page-size="(pageSize: number) => update({ pageSize, page: 1 })"
      />
    </n-card>
    <VersionDrawer v-model:show="showVersions" :document="selected" @changed="load" />
  </div>
</template>
