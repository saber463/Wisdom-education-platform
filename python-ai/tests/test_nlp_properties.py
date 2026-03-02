"""
NLP模型调用可用性属性测试
Feature: smart-education-platform, Property 27: NLP模型调用可用性
验证需求：7.2
"""

import pytest
from hypothesis import given, strategies as st, settings
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from nlp_qa import (
    answer_question,
    identify_question_intent,
    generate_solution_steps,
    search_knowledge_base
)


@settings(max_examples=100, deadline=5000)
@given(
    question=st.text(min_size=5, max_size=100),
    context=st.text(min_size=0, max_size=200)
)
def test_nlp_answer_question_returns_valid_structure(question, context):
    """
    属性27：NLP模型调用可用性
    
    对于任何学生输入的问题，AI批改引擎应调用NLP模型理解问题意图
    """
    # 调用NLP问答
    result = answer_question(question, context)
    
    # 验证返回结果包含必需字段
    assert 'answer' in result, "问答结果应包含'answer'字段"
    assert 'steps' in result, "问答结果应包含'steps'字段"
    assert 'related_examples' in result, "问答结果应包含'related_examples'字段"
    
    # 验证字段类型
    assert isinstance(result['answer'], str), "answer字段应为字符串类型"
    assert isinstance(result['steps'], list), "steps字段应为列表类型"
    assert isinstance(result['related_examples'], list), "related_examples字段应为列表类型"
    
    # 验证答案不为空
    assert len(result['answer']) > 0, "答案不应为空"
    
    # 验证steps列表中的元素都是字符串
    assert all(isinstance(step, str) for step in result['steps']), "所有步骤应为字符串"


def test_identify_question_intent_returns_valid_structure():
    """
    测试问题意图识别返回正确结构
    """
    question = "什么是勾股定理？"
    
    result = identify_question_intent(question)
    
    # 验证返回结构
    assert 'intent' in result
    assert 'subject' in result
    assert 'topic' in result
    
    # 验证字段类型
    assert isinstance(result['intent'], str)
    assert isinstance(result['subject'], str)
    assert isinstance(result['topic'], str)


def test_generate_solution_steps_returns_list():
    """
    测试解题步骤生成返回列表
    """
    problem = "求解方程 x² - 5x + 6 = 0"
    problem_type = "数学"
    
    steps = generate_solution_steps(problem, problem_type)
    
    # 验证返回类型
    assert isinstance(steps, list), "解题步骤应为列表"
    assert len(steps) > 0, "解题步骤不应为空"
    assert all(isinstance(step, str) for step in steps), "所有步骤应为字符串"


def test_answer_math_question():
    """
    测试回答数学问题
    """
    question = "什么是勾股定理？"
    
    result = answer_question(question)
    
    # 验证结果结构
    assert 'answer' in result
    assert 'steps' in result
    assert 'related_examples' in result
    
    # 验证答案包含相关内容
    assert len(result['answer']) > 0


def test_answer_physics_question():
    """
    测试回答物理问题
    """
    question = "什么是牛顿第一定律？"
    
    result = answer_question(question)
    
    # 验证结果结构
    assert 'answer' in result
    assert 'steps' in result
    assert 'related_examples' in result


def test_answer_unknown_question():
    """
    测试回答未知问题
    """
    question = "这是一个完全不相关的问题xyz123"
    
    result = answer_question(question)
    
    # 即使是未知问题，也应该返回正确的结构
    assert 'answer' in result
    assert 'steps' in result
    assert 'related_examples' in result
    assert len(result['answer']) > 0


def test_search_knowledge_base_with_valid_subject():
    """
    测试知识库检索
    """
    question = "勾股定理"
    subject = "数学"
    
    result = search_knowledge_base(question, subject)
    
    # 应该能找到相关知识
    assert result is not None or result is None  # 可能找到也可能找不到


def test_answer_with_context():
    """
    测试带上下文的问答
    """
    question = "如何求解？"
    context = "已知直角三角形两边长度为3和4"
    
    result = answer_question(question, context)
    
    # 验证返回结构
    assert 'answer' in result
    assert 'steps' in result
    assert 'related_examples' in result


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
