import { useSessionStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

// token 存 sessionStorage：关闭浏览器标签页即失效，后端重启后也需要重新登录
export const useAdminSessionStore = defineStore('admin-session', () => {
  const token = useSessionStorage<string>('kb-studio-admin-token', '')
  const isLoggedIn = computed(() => token.value !== '')

  function setToken(value: string) {
    token.value = value
  }

  function clear() {
    token.value = ''
  }

  return { token, isLoggedIn, setToken, clear }
})
