<script setup lang="ts">
import type { Source } from '@/shared/types/rag'

defineProps<{ sources: Source[] }>()
</script>

<template>
  <n-collapse class="mt-2">
    <n-collapse-item :title="`检索到 ${sources.length} 个片段`" name="sources">
      <div class="flex flex-col gap-2">
        <div
          v-for="(s, i) in sources"
          :key="i"
          class="rounded-md border border-line bg-elevated p-2 text-xs"
        >
          <div class="mb-1 flex items-center gap-2 text-muted">
            <n-tag size="tiny" :bordered="false" type="info">{{ s.score.toFixed(2) }}</n-tag>
            <span class="truncate">{{ s.source }} · v{{ s.version }} · {{ s.section }}</span>
          </div>
          <div class="line-clamp-4 whitespace-pre-wrap">{{ s.content }}</div>
        </div>
      </div>
    </n-collapse-item>
  </n-collapse>
</template>
