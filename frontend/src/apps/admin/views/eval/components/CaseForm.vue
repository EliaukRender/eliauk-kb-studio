<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { reactive } from 'vue'

import { evalApi } from '@/apps/admin/api/admin'
import { errorMessage } from '@/shared/utils/format'

const emit = defineEmits<{ created: [] }>()
const message = useMessage()

const form = reactive({ question: '', expected_keywords: [] as string[], should_refuse: false })

async function submit() {
  try {
    await evalApi.createCase({ ...form })
    Object.assign(form, { question: '', expected_keywords: [], should_refuse: false })
    emit('created')
  } catch (e) {
    message.error(errorMessage(e))
  }
}
</script>

<template>
  <n-form label-placement="left" label-width="90" class="max-w-xl">
    <n-form-item label="问题">
      <n-input v-model:value="form.question" placeholder="例如：报销时限是多久？" />
    </n-form-item>
    <n-form-item label="期望拒答">
      <n-switch v-model:value="form.should_refuse" />
      <span class="ml-2 text-xs text-muted">知识库里没有答案、应回答“没有找到”的问题</span>
    </n-form-item>
    <n-form-item v-if="!form.should_refuse" label="期望关键词">
      <n-dynamic-tags v-model:value="form.expected_keywords" />
      <span class="ml-2 text-xs text-muted">回答需包含全部关键词</span>
    </n-form-item>
    <n-button type="primary" :disabled="!form.question.trim()" @click="submit">添加用例</n-button>
  </n-form>
</template>
