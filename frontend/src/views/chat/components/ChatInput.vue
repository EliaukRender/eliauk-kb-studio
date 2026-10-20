<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ loading: boolean }>()
const emit = defineEmits<{ submit: [text: string]; stop: [] }>()

const text = ref('')

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('submit', value)
  text.value = ''
}

// 输入法组字时按回车是确认候选词，不能当作发送
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="flex items-end gap-2 rounded-xl border border-line bg-surface p-2">
    <n-input
      v-model:value="text"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 6 }"
      :bordered="false"
      placeholder="输入问题，Enter 发送，Shift + Enter 换行"
      @keydown="onKeydown"
    />
    <n-button v-if="loading" secondary @click="emit('stop')">
      <template #icon><i-ri-stop-circle-line /></template>
      停止
    </n-button>
    <n-button v-else type="primary" :disabled="!text.trim()" @click="submit">
      <template #icon><i-ri-send-plane-fill /></template>
      发送
    </n-button>
  </div>
</template>
