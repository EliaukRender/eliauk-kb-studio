import json

from kb_studio.db.connection import get_conn

# 摘自 kb-qa-demo README 的制度类参考答案，首次启动时写入
SEED_CASES = [
    ("入职 3 年有几天年假？", ["5 天"], False),
    ("去上海出差住宿标准是多少？", ["500"], False),
    ("打车能报销吗？", ["100"], False),
    ("忘记密码怎么办？", ["sso.example.com/reset"], False),
    ("密码输错几次会被锁？", ["5 次", "30 分钟"], False),
    ("赵磊是谁？", [], True),
]


def _to_case(row) -> dict:
    case = dict(row)
    case["expected_keywords"] = json.loads(case["expected_keywords"])
    case["should_refuse"] = bool(case["should_refuse"])
    return case


def list_cases() -> list[dict]:
    with get_conn() as conn:
        return [_to_case(r) for r in conn.execute("SELECT * FROM eval_cases ORDER BY id").fetchall()]


def create(question: str, expected_keywords: list[str], should_refuse: bool) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO eval_cases (question, expected_keywords, should_refuse) VALUES (?, ?, ?)",
            (question, json.dumps(expected_keywords, ensure_ascii=False), int(should_refuse)),
        )
        return cur.lastrowid


def delete(case_id: int) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM eval_cases WHERE id = ?", (case_id,))


def seed_if_empty() -> None:
    with get_conn() as conn:
        if conn.execute("SELECT COUNT(*) FROM eval_cases").fetchone()[0]:
            return
    for question, keywords, refuse in SEED_CASES:
        create(question, keywords, refuse)
