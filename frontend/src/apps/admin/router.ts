import { createRouter, createWebHashHistory } from 'vue-router'

import { useAdminSessionStore } from '@/apps/admin/stores/session'

// hash 模式：后端只托管入口页，刷新任意页面都不会 404
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'admin-login', component: () => import('./views/LoginView.vue') },
    {
      path: '/',
      component: () => import('./views/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      redirect: { name: 'admin-documents' },
      children: [
        {
          path: 'documents',
          name: 'admin-documents',
          component: () => import('./views/documents/DocumentsView.vue'),
        },
        {
          path: 'documents/upload',
          name: 'admin-upload',
          component: () => import('./views/upload/UploadView.vue'),
        },
        {
          path: 'indexes',
          name: 'admin-indexes',
          component: () => import('./views/indexes/IndexesView.vue'),
        },
        { path: 'eval', name: 'admin-eval', component: () => import('./views/eval/EvalView.vue') },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('./views/settings/SettingsView.vue'),
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const session = useAdminSessionStore()
  if (to.matched.some((r) => r.meta.requiresAdmin) && !session.isLoggedIn) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'admin-login' && session.isLoggedIn) return { name: 'admin-documents' }
})
