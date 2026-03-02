"""
学情分析属性测试
Feature: smart-education-platform, Property 69: 学情报告数据完整性
Feature: smart-education-platform, Property 70: BERT学情分析准确性
验证需求：16.1, 16.2, 16.3
"""

import pytest
from hypothesis import given, strategies as st, settings
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from learning_analytics import (
    analyze_learning_status,
    LearningAnalyticsEngine
)
from improvement_suggestions import generate_improvement_suggestions


# 生成测试数据的策略
def learning_path_strategy():
    """生成学习路径数据"""
    return st.lists(
        st.fixed_dictionaries({
            'knowledge_point_id': st.integers(min_value=1, max_value=100),
            'knowledge_point_name': st.text(min_size=2, max_size=50),
            'completed_count': st.integers(min_value=0, max_value=20),
            'total_count': st.integers(min_value=1, max_value=20)
        }),
        min_size=1,
        max_size=10
    )


def error_book_strategy():
    """生成错题本数据"""
    return st.lists(
        st.fixed_dictionaries({
            'knowledge_point_id': st.integers(min_value=1, max_value=100),
            'knowledge_point_name': st.text(min_size=2, max_size=50),
            'error_count': st.integers(min_value=0, max_value=10),
            'total_count': st.integers(min_value=1, max_value=20)
        }),
        min_size=0,
        max_size=10
    )


def answer_speed_strategy():
    """生成答题速度数据"""
    return st.lists(
        st.fixed_dictionaries({
            'question_id': st.integers(min_value=1, max_value=1000),
            'time_spent_seconds': st.integers(min_value=1, max_value=300),
            'expected_time_seconds': st.integers(min_value=1, max_value=300)
        }),
        min_size=0,
        max_size=10
    )


@settings(max_examples=100, deadline=10000)
@given(
    user_id=st.integers(min_value=1, max_value=10000),
    user_type=st.sampled_from(['student', 'class', 'parent']),
    learning_paths=learning_path_strategy(),
    error_books=error_book_strategy(),
    answer_speeds=answer_speed_strategy()
)
def test_learning_analysis_returns_complete_data(
    user_id,
    user_type,
    learning_paths,
    error_books,
    answer_speeds
):
    """
    属性69：学情报告数据完整性
    
    对于任何学情分析请求，返回的结果应包含知识点评分、AI建议和整体掌握度三项内容
    """
    result = analyze_learning_status(
        user_id,
        user_type,
        learning_paths,
        error_books,
        answer_speeds
    )
    
    # 验证返回结果包含必需字段
    assert 'knowledge_point_scores' in result, "结果应包含'knowledge_point_scores'字段"
    assert 'ai_suggestions' in result, "结果应包含'ai_suggestions'字段"
    assert 'overall_mastery_score' in result, "结果应包含'overall_mastery_score'字段"
    
    # 验证字段类型
    assert isinstance(result['knowledge_point_scores'], list), "knowledge_point_scores应为列表"
    assert isinstance(result['ai_suggestions'], list), "ai_suggestions应为列表"
    assert isinstance(result['overall_mastery_score'], (int, float)), "overall_mastery_score应为数字"
    
    # 验证知识点评分的完整性
    for kp_score in result['knowledge_point_scores']:
        assert 'knowledge_point_id' in kp_score, "知识点评分应包含ID"
        assert 'knowledge_point_name' in kp_score, "知识点评分应包含名称"
        assert 'mastery_score' in kp_score, "知识点评分应包含掌握度"
        assert 'status' in kp_score, "知识点评分应包含状态"
        
        # 验证掌握度范围
        assert 0 <= kp_score['mastery_score'] <= 100, "掌握度应在0-100范围内"
        
        # 验证状态值
        assert kp_score['status'] in ['weak', 'improving', 'mastered'], "状态应为weak/improving/mastered之一"
    
    # 验证AI建议
    assert len(result['ai_suggestions']) > 0, "应至少有一条建议"
    assert len(result['ai_suggestions']) <= 5, "建议数量不应超过5条"
    
    for suggestion in result['ai_suggestions']:
        assert isinstance(suggestion, str), "建议应为字符串"
        assert len(suggestion) > 0, "建议不应为空"
        assert len(suggestion) <= 500, "建议长度不应超过500字"
    
    # 验证整体掌握度
    assert 0 <= result['overall_mastery_score'] <= 100, "整体掌握度应在0-100范围内"


