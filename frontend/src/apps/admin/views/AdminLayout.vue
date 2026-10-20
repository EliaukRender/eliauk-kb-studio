<script setup lang="ts">
import { type MenuOption } from 'naive-ui'
import { computed, h } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { authApi } from '@/apps/admin/api/admin'
import { useAdminSessionStore } from '@/apps/admin/stores/session'
import { CHAT_URL } from '@/shared/config/app-links'

const route = useRoute()
const router = useRouter()
const admin = useAdminSessionStore()

const MENU = [
  { name: 'admin-documents', label: '文档管理' },
  { name: 'admin-indexes', label: '索引版本' },
  { name: 'admin-eval', label: '回归测试' },
  { name: 'admin-settings', label: '参数设置' },
] as const

const menuOptions: MenuOption[] = MENU.map((m) => ({
  key: m.name,
  label: () => h(RouterLink, { to: { name: m.name } }, { default: () => m.label }),
}))

const activeKey = computed(() => String(route.name))

async function logout() {
  await authApi.logout().catch(() => undefined)
  admin.clear()
  await router.push({ name: 'admin-login' })
}
</script>

<template>
  <n-layout has-sider class="h-full">
    <n-layout-sider bordered :width="200" content-class="flex h-full flex-col">
      <div class="flex items-center gap-2 px-5 py-5">
        <i-ri-settings-4-line class="text-xl text-primary" />
        <span class="font-semibold">知识库后台</span>
      </div>
      <n-menu :value="activeKey" :options="menuOptions" />
      <div class="mt-auto flex flex-col gap-2 p-4">
        <n-button block secondary tag="a" :href="CHAT_URL">
          <template #icon><i-ri-chat-3-line /></template>
          返回问答
        </n-button>
        <n-button block quaternary @click="logout">退出登录</n-button>
      </div>
    </n-layout-sider>
    <n-layout-content content-class="p-6" :native-scrollbar="false">
      <RouterView />
    </n-layout-content>
  </n-layout>
</template>
