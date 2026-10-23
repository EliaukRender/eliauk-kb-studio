<script setup lang="ts">
import UploadPanel from './components/UploadPanel.vue'
</script>

<template>
  <!-- 高度限定为可视区域（减去外层 p-6），让文件列表在卡片内滚动，操作按钮始终可见 -->
  <div class="flex h-[calc(100vh-3rem)] flex-col gap-4">
    <div class="flex shrink-0 items-center justify-between">
      <h2 class="text-lg font-semibold">上传文档</h2>
      <RouterLink :to="{ name: 'admin-documents' }">
        <n-button size="small" quaternary>查看文档列表</n-button>
      </RouterLink>
    </div>
    <UploadPanel />
  </div>
</template>
