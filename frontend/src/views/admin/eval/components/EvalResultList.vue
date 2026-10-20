<script setup lang="ts">
import type { EvalReport } from '@/types/api'
import { formatPercent } from '@/utils/format'

defineProps<{ report: EvalReport }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="text-sm">
      通过 <b>{{ report.passed }}</b> / {{ report.total }}，通过率
      <b>{{ formatPercent(report.pass_rate) }}</b>
    </div>
    <div
      v-for="r in report.results"
      :key="r.case_id"
      class="rounded-lg border border-line bg-surface p-3 text-sm"
    >
      <div class="mb-1 flex items-center gap-2">
        <n-tag :type="r.passed ? 'success' : 'error'" size="small" :bordered="false">
          {{ r.passed ? '通过' : '未通过' }}
        </n-tag>
        <span class="font-medium">{{ r.question }}</span>
      </div>
      <div class="mb-1 text-xs text-muted">
        期望：{{ r.should_refuse ? '拒答' : r.expected_keywords.join('、') }}
      </div>
      <div class="whitespace-pre-wrap select-text">{{ r.answer }}</div>
      <div v-if="r.sources.length" class="mt-2 text-xs text-muted">
        命中片段：
        <span v-for="(s, i) in r.sources" :key="i" class="mr-3">
          [{{ s.score.toFixed(2) }}] {{ s.source }} · {{ s.section.split(' > ').at(-1) }}
        </span>
      </div>
    </div>
  </div>
</template>
