<script setup lang="ts">
import { refThrottled } from '@vueuse/core'
import { computed, toRef } from 'vue'

import { renderMarkdown } from '@/shared/utils/markdown/render'

const props = defineProps<{ source: string; streaming?: boolean }>()

// 流式期间每个 token 都整段重新解析，长回答会卡顿；节流后最多约 20 次/秒
const throttled = refThrottled(toRef(props, 'source'), 50)
const html = computed(() =>
  props.streaming
    ? renderMarkdown(throttled.value, { streaming: true })
    : renderMarkdown(props.source),
)
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- 内容已经过 renderMarkdown 消毒 -->
  <div class="md-content select-text" v-html="html" />
</template>
