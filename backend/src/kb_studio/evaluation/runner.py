import re

from kb_studio.db import eval_repo, kv_repo
from kb_studio.rag import qa
from kb_studio.rag.vectorstore import get_store

REFUSAL_MARK = "没有找到"


def _normalize(text: str) -> str:
    # 去掉空白再比较，避免“5 天”和“5天”这类排版差异导致误判
    return re.sub(r"\s+", "", text)


def judge(answer: str, expected_keywords: list[str], should_refuse: bool) -> bool:
    normalized = _normalize(answer)
    if should_refuse:
        return REFUSAL_MARK in normalized
    return REFUSAL_MARK not in normalized and all(_normalize(k) in normalized for k in expected_keywords)


def run_eval(index: dict) -> dict:
    s = kv_repo.get_runtime_settings()
    store = get_store(index)
    results = []
    for case in eval_repo.list_cases():
        hits = qa.retrieve(store, case["question"], s["top_k"], s["score_threshold"])
        answer = qa.answer(case["question"], [doc for doc, _ in hits])
        results.append({
            "case_id": case["id"],
            "question": case["question"],
            "expected_keywords": case["expected_keywords"],
            "should_refuse": case["should_refuse"],
            "answer": answer,
            "passed": judge(answer, case["expected_keywords"], case["should_refuse"]),
            "sources": [qa.to_source(doc, score) for doc, score in hits],
        })
    passed = sum(r["passed"] for r in results)
    return {
        "index_id": index["id"],
        "pass_rate": round(passed / len(results), 3) if results else None,
        "passed": passed,
        "total": len(results),
        "results": results,
    }
