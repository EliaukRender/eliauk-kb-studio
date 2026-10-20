#!/usr/bin/env bash
# 一键质量检查：提交前、结束一项开发任务前都必须通过。用法：scripts/check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }

cd "$ROOT/backend"
step "后端 · ruff 静态检查"
uv run ruff check
step "后端 · ruff 格式"
uv run ruff format --check
step "后端 · 架构边界（import-linter）"
uv run lint-imports
step "后端 · 单文件行数"
uv run python "$ROOT/scripts/check_py_size.py"
step "后端 · 单元测试"
uv run pytest -q

cd "$ROOT/frontend"
step "前端 · ESLint（含应用边界、行数上限）+ Prettier"
pnpm lint
step "前端 · 类型检查"
pnpm typecheck
step "前端 · 单元测试"
pnpm test
step "前端 · 构建（问答与管理两个入口）"
pnpm exec vite build >/dev/null

printf '\n\033[1;32m✔ 全部检查通过\033[0m\n'
