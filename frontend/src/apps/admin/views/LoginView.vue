<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { authApi } from '@/apps/admin/api/admin'
import { useAdminSessionStore } from '@/apps/admin/stores/session'
import { CHAT_URL } from '@/shared/config/app-links'
import { errorMessage } from '@/shared/utils/format'

const session = useAdminSessionStore()
const router = useRouter()
const route = useRoute()
const message = useMessage()

/** null 表示还没查到后端状态，此时不渲染表单，避免先闪出登录表单再切换成设置密码 */
const initialized = ref<boolean | null>(null)
const password = ref('')
const confirm = ref('')
const submitting = ref(false)

const title = computed(() => {
  if (initialized.value === null) return '知识库后台'
  return initialized.value ? '管理员登录' : '首次进入：设置管理员密码'
})

async function submit() {
  if (!password.value || submitting.value) return
  if (!initialized.value && password.value !== confirm.value) {
    message.error('两次输入的密码不一致')
    return
  }
  submitting.value = true
  try {
    const { token } = initialized.value
      ? await authApi.login(password.value)
      : await authApi.setup(password.value)
    session.setToken(token)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
    await router.replace(redirect ?? { name: 'admin-documents' })
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    initialized.value = (await authApi.status()).initialized
  } catch (e) {
    message.error(errorMessage(e))
  }
})
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <n-card :title="title" class="max-w-sm">
      <div v-if="initialized === null" class="flex justify-center py-6"><n-spin /></div>
      <n-form v-else @submit.prevent="submit">
        <n-form-item label="密码" :show-feedback="false" class="mb-3">
          <n-input
            v-model:value="password"
            type="password"
            show-password-on="click"
            placeholder="至少 6 位"
            autofocus
            @keydown.enter="submit"
          />
        </n-form-item>
        <n-form-item v-if="!initialized" label="确认密码" :show-feedback="false" class="mb-3">
          <n-input
            v-model:value="confirm"
            type="password"
            show-password-on="click"
            @keydown.enter="submit"
          />
        </n-form-item>
        <n-button type="primary" block :loading="submitting" :disabled="!password" @click="submit">
          {{ initialized ? '进入后台' : '设置并进入' }}
        </n-button>
      </n-form>
      <template #footer>
        <a :href="CHAT_URL" class="text-xs text-muted hover:text-primary">返回问答</a>
      </template>
    </n-card>
  </div>
</template>
