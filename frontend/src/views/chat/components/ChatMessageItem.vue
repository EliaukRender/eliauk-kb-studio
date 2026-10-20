<script setup lang="ts">
import type { ChatMessage } from '@/composables/useChatStream'

import SourceList from './SourceList.vue'

defineProps<{ message: ChatMessage }>()
</script>

<template>
  <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed"
      :class="message.role === 'user' ? 'bg-primary text-white' : 'border border-line bg-surface'"
    >
      <div v-if="message.pending && !message.content" class="flex items-center gap-2 text-muted">
        <n-spin :size="14" /> 检索与思考中…
      </div>
      <div class="whitespace-pre-wrap select-text">{{ message.content }}</div>
      <n-alert v-if="message.error" type="error" :bordered="false" class="mt-2">
        {{ message.error }}
      </n-alert>
      <SourceList
        v-if="message.role === 'assistant' && message.sources.length"
        :sources="message.sources"
      />
    </div>
  </div>
</template>
