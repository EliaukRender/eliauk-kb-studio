<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { fetchStatus } from '@/api/chat'
import AdminLoginModal from '@/components/admin/AdminLoginModal.vue'
import { useChatStream } from '@/composables/useChatStream'
import { useSecretEntry } from '@/composables/useSecretEntry'
import { useAdminStore } from '@/stores/admin'
import type { AppStatus } from '@/types/api'

import ChatInput from './components/ChatInput.vue'
import ChatMessageItem from './components/ChatMessageItem.vue'

const router = useRouter()
const admin = useAdminStore()
const { messages, loading, send, stop, clear } = useChatStream()

const status = ref<AppStatus>()
const showLogin = ref(false)
const listRef = ref<HTMLElement>()

// 已登录时直接进后台，不用每次都输密码
const { handleLogoClick, interceptCommand } = useSecretEntry(() => {
  if (admin.isLoggedIn) void router.push({ name: 'admin-documents' })
  else showLogin.value = true
})

function onSubmit(text: string) {
  if (interceptCommand(text)) return
  void send(text)
}

watch(
  () => messages.value.at(-1)?.content,
  async () => {
    await nextTick()
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight })
  },
)

onMounted(async () => {
  status.value = await fetchStatus()
})
</script>

<template>
  <div class="mx-auto flex h-full max-w-3xl flex-col px-4">
    <header class="flex items-center justify-between py-4">
      <div class="flex cursor-default items-center gap-2 select-none" @click="handleLogoClick">
        <i-ri-book-open-line class="text-2xl text-primary" />
        <span class="text-lg font-semibold">KB Studio</span>
      </div>
      <div class="flex items-center gap-3 text-xs text-muted">
        <span v-if="status">
          {{
            status.has_index
              ? `${status.document_count} 篇文档 · ${status.current_index}`
              : '知识库为空'
          }}
        </span>
        <n-button v-if="messages.length" size="tiny" quaternary @click="clear">清空对话</n-button>
      </div>
    </header>

    <main ref="listRef" class="flex-1 overflow-y-auto pb-4">
      <div
        v-if="!messages.length"
        class="flex h-full flex-col items-center justify-center text-muted"
      >
        <i-ri-chat-smile-2-line class="mb-3 text-5xl" />
        <p>基于本地知识库回答问题，答案会标注来源</p>
      </div>
      <div v-else class="flex flex-col gap-4">
        <ChatMessageItem v-for="m in messages" :key="m.id" :message="m" />
      </div>
    </main>

    <footer class="pb-4">
      <ChatInput :loading="loading" @submit="onSubmit" @stop="stop" />
    </footer>

    <AdminLoginModal v-model:show="showLogin" />
  </div>
</template>
