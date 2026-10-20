<script setup lang="ts">
import { darkTheme, dateZhCN, useOsTheme, zhCN } from 'naive-ui'
import { computed, watchEffect } from 'vue'

import { naiveThemeOverrides } from '@/theme/naive'

const osTheme = useOsTheme()
const isDark = computed(() => osTheme.value === 'dark')
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

watchEffect(() => document.documentElement.classList.toggle('dark', isDark.value))
</script>

<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="naiveThemeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
    class="h-full"
  >
    <n-message-provider>
      <n-dialog-provider>
        <RouterView />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
