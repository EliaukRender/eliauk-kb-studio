<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { authApi } from '@/api/admin'
import { useAdminStore } from '@/stores/admin'
import { errorMessage } from '@/utils/format'

const show = defineModel<boolean>('show', { required: true })

const admin = useAdminStore()
const router = useRouter()
const message = useMessage()

/** null 表示还没查到后端状态，此时不渲染表单，避免先闪出登录表单再切换成设置密码 */
const initialized = ref<boolean | null>(null)
const password = ref('')
const confirm = ref('')
const submitting = ref(false)

const title = computed(() => {
  if (initialized.value === null) return '管理后台'
  return initialized.value ? '管理员登录' : '首次进入：设置管理员密码'
})

watch(show, async (visible) => {
  if (!visible) return
  password.value = ''
  confirm.value = ''
  initialized.value = null
  try {
    initialized.value = (await authApi.status()).initialized
  } catch (e) {
    message.error(errorMessage(e))
    show.value = false
  }
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
    admin.setToken(token)
    show.value = false
    await router.push({ name: 'admin-documents' })
  } catch (e) {
    message.error(errorMessage(e))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <n-modal v-model:show="show" preset="card" :title="title" class="max-w-sm" :mask-closable="false">
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
  </n-modal>
</template>
