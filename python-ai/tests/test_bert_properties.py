"""
主观题BERT评分调用属性测试
Feature: smart-education-platform, Property 7: 主观题BERT评分调用
验证需求：2.3
"""

import pytest
from hypothesis import given, strategies as st, settings
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from bert_grading import (
    grade_subjective_answer,
    calculate_semantic_similarity,
    extract_key_points
)


@settings(max_examples=100, deadline=10000)
@given(
    question=st.text(min_size=5, max_size=100),
    student_answer=st.text(min_size=5, max_size=200),
    standard_answer=st.text(min_size=5, max_size=200),
    max_score=st.integers(min_value=1, max_value=100)
)
def test_bert_grading_returns_valid_result(question, student_answer, standard_answer, max_score):
    """
    属性7：主观题BERT评分调用
    
    对于任何包含主观题的作业，系统应调用BERT模型进行语义分析和评分
    """
    # 调用BERT评分
    result = grade_subjective_answer(question, student_answer, standard_answer, max_score)
    
    # 验证返回结果包含必需字段
    assert 'score' in result, "评分结果应包含'score'字段"
    assert 'feedback' in result, "评分结果应包含'feedback'字段"
    assert 'key_points' in result, "评分结果应包含'key_points'字段"
    
    # 验证字段类型
    assert isinstance(result['score'], int), "score字段应为整数类型"
    assert isinstance(result['feedback'], str), "feedback字段应为字符串类型"
    assert isinstance(result['key_points'], list), "key_points字段应为列表类型"
    
    # 验证分数范围
    assert 0 <= result['score'] <= max_score, f"分数应在0-{max_score}范围内"
    
    # 验证反馈不为空
    assert len(result['feedback']) > 0, "反馈不应为空"


def test_identical_answers_get_full_score():
    """
    测试相同答案应获得满分
    """
    question = "什么是光合作用？"
    answer = "光合作用是植物利用光能将二氧化碳和水转化为有机物并释放氧气的过程。"
    max_score = 10
    
    result = grade_subjective_answer(question, answer, answer, max_score)
    
    # 相同答案应该获得高分（接近满分）
    assert result['score'] >= max_score * 0.8, "相同答案应获得高分"


def test_empty_answer_gets_low_score():
    """
    测试空答案应获得低分
    """
    question = "什么是光合作用？"
    student_answer = ""
    standard_answer = "光合作用是植物利用光能将二氧化碳和水转化为有机物并释放氧气的过程。"
    max_score = 10
    
    result = grade_subjective_answer(question, student_answer, standard_answer, max_score)
    
    # 空答案应该获得低分
    assert result['score'] <= max_score * 0.3, "空答案应获得低分"


def test_semantic_similarity_range():
    """
    测试语义相似度计算返回0-1范围的值
    """
    text1 = "今天天气很好"
    text2 = "今天天气不错"
    
    similarity = calculate_semantic_similarity(text1, text2)
    
    assert 0.0 <= similarity <= 1.0, "相似度应在0-1范围内"
    assert isinstance(similarity, float), "相似度应为浮点数"


def test_extract_key_points_returns_list():
    """
    测试关键点提取返回列表
    """
    text = "第一点是这样的。第二点是那样的。第三点很重要。"
    
    key_points = extract_key_points(text)
    
    assert isinstance(key_points, list), "关键点应为列表类型"
    assert all(isinstance(point, str) for point in key_points), "所有关键点应为字符串"


def test_grading_with_chinese_text():
    """
    测试中文文本评分
    """
    question = "请解释牛顿第一定律"
    student_answer = "物体在不受外力作用时，保持静止或匀速直线运动状态。"
    standard_answer = "牛顿第一定律指出，任何物体在不受外力作用时，总保持静止状态或匀速直线运动状态。"
    max_score = 10
    
    result = grade_subjective_answer(question, student_answer, standard_answer, max_score)
    
    # 验证结果结构
    assert 'score' in result
    assert 'feedback' in result
    assert 'key_points' in result
    
    # 相似的答案应该获得较高分数
    assert result['score'] >= max_score * 0.5, "相似答案应获得较高分数"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
