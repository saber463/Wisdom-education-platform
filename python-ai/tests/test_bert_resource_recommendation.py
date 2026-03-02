"""
BERT资源推荐模块测试
Feature: smart-education-platform, Property 78: 推荐算法准确性
验证需求：19.2, 19.5
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from recommendation import (
    recommend_exercises_with_bert,
    calculate_bert_recommendation_score,
    get_student_level,
    RecommendationFeedbackLearner,
    process_recommendation_feedback,
    get_recommendation_model_status
)


@settings(max_examples=100, deadline=5000)
@given(
    student_id=st.integers(min_value=1, max_value=1000),
    weak_point_ids=st.lists(st.integers(min_value=1, max_value=100), min_size=1, max_size=10),
    count=st.integers(min_value=5, max_value=10)
)
def test_bert_recommend_exercises_accuracy(student_id, weak_point_ids, count):
    """
    属性78：推荐算法准确性
    
    对于任何薄弱知识点，系统从题库筛选的练习题应与该知识点相关，且难度适中
    推荐准确率≥90%（需求19.5）
    """
    # 使用BERT模型进行推荐
    recommended = recommend_exercises_with_bert(student_id, weak_point_ids, count)
    
    # 验证返回结果是列表
    assert isinstance(recommended, list), "推荐结果应为列表"
    
    # 验证推荐数量在合理范围内
    assert len(recommended) <= count, f"推荐题目数量不应超过{count}"
    
    # 验证每道题都包含必需字段
    for exercise in recommended:
        assert 'id' in exercise, "练习题应包含'id'字段"
        assert 'title' in exercise, "练习题应包含'title'字段"
        assert 'difficulty' in exercise, "练习题应包含'difficulty'字段"
        assert 'knowledge_point_id' in exercise, "练习题应包含'knowledge_point_id'字段"
        
        # 验证难度值有效
        assert exercise['difficulty'] in ['basic', 'medium', 'advanced'], \
            "难度应为basic、medium或advanced之一"
    
    # 验证推荐准确率≥90%
    # 计算与薄弱知识点相关的题目比例
    if len(recommended) > 0:
        relevant_count = sum(
            1 for ex in recommended
            if ex['knowledge_point_id'] in weak_point_ids
        )
        accuracy = relevant_count / len(recommended)
        assert accuracy >= 0.9, f"推荐准确率应≥90%，实际为{accuracy:.2%}"


def test_bert_recommendation_score_calculation():
    """
    测试BERT推荐分数计算
    """
    exercise = {
        'id': 1,
        'title': '测试题目',
        'content': '这是一道测试题',
        'knowledge_point_id': 5,
        'difficulty': 'medium',
        'usage_count': 15
    }
    weak_point_ids = [5, 6, 7]
    student_history = {'done_exercises': [2, 3, 4]}
    
    score = calculate_bert_recommendation_score(
        exercise,
        weak_point_ids,
        student_history
    )
    
    # 验证分数在0-1范围内
    assert 0.0 <= score <= 1.0, "推荐分数应在0-1范围内"
    assert isinstance(score, float), "推荐分数应为浮点数"


def test_recommendation_feedback_learner():
    """
    测试推荐反馈学习器（需求19.4）
    """
    learner = RecommendationFeedbackLearner()
    
    # 添加反馈
    success1 = learner.add_feedback(1, 10, 'interested', 5)
    assert success1, "应成功添加反馈"
    
    success2 = learner.add_feedback(1, 11, 'not_interested', 2)
    assert success2, "应成功添加反馈"
    
    # 获取反馈统计
    stats = learner.get_feedback_statistics()
    assert stats['total_feedback'] == 2, "应有2条反馈"
    assert stats['interested_count'] == 1, "应有1条感兴趣反馈"
    assert stats['not_interested_count'] == 1, "应有1条不感兴趣反馈"
    assert stats['average_rating'] == 3.5, "平均评分应为3.5"


def test_process_recommendation_feedback():
    """
    测试处理推荐反馈
    """
    # 处理反馈
    success = process_recommendation_feedback(1, 10, 'interested', 5)
    assert success, "应成功处理反馈"
    
    success = process_recommendation_feedback(1, 11, 'not_interested', 2)
    assert success, "应成功处理反馈"


def test_get_recommendation_model_status():
    """
    测试获取推荐模型状态
    """
    status = get_recommendation_model_status()
    
    assert 'bert_available' in status, "状态应包含bert_available字段"
    assert 'model_path' in status, "状态应包含model_path字段"
    assert 'feedback_learner_status' in status, "状态应包含feedback_learner_status字段"
    
    # 验证反馈学习器状态
    learner_status = status['feedback_learner_status']
    assert 'model_available' in learner_status, "学习器状态应包含model_available字段"
    assert 'feedback_buffer_size' in learner_status, "学习器状态应包含feedback_buffer_size字段"
    assert 'feedback_statistics' in learner_status, "学习器状态应包含feedback_statistics字段"


def test_bert_recommend_with_empty_weak_points():
    """
    测试没有薄弱知识点时的推荐
    """
    recommended = recommend_exercises_with_bert(1, [], 5)
    
    # 即使没有薄弱知识点，也应该返回推荐结果
    assert isinstance(recommended, list)


def test_bert_recommend_returns_unique_exercises():
    """
    测试推荐的练习题不重复
    """
    weak_point_ids = [1, 2, 3]
    recommended = recommend_exercises_with_bert(1, weak_point_ids, 10)
    
    # 验证没有重复的题目
    exercise_ids = [ex['id'] for ex in recommended]
    assert len(exercise_ids) == len(set(exercise_ids)), "推荐的题目不应重复"


def test_bert_recommend_respects_count_limit():
    """
    测试推荐数量限制
    """
    weak_point_ids = [1, 2, 3]
    count = 5
    
    recommended = recommend_exercises_with_bert(1, weak_point_ids, count)
    
    # 推荐数量不应超过指定数量
    assert len(recommended) <= count


def test_bert_recommend_with_student_history():
    """
    测试考虑学生历史记录的推荐
    """
    weak_point_ids = [1, 2, 3]
    student_history = {'done_exercises': [1, 2, 3, 4, 5]}
    
    recommended = recommend_exercises_with_bert(
        1,
        weak_point_ids,
        10,
        student_history=student_history
    )
    
    # 验证返回结果
    assert isinstance(recommended, list)


def test_feedback_learner_model_update():
    """
    测试反馈学习器模型更新
    """
    learner = RecommendationFeedbackLearner()
    learner.feedback_threshold = 2  # 设置较低的阈值以便测试
    
    # 添加反馈直到触发模型更新
    learner.add_feedback(1, 10, 'interested', 5)
    assert len(learner.feedback_buffer) == 1
    
    learner.add_feedback(1, 11, 'interested', 4)
    # 如果BERT模型可用，模型更新后反馈缓冲应被清空
    # 如果BERT模型不可用，反馈缓冲保持不变
    if learner.model_available:
        assert len(learner.feedback_buffer) == 0
    else:
        # 当模型不可用时，反馈仍然被记录但不会触发更新
        assert len(learner.feedback_buffer) == 2


def test_feedback_learner_performance_metrics():
    """
    测试反馈学习器性能指标
    """
    learner = RecommendationFeedbackLearner()
    
    # 添加多条反馈
    for i in range(5):
        learner.add_feedback(1, 10 + i, 'interested', 5)
    
    # 获取性能指标
    performance = learner.get_model_performance()
    
    assert 'model_available' in performance
    assert 'feedback_buffer_size' in performance
    assert 'feedback_statistics' in performance
    assert 'model_path' in performance
    
    # 验证反馈缓冲大小
    assert performance['feedback_buffer_size'] == 5


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
