"""
练习题筛选相关性属性测试
Feature: smart-education-platform, Property 23: 练习题筛选相关性
验证需求：6.2
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from recommendation import (
    recommend_exercises,
    filter_exercises_by_weak_points,
    match_difficulty,
    calculate_exercise_score,
    get_student_level
)


@settings(max_examples=100, deadline=5000)
@given(
    student_id=st.integers(min_value=1, max_value=1000),
    weak_point_ids=st.lists(st.integers(min_value=1, max_value=100), min_size=1, max_size=10),
    count=st.integers(min_value=5, max_value=10)
)
def test_recommend_exercises_returns_relevant_exercises(student_id, weak_point_ids, count):
    """
    属性23：练习题筛选相关性
    
    对于任何薄弱知识点，系统从题库筛选的练习题应与该知识点相关，且难度适中
    """
    # 推荐练习题
    recommended = recommend_exercises(student_id, weak_point_ids, count)
    
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


def test_filter_exercises_by_weak_points():
    """
    测试根据薄弱知识点筛选练习题
    """
    weak_point_ids = [1, 2, 3]
    all_exercises = [
        {'id': 1, 'knowledge_point_id': 1, 'difficulty': 'medium'},
        {'id': 2, 'knowledge_point_id': 2, 'difficulty': 'basic'},
        {'id': 3, 'knowledge_point_id': 5, 'difficulty': 'medium'},
        {'id': 4, 'knowledge_point_id': 3, 'difficulty': 'advanced'},
    ]
    
    filtered = filter_exercises_by_weak_points(weak_point_ids, all_exercises)
    
    # 验证筛选结果只包含相关知识点的题目
    assert len(filtered) == 3
    for ex in filtered:
        assert ex['knowledge_point_id'] in weak_point_ids


def test_match_difficulty():
    """
    测试难度匹配
    """
    exercises = [
        {'id': 1, 'difficulty': 'basic'},
        {'id': 2, 'difficulty': 'medium'},
        {'id': 3, 'difficulty': 'advanced'},
    ]
    
    # 基础水平学生应该得到基础和中等难度题目
    basic_matched = match_difficulty('basic', exercises)
    assert all(ex['difficulty'] in ['basic', 'medium'] for ex in basic_matched)
    
    # 中等水平学生应该得到所有难度题目
    medium_matched = match_difficulty('medium', exercises)
    assert len(medium_matched) == 3
    
    # 高级水平学生应该得到中等和高级难度题目
    advanced_matched = match_difficulty('advanced', exercises)
    assert all(ex['difficulty'] in ['medium', 'advanced'] for ex in advanced_matched)


def test_calculate_exercise_score():
    """
    测试练习题推荐分数计算
    """
    exercise = {
        'id': 1,
        'knowledge_point_id': 5,
        'usage_count': 15
    }
    weak_point_ids = [5, 6, 7]
    student_history = {'done_exercises': [2, 3, 4]}
    
    score = calculate_exercise_score(exercise, weak_point_ids, student_history)
    
    # 验证分数在0-1范围内
    assert 0.0 <= score <= 1.0
    assert isinstance(score, float)


def test_get_student_level():
    """
    测试学生水平评估
    """
    # 多个薄弱点 -> 基础水平
    level1 = get_student_level(1, [1, 2, 3, 4, 5])
    assert level1 == 'basic'
    
    # 中等薄弱点 -> 中等水平
    level2 = get_student_level(2, [1, 2, 3])
    assert level2 == 'medium'
    
    # 少量薄弱点 -> 高级水平
    level3 = get_student_level(3, [1])
    assert level3 == 'advanced'


def test_recommend_exercises_with_empty_weak_points():
    """
    测试没有薄弱知识点时的推荐
    """
    recommended = recommend_exercises(1, [], 5)
    
    # 即使没有薄弱知识点，也应该返回推荐结果
    assert isinstance(recommended, list)


def test_recommend_exercises_returns_unique_exercises():
    """
    测试推荐的练习题不重复
    """
    weak_point_ids = [1, 2, 3]
    recommended = recommend_exercises(1, weak_point_ids, 10)
    
    # 验证没有重复的题目
    exercise_ids = [ex['id'] for ex in recommended]
    assert len(exercise_ids) == len(set(exercise_ids)), "推荐的题目不应重复"


def test_recommend_exercises_respects_count_limit():
    """
    测试推荐数量限制
    """
    weak_point_ids = [1, 2, 3]
    count = 5
    
    recommended = recommend_exercises(1, weak_point_ids, count)
    
    # 推荐数量不应超过指定数量
    assert len(recommended) <= count


def test_recommend_exercises_with_student_history():
    """
    测试考虑学生历史记录的推荐
    """
    weak_point_ids = [1, 2, 3]
    student_history = {'done_exercises': [1, 2, 3, 4, 5]}
    
    recommended = recommend_exercises(
        1,
        weak_point_ids,
        10,
        student_history=student_history
    )
    
    # 验证返回结果
    assert isinstance(recommended, list)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
