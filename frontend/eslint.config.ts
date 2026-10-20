import js from '@eslint/js'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default defineConfigWithVueTs(
  {
    name: 'app/ignores',
    ignores: ['dist/**', 'src/components.d.ts'],
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/rules',
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: false, ignores: ['/^n-/', '/^i-/', 'component'] },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: '使用 as const 对象代替 enum' },
      ],
      // 模块化约束：单文件超过 250 行按职责拆分
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  // 应用边界：问答与管理互不引用，共享层不依赖任何应用。说明见 docs/开发规范.md「边界与分层」
  {
    name: 'boundary/no-parent-relative',
    files: ['src/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\./',
              message: '跨目录引用使用 @/ 别名，便于边界规则检查',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'boundary/chat',
    files: ['src/apps/chat/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^\\.\\./', message: '跨目录引用使用 @/ 别名，便于边界规则检查' },
            { regex: '^@/apps/admin(/|$)', message: '问答应用不能依赖管理应用，需要的能力下沉到 @/shared' },
          ],
        },
      ],
    },
  },
  {
    name: 'boundary/admin',
    files: ['src/apps/admin/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^\\.\\./', message: '跨目录引用使用 @/ 别名，便于边界规则检查' },
            { regex: '^@/apps/chat(/|$)', message: '管理应用不能依赖问答应用，需要的能力下沉到 @/shared' },
          ],
        },
      ],
    },
  },
  {
    name: 'boundary/shared',
    files: ['src/shared/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^\\.\\./', message: '跨目录引用使用 @/ 别名，便于边界规则检查' },
            { regex: '^@/apps(/|$)', message: '共享层不能依赖任何应用' },
          ],
        },
      ],
    },
  },
  {
    name: 'app/tests',
    files: ['tests/**/*.ts'],
    rules: { 'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }] },
  },
  {
    name: 'app/declarations',
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  {
    name: 'app/node-scripts',
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  skipFormatting,
)
