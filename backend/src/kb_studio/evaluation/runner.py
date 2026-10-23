import re

from kb_studio.db import eval_repo
from kb_studio.query import service

REFUSAL_MARK = "没有找到"


def _normalize(text: str) -> str:
    # 去掉空白和 Markdown 标记再比较，避免“**5** 天”和“5天”这类排版差异导致误判
    return re.sub(r"[\s*_`~#]+", "", text)


def judge(answer: str, expected_keywords: list[str], should_refuse: bool) -> bool:
    normalized = _normalize(answer)
    if should_refuse:
        return REFUSAL_MARK in normalized
    return REFUSAL_MARK not in normalized and all(_normalize(k) in normalized for k in expected_keywords)


def run_eval(index: dict) -> dict:
    # 与线上问答走同一条查询链路，评估结果才能代表真实效果
    results = []
    for case in eval_repo.list_cases():
        hits = service.search(index, case["question"])
        answer = service.answer(case["question"], hits)
        results.append(
            {
                "case_id": case["id"],
                "question": case["question"],
                "expected_keywords": case["expected_keywords"],
                "should_refuse": case["should_refuse"],
                "answer": answer,
                "passed": judge(answer, case["expected_keywords"], case["should_refuse"]),
                "sources": service.to_sources(hits),
            }
        )
    passed = sum(r["passed"] for r in results)
    return {
        "index_id": index["id"],
        "pass_rate": round(passed / len(results), 3) if results else None,
        "passed": passed,
        "total": len(results),
        "results": results,
    }
