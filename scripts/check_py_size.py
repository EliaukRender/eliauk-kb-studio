"""检查 Python 单文件行数上限（不计空行和注释），与前端 ESLint max-lines 保持一致。"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "backend"
LIMITS = {"src": 250, "tests": 400}


def effective_lines(path: Path) -> int:
    return sum(
        1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip() and not line.strip().startswith("#")
    )


def main() -> int:
    violations = []
    for folder, limit in LIMITS.items():
        for path in (ROOT / folder).rglob("*.py"):
            count = effective_lines(path)
            if count > limit:
                violations.append(f"{path.relative_to(ROOT)}: {count} 行，超过上限 {limit}")
    for v in violations:
        print(v)
    if violations:
        print("按职责拆分模块，不要通过压缩格式规避，见 docs/开发规范.md「模块化」")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
