<script setup lang="ts">
import {
  type DataTableColumns,
  NButton,
  NSpace,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
} from 'naive-ui'
import { h, onMounted, ref } from 'vue'

import { documentsApi } from '@/apps/admin/api/admin'
import { DOCUMENT_STATUS_META } from '@/apps/admin/constants/status'
import type { KbDocument } from '@/apps/admin/types'
import { errorMessage, formatTime } from '@/shared/utils/format'

import UploadPanel from './components/UploadPanel.vue'
import VersionDrawer from './components/VersionDrawer.vue'

const message = useMessage()
const dialog = useDialog()

const documents = ref<KbDocument[]>([])
const loading = ref(false)
const selected = ref<KbDocument | null>(null)
const showVersions = ref(false)

async function load() {
  loading.value = true
  try {
    documents.value = await documentsApi.list()
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    loading.value = false
  }
}

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

function remove(doc: KbDocument) {
  dialog.warning({
    title: '删除文档',
    content: `从当前索引中移除 ${doc.filename}。原文件和版本记录会保留，重新上传即可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await documentsApi.remove(doc.id).catch((e) => message.error(errorMessage(e)))
      await load()
    },
  })
}

function openVersions(doc: KbDocument) {
  selected.value = doc
  showVersions.value = true
}

function renderStatus(doc: KbDocument) {
  const meta = DOCUMENT_STATUS_META[doc.status]
  const tag = h(NTag, { type: meta.type, size: 'small', bordered: false }, () => meta.label)
  if (!doc.error) return tag
  return h(NTooltip, null, { trigger: () => tag, default: () => doc.error })
}

const columns: DataTableColumns<KbDocument> = [
  { title: '文件名', key: 'filename', ellipsis: { tooltip: true } },
  { title: '版本', key: 'current_version', width: 70, render: (d) => `v${d.current_version}` },
  { title: '状态', key: 'status', width: 90, render: renderStatus },
  { title: '块数', key: 'chunk_count', width: 70 },
  { title: '更新时间', key: 'updated_at', width: 170, render: (d) => formatTime(d.updated_at) },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render: (d) =>
      h(NSpace, { size: 'small' }, () => [
        h(NButton, { size: 'tiny', onClick: () => openVersions(d) }, () => '版本'),
        h(NButton, { size: 'tiny', onClick: () => reindex(d) }, () => '重新入库'),
        h(
          NButton,
          { size: 'tiny', type: 'error', ghost: true, onClick: () => remove(d) },
          () => '删除',
        ),
      ]),
  },
]

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold">文档管理</h2>
    <UploadPanel @uploaded="load" />
    <n-card title="文档列表" size="small">
      <template #header-extra>
        <n-button size="small" quaternary :loading="loading" @click="load">刷新</n-button>
      </template>
      <n-data-table
        :columns="columns"
        :data="documents"
        :loading="loading"
        :row-key="(d: KbDocument) => d.id"
      />
      <p class="mt-2 text-xs text-muted">
        状态以当前索引版本为准：切换到旧索引后，后来新增或更新过的文档会显示为“待同步”，点“重新入库”即可写入当前索引。
      </p>
    </n-card>
    <VersionDrawer v-model:show="showVersions" :document="selected" @changed="load" />
  </div>
</template>
