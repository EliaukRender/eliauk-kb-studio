<script setup lang="ts">
import { type DataTableColumns, NButton, useMessage } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { evalApi, indexesApi } from '@/api/admin'
import { type EvalCase, type EvalReport, IndexStatus, type IndexVersion } from '@/types/api'
import { errorMessage, formatPercent } from '@/utils/format'

import CaseForm from './components/CaseForm.vue'
import EvalResultList from './components/EvalResultList.vue'

const route = useRoute()
const message = useMessage()

const cases = ref<EvalCase[]>([])
const indexes = ref<IndexVersion[]>([])
const selectedIndex = ref<number | null>(null)
const running = ref(false)
const report = ref<EvalReport | null>(null)

const indexOptions = computed(() =>
  indexes.value
    .filter((i) => i.status === IndexStatus.Ready)
    .map((i) => ({
      label: `${i.collection}（上次 ${formatPercent(i.eval_pass_rate)}）`,
      value: i.id,
    })),
)

async function loadCases() {
  cases.value = await evalApi.cases()
}

async function removeCase(id: number) {
  await evalApi.removeCase(id).catch((e) => message.error(errorMessage(e)))
  await loadCases()
}

async function run() {
  running.value = true
  report.value = null
  try {
    report.value = await evalApi.run(selectedIndex.value ?? undefined)
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    running.value = false
  }
}

const columns: DataTableColumns<EvalCase> = [
  { title: '问题', key: 'question' },
  {
    title: '期望',
    key: 'expected',
    render: (c) => (c.should_refuse ? '拒答' : c.expected_keywords.join('、')),
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (c) =>
      h(
        NButton,
        { size: 'tiny', type: 'error', ghost: true, onClick: () => removeCase(c.id) },
        () => '删除',
      ),
  },
]

onMounted(async () => {
  const [, list] = await Promise.all([loadCases(), indexesApi.list()])
  indexes.value = list.items
  const fromQuery = Number(route.query.index)
  selectedIndex.value = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : list.current_id
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold">回归测试</h2>
    <n-card title="测试用例" size="small">
      <n-data-table
        :columns="columns"
        :data="cases"
        :row-key="(c: EvalCase) => c.id"
        size="small"
      />
      <n-divider />
      <CaseForm @created="loadCases" />
    </n-card>
    <n-card title="运行" size="small">
      <div class="flex items-center gap-3">
        <n-select v-model:value="selectedIndex" :options="indexOptions" class="max-w-xs" />
        <n-button type="primary" :loading="running" :disabled="!selectedIndex" @click="run">
          运行回归测试
        </n-button>
        <span class="text-xs text-muted">逐条检索并生成回答，用例多时需要等待一会儿</span>
      </div>
      <EvalResultList v-if="report" :report="report" class="mt-4" />
    </n-card>
  </div>
</template>
