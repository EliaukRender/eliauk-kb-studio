/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// 后端固定监听 127.0.0.1:8765，见 backend/src/kb_studio/settings.py
const BACKEND_URL = 'http://127.0.0.1:8765'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      dts: 'src/types/components.d.ts',
      // 图标组件用法：<i-ri-send-plane-fill />，构建期内联 SVG，离线可用
      resolvers: [NaiveUiResolver(), IconsResolver({ prefix: 'i', enabledCollections: ['ri'] })],
    }),
    Icons({ compiler: 'vue3', autoInstall: false }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: { '/api': BACKEND_URL },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
})
