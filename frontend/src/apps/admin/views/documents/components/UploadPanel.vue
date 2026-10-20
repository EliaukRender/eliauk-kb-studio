<script setup lang="ts">
import { type UploadFileInfo, useMessage } from 'naive-ui'
import { ref } from 'vue'

import { documentsApi } from '@/apps/admin/api/admin'
import type { UploadResult } from '@/apps/admin/types'
import { errorMessage } from '@/shared/utils/format'

const emit = defineEmits<{ uploaded: [] }>()
const message = useMessage()

const fileList = ref<UploadFileInfo[]>([])
const uploading = ref(false)
const results = ref<UploadResult[]>([])

const ACTION_LABEL: Record<UploadResult['action'], string> = {
  created: '新增',
  updated: '新版本',
  skipped: '内容未变，已跳过',
  rejected: '已拒绝',
}

async function upload() {
  const files = fileList.value.map((f) => f.file).filter((f): f is File => !!f)
  if (!files.length) return
  uploading.value = true
  try {
    results.value = await documentsApi.upload(files)
    fileList.value = []
    emit('uploaded')
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <n-card title="上传文档" size="small">
    <n-upload
      v-model:file-list="fileList"
      multiple
      directory-dnd
      accept=".md,.txt"
      :default-upload="false"
    >
      <n-upload-dragger>
        <i-ri-upload-cloud-2-line class="mx-auto mb-2 block text-4xl text-muted" />
        <p>点击或拖拽 .md / .txt 文件到这里</p>
        <p class="mt-1 text-xs text-muted">同名文件内容有变化时生成新版本，只重新入库该文档</p>
      </n-upload-dragger>
    </n-upload>
    <n-button
      type="primary"
      class="mt-3"
      :loading="uploading"
      :disabled="!fileList.length"
      @click="upload"
    >
      上传并入库
    </n-button>
    <ul v-if="results.length" class="mt-3 flex flex-col gap-1 text-xs">
      <li v-for="r in results" :key="r.filename" class="flex gap-2">
        <span class="font-medium">{{ r.filename }}</span>
        <span class="text-muted">{{ ACTION_LABEL[r.action] }}</span>
        <span v-if="r.document" class="text-muted">v{{ r.document.current_version }}</span>
        <span v-if="r.error ?? r.document?.error" class="text-red-500">
          {{ r.error ?? r.document?.error }}
        </span>
      </li>
    </ul>
  </n-card>
</template>
