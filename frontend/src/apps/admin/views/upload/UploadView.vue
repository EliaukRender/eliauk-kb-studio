<script setup lang="ts">
import UploadPanel from './components/UploadPanel.vue'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">上传文档</h2>
      <RouterLink :to="{ name: 'admin-documents' }">
        <n-button size="small" quaternary>查看文档列表</n-button>
      </RouterLink>
    </div>
    <UploadPanel />
  </div>
</template>
