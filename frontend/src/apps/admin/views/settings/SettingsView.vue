<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { onMounted, ref } from 'vue'

import { settingsApi } from '@/apps/admin/api/admin'
import type { RuntimeSettings } from '@/apps/admin/types'
import { errorMessage } from '@/shared/utils/format'

const message = useMessage()
const form = ref<RuntimeSettings | null>(null)
const saving = ref(false)

const EMBEDDING_OPTIONS = [
  'text-embedding-v4',
  'qwen3.7-text-embedding',
  'qwen3.7-text-embedding-flash',
].map((v) => ({ label: v, value: v }))

async function save() {
  if (!form.value) return
  saving.value = true
  try {
    form.value = await settingsApi.update(form.value)
    message.success('已保存')
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  form.value = await settingsApi.get()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold">参数设置</h2>
    <n-card v-if="form" size="small">
      <n-form label-placement="left" label-width="140" class="max-w-xl">
        <n-divider title-placement="left">索引参数（重建索引后生效）</n-divider>
        <n-form-item label="Embedding 模型">
          <n-select
            v-model:value="form.embedding_model"
            :options="EMBEDDING_OPTIONS"
            tag
            filterable
          />
        </n-form-item>
        <n-form-item label="分块大小">
          <n-input-number v-model:value="form.chunk_size" :min="100" :max="4000" :step="100" />
        </n-form-item>
        <n-form-item label="分块重叠">
          <n-input-number v-model:value="form.chunk_overlap" :min="0" :max="1000" :step="20" />
        </n-form-item>

        <n-divider title-placement="left">检索参数（立即生效）</n-divider>
        <n-form-item label="Top K">
          <n-input-number v-model:value="form.top_k" :min="1" :max="20" />
        </n-form-item>
        <n-form-item label="相关度阈值">
          <n-slider
            v-model:value="form.score_threshold"
            :min="0"
            :max="1"
            :step="0.05"
            class="mr-4"
          />
          <span class="w-10 text-right">{{ form.score_threshold.toFixed(2) }}</span>
        </n-form-item>
        <p class="mb-4 text-xs text-muted">
          阈值和 Embedding 模型绑定：换模型后分数分布会变化，需要用回归测试重新校准。
        </p>
        <n-button type="primary" :loading="saving" @click="save">保存</n-button>
      </n-form>
    </n-card>
  </div>
</template>
