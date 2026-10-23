<script setup lang="ts">
import type { UploadItem } from '@/apps/admin/composables/useUploadQueue'
import { UPLOAD_ACTION_LABEL, UPLOAD_PHASE_META } from '@/apps/admin/constants/upload'
import { formatBytes } from '@/shared/utils/format'

defineProps<{ item: UploadItem; removable: boolean }>()
defineEmits<{ remove: [] }>()
</script>

<template>
  <div class="flex flex-col gap-1 rounded-lg border border-line px-3 py-2">
    <div class="flex items-center gap-2 text-sm">
      <i-ri-file-text-line class="shrink-0 text-muted" />
      <span class="min-w-0 flex-1 truncate" :title="item.file.name">{{ item.file.name }}</span>
      <span class="shrink-0 text-xs text-muted">{{ formatBytes(item.file.size) }}</span>
      <n-tag size="small" :bordered="false" :type="UPLOAD_PHASE_META[item.phase].type">
        {{ UPLOAD_PHASE_META[item.phase].label }}
        <template v-if="item.phase === 'uploading'"> {{ item.percent }}%</template>
      </n-tag>
      <n-button v-if="removable" text size="small" title="移除" @click="$emit('remove')">
        <i-ri-close-line />
      </n-button>
    </div>
    <n-progress
      v-if="item.phase === 'uploading' || item.phase === 'ingesting'"
      type="line"
      :height="4"
      :show-indicator="false"
      :percentage="item.phase === 'ingesting' ? 100 : item.percent"
      :processing="item.phase === 'ingesting'"
    />
    <div v-if="item.error" class="text-xs text-red-500">{{ item.error }}</div>
    <div v-else-if="item.result?.document" class="text-xs text-muted">
      {{ UPLOAD_ACTION_LABEL[item.result.action] }} · v{{ item.result.document.current_version }} ·
      {{ item.result.document.chunk_count }} 个块
    </div>
  </div>
</template>