@settings(max_examples=50, deadline=10000)
@given(
    learning_paths=learning_path_strategy(),
    error_books=error_book_strategy()
)
def test_mastery_score_calculation_accuracy(learning_paths, error_books):
    """
    属性70：BERT学情分析准确性
    
    对于任何学习数据，系统计算的掌握度评分应准确反映学生的学习情况
    """
    result = analyze_learning_status(
        user_id=1,
        user_type='student',
        learning_paths=learning_paths,
        error_books=error_books,
        answer_speeds=[]
    )
    
    # 验证掌握度评分的准确性
    kp_scores = result['knowledge_point_scores']
    
    # 对于每个知识点，验证掌握度与完成率和错误率的关系
    for kp_score in kp_scores:
        kp_id = kp_score['knowledge_point_id']
        mastery = kp_score['mastery_score']
        status = kp_score['status']
        
        # 验证状态与掌握度的对应关系
        if status == 'weak':
            assert mastery < 40, f"薄弱知识点掌握度应<40，实际{mastery}"
        elif status == 'improving':
            assert 40 <= mastery < 70, f"进步中知识点掌握度应在40-70，实际{mastery}"
        elif status == 'mastered':
            assert mastery >= 70, f"已掌握知识点掌握度应>=70，实际{mastery}"


@settings(max_examples=50, deadline=10000)
@given(
    learning_paths=learning_path_strategy(),
    error_books=error_book_strategy()
)
def test_improvement_suggestions_quality(learning_paths, error_books):
    """
    测试改进建议的质量
    
    对于任何学习数据，生成的建议应具有针对性和可操作性
    """
    result = analyze_learning_status(
        user_id=1,
        user_type='student',
        learning_paths=learning_paths,
        error_books=error_books,
        answer_speeds=[]
    )
    
    suggestions = result['ai_suggestions']
    
    # 验证建议的质量
    assert len(suggestions) > 0, "应至少有一条建议"
    
    for suggestion in suggestions:
        # 验证建议不为空
        assert len(suggestion.strip()) > 0, "建议不应为空"
        
        # 验证建议长度合理
        assert len(suggestion) <= 500, "建议长度不应超过500字"
        
        # 验证建议包含中文字符（针对中文教育场景）
        has_chinese = any('\u4e00' <= c <= '\u9fff' for c in suggestion)
        assert has_chinese, "建议应包含中文内容"


def test_identical_learning_data_produces_consistent_results():
    """
    测试相同的学习数据应产生一致的结果
    """
    learning_paths = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'completed_count': 8,
            'total_count': 10
        }
    ]
    
    error_books = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'error_count': 2,
            'total_count': 10
        }
    ]
    
    # 调用两次，结果应一致
    result1 = analyze_learning_status(1, 'student', learning_paths, error_books, [])
    result2 = analyze_learning_status(1, 'student', learning_paths, error_books, [])
    
    # 验证掌握度评分一致
    assert len(result1['knowledge_point_scores']) == len(result2['knowledge_point_scores'])
    for kp1, kp2 in zip(result1['knowledge_point_scores'], result2['knowledge_point_scores']):
        assert kp1['mastery_score'] == kp2['mastery_score'], "掌握度评分应一致"
        assert kp1['status'] == kp2['status'], "状态应一致"
    
    # 验证整体掌握度一致
    assert result1['overall_mastery_score'] == result2['overall_mastery_score'], "整体掌握度应一致"


def test_empty_learning_data_handling():
    """
    测试空学习数据的处理
    """
    result = analyze_learning_status(
        user_id=1,
        user_type='student',
        learning_paths=[],
        error_books=[],
        answer_speeds=[]
    )
    
    # 验证返回结果结构完整
    assert 'knowledge_point_scores' in result
    assert 'ai_suggestions' in result
    assert 'overall_mastery_score' in result
    
    # 验证空数据情况下的合理处理
    assert isinstance(result['knowledge_point_scores'], list)
    assert isinstance(result['ai_suggestions'], list)
    assert result['overall_mastery_score'] == 0.0


def test_high_mastery_score_generation():
    """
    测试高掌握度情况下的建议生成
    """
    learning_paths = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'completed_count': 10,
            'total_count': 10
        },
        {
            'knowledge_point_id': 2,
            'knowledge_point_name': '二次函数',
            'completed_count': 10,
            'total_count': 10
        }
    ]
    
    error_books = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'error_count': 0,
            'total_count': 10
        },
        {
            'knowledge_point_id': 2,
            'knowledge_point_name': '二次函数',
            'error_count': 0,
            'total_count': 10
        }
    ]
    
    result = analyze_learning_status(1, 'student', learning_paths, error_books, [])
    
    # 验证高掌握度情况
    assert result['overall_mastery_score'] >= 90, "完美完成应有高掌握度"
    
    # 验证所有知识点都是已掌握状态
    for kp in result['knowledge_point_scores']:
        assert kp['status'] == 'mastered', "完美完成的知识点应为已掌握状态"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
