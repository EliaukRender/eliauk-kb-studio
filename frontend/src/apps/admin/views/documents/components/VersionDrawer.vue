<script setup lang="ts">
import { useDialog, useMessage } from 'naive-ui'
import { ref, watch } from 'vue'

import { documentsApi } from '@/api/admin'
import type { DocumentVersion, KbDocument } from '@/types/api'
import { errorMessage, formatTime } from '@/utils/format'

const show = defineModel<boolean>('show', { required: true })
const props = defineProps<{ document: KbDocument | null }>()
const emit = defineEmits<{ changed: [] }>()

const message = useMessage()
const dialog = useDialog()
const versions = ref<DocumentVersion[]>([])

watch(show, async (visible) => {
  if (visible && props.document) versions.value = await documentsApi.versions(props.document.id)
})

function rollback(version: number) {
  const doc = props.document
  if (!doc) return
  dialog.warning({
    title: `回退到 v${version}`,
    content: `将 ${doc.filename} 的当前版本切换为 v${version}，并重新写入当前索引。`,
    positiveText: '回退',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const updated = await documentsApi.rollback(doc.id, version)
        if (updated.error) message.error(updated.error)
        else message.success(`已回退到 v${version}`)
        show.value = false
        emit('changed')
      } catch (e) {
        message.error(errorMessage(e))
      }
    },
  })
}
</script>

<template>
  <n-drawer v-model:show="show" :width="420">
    <n-drawer-content :title="`${document?.filename ?? ''} · 版本历史`" closable>
      <n-timeline>
        <n-timeline-item
          v-for="v in versions"
          :key="v.version"
          :type="v.version === document?.current_version ? 'success' : 'default'"
          :title="`v${v.version}${v.version === document?.current_version ? '（当前）' : ''}`"
          :time="formatTime(v.created_at)"
        >
          <div class="text-xs text-muted">哈希 {{ v.content_hash.slice(0, 12) }}</div>
          <div class="text-xs text-muted">原文件 data/{{ v.raw_path }}</div>
          <n-button
            v-if="v.version !== document?.current_version"
            size="tiny"
            class="mt-1"
            @click="rollback(v.version)"
          >
            回退到此版本
          </n-button>
        </n-timeline-item>
      </n-timeline>
    </n-drawer-content>
  </n-drawer>
</template>
