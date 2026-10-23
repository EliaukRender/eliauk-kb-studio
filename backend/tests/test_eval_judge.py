from kb_studio.evaluation.runner import judge


def test_keywords_match_ignoring_whitespace():
    assert judge("入职 3 年有5天年假。", ["5 天"], should_refuse=False)


def test_all_keywords_required():
    assert not judge("锁定 30 分钟", ["5 次", "30 分钟"], should_refuse=False)


def test_refusal_case():
    assert judge("知识库中没有找到相关信息。", [], should_refuse=True)
    assert not judge("赵磊是销售总监。", [], should_refuse=True)


def test_refusal_answer_fails_normal_case():
    assert not judge("知识库中没有找到相关信息。", ["5 天"], should_refuse=False)


def test_ignores_markdown_markup():
    assert judge("满 1 年享有 **5** 天年假", ["5天"], should_refuse=False)
    assert judge("### 年假\n- `5 天`", ["5 天"], should_refuse=False)
    assert judge("**没有找到**相关信息", [], should_refuse=True)
