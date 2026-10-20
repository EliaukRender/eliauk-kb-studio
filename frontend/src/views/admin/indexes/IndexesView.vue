<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { type DataTableColumns, NButton, NSpace, NTag, useDialog, useMessage } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { indexesApi } from '@/api/admin'
import { INDEX_STATUS_META } from '@/constants/status'
import { type IndexList, IndexStatus, type IndexVersion } from '@/types/api'
import { errorMessage, formatPercent, formatTime } from '@/utils/format'

const message = useMessage()
const dialog = useDialog()
const router = useRouter()

const data = ref<IndexList>({ current_id: null, items: [] })
const rebuilding = ref(false)

const busy = computed(() =>
  data.value.items.some(
    (i) => i.status === IndexStatus.Building || i.status === IndexStatus.Evaluating,
  ),
)

async function load() {
  data.value = await indexesApi.list().catch((e) => {
    message.error(errorMessage(e))
    return data.value
  })
}

// 构建和评估在后端后台任务中进行，期间轮询刷新状态
const { pause, resume } = useIntervalFn(
  async () => {
    await load()
    if (!busy.value) pause()
  },
  3000,
  { immediate: false },
)

async function rebuild() {
  rebuilding.value = true
  try {
    const index = await indexesApi.rebuild()
    message.info(`已开始构建 ${index.collection}，完成后会自动跑回归测试`)
    await load()
    resume()
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    rebuilding.value = false
  }
}

function activate(index: IndexVersion) {
  dialog.info({
    title: `切换到 ${index.collection}`,
    content: '问答会立即改用该索引；之后可以随时切回其他版本，实现秒级回退。',
    positiveText: '切换',
    negativeText: '取消',
    onPositiveClick: async () => {
      await indexesApi.activate(index.id).catch((e) => message.error(errorMessage(e)))
      await load()
    },
  })
}

function remove(index: IndexVersion) {
  dialog.warning({
    title: `删除 ${index.collection}`,
    content: '会同时删除该版本在向量库中的 collection，不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await indexesApi.remove(index.id).catch((e) => message.error(errorMessage(e)))
      await load()
    },
  })
}

function renderName(i: IndexVersion) {
  const isCurrent = i.id === data.value.current_id
  return h(NSpace, { size: 'small', align: 'center' }, () => [
    i.collection,
    isCurrent && h(NTag, { type: 'primary', size: 'small', bordered: false }, () => '当前'),
  ])
}

function renderActions(i: IndexVersion) {
  const isCurrent = i.id === data.value.current_id
  const ready = i.status === IndexStatus.Ready
  return h(NSpace, { size: 'small' }, () => [
    h(
      NButton,
      { size: 'tiny', disabled: isCurrent || !ready, onClick: () => activate(i) },
      () => '设为当前',
    ),
    h(
      NButton,
      {
        size: 'tiny',
        disabled: !ready,
        onClick: () => router.push({ name: 'admin-eval', query: { index: i.id } }),
      },
      () => '回归测试',
    ),
    h(
      NButton,
      {
        size: 'tiny',
        type: 'error',
        ghost: true,
        disabled: isCurrent || !ready,
        onClick: () => remove(i),
      },
      () => '删除',
    ),
  ])
}

const columns: DataTableColumns<IndexVersion> = [
  { title: '版本', key: 'collection', width: 130, render: renderName },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (i) => {
      const meta = INDEX_STATUS_META[i.status]
      return h(NTag, { type: meta.type, size: 'small', bordered: false }, () => meta.label)
    },
  },
  { title: 'Embedding', key: 'embedding_model', ellipsis: { tooltip: true } },
  { title: '分块', key: 'chunk', width: 90, render: (i) => `${i.chunk_size} / ${i.chunk_overlap}` },
  {
    title: '文档 / 块',
    key: 'count',
    width: 90,
    render: (i) => `${i.doc_count} / ${i.chunk_count}`,
  },
  {
    title: '回归通过率',
    key: 'eval_pass_rate',
    width: 100,
    render: (i) => formatPercent(i.eval_pass_rate),
  },
  { title: '创建时间', key: 'created_at', width: 165, render: (i) => formatTime(i.created_at) },
  { title: '操作', key: 'actions', width: 230, render: renderActions },
]

onMounted(async () => {
  await load()
  if (busy.value) resume()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">索引版本</h2>
      <n-button type="primary" :loading="rebuilding" :disabled="busy" @click="rebuild">
        <template #icon><i-ri-hammer-line /></template>
        按当前参数重建索引
      </n-button>
    </div>
    <n-alert type="info" :bordered="false">
      每个版本是一个独立的向量库 collection（蓝绿部署）。重建会用“参数设置”里的 Embedding
      模型和分块参数生成新版本并自动跑回归测试，但不会自动切换；确认通过率后再“设为当前”，出问题时切回旧版本即可回退。
      日常的文档增量更新只写入当前版本。
    </n-alert>
    <n-card size="small">
      <n-data-table :columns="columns" :data="data.items" :row-key="(i: IndexVersion) => i.id" />
    </n-card>
  </div>
</template>
