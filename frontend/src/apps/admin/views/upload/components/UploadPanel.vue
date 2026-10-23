<script setup lang="ts">
import { type UploadFileInfo, useMessage } from 'naive-ui'

import { useUploadQueue } from '@/apps/admin/composables/useUploadQueue'
import {
  UPLOAD_ACCEPT_SUFFIXES,
  UPLOAD_MAX_FILE_BYTES,
  UPLOAD_MAX_FILES,
} from '@/apps/admin/constants/upload'

import UploadQueueItem from './UploadQueueItem.vue'

const message = useMessage()
const queue = useUploadQueue()
const { items, running, finishedCount, waitingCount, totalPercent } = queue

const limitMb = UPLOAD_MAX_FILE_BYTES / 1024 / 1024

// n-upload 只用作文件选择器，文件交给队列管理；file-list 恒为空，不使用组件自带的列表
function onChange({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  const errors = queue.add([file.file])
  errors.forEach((e) => message.warning(e))
}
</script>

<template>
  <n-card size="small" class="min-h-0" content-class="flex min-h-0 flex-col gap-3">
    <n-upload
      :file-list="[]"
      multiple
      directory-dnd
      :accept="UPLOAD_ACCEPT_SUFFIXES.join(',')"
      :default-upload="false"
      :disabled="running"
      :show-file-list="false"
      @change="onChange"
    >
      <n-upload-dragger class="py-5!">
        <i-ri-upload-cloud-2-line class="mx-auto mb-1 block text-3xl text-muted" />
        <p>点击或拖拽 {{ UPLOAD_ACCEPT_SUFFIXES.join(' / ') }} 文件到这里</p>
        <p class="mt-1 text-xs text-muted">
          一次最多 {{ UPLOAD_MAX_FILES }} 个，单个不超过
          {{ limitMb }}MB；同名文件内容有变化时生成新版本
        </p>
      </n-upload-dragger>
    </n-upload>

    <!-- 列表随内容长高，超过可用空间后在内部滚动，底部操作栏始终可见 -->
    <div v-if="items.length" class="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
      <UploadQueueItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :removable="!running && item.phase === 'waiting'"
        @remove="queue.remove(item.id)"
      />
    </div>

    <div class="flex shrink-0 items-center gap-3 border-t border-line pt-3">
      <div class="min-w-0 flex-1">
        <template v-if="items.length">
          <div class="mb-1 text-xs text-muted">
            总进度：已完成 {{ finishedCount }} / {{ items.length }} · {{ totalPercent }}%
          </div>
          <n-progress
            type="line"
            :height="6"
            :show-indicator="false"
            :percentage="totalPercent"
            :processing="running"
          />
        </template>
        <span v-else class="text-xs text-muted">尚未选择文件</span>
      </div>
      <n-button v-if="running" @click="queue.cancel">取消</n-button>
      <n-button v-else :disabled="!items.length" @click="queue.clear">清空列表</n-button>
      <n-button type="primary" :loading="running" :disabled="!waitingCount" @click="queue.start">
        上传并入库
      </n-button>
    </div>
  </n-card>
</template>
