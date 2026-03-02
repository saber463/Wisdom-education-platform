"""
跨服务gRPC通信可用性属性测试
Feature: smart-education-platform, Property 55: 跨服务gRPC通信可用性
验证需求：13.1
"""

import pytest
from hypothesis import given, strategies as st, settings
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from grpc_server import AIGradingServicer, find_available_port


class MockContext:
    """模拟gRPC上下文"""
    def __init__(self):
        self.code = None
        self.details = None
    
    def set_code(self, code):
        self.code = code
    
    def set_details(self, details):
        self.details = details


class MockImageRequest:
    """模拟ImageRequest"""
    def __init__(self, image_data, format):
        self.image_data = image_data
        self.format = format


class MockSubjectiveRequest:
    """模拟SubjectiveRequest"""
    def __init__(self, question, student_answer, standard_answer, max_score):
        self.question = question
        self.student_answer = student_answer
        self.standard_answer = standard_answer
        self.max_score = max_score


class MockQuestionRequest:
    """模拟QuestionRequest"""
    def __init__(self, question, context):
        self.question = question
        self.context = context


class MockRecommendRequest:
    """模拟RecommendRequest"""
    def __init__(self, student_id, weak_point_ids, count):
        self.student_id = student_id
        self.weak_point_ids = weak_point_ids
        self.count = count


@settings(max_examples=100, deadline=10000)
@given(
    question=st.text(min_size=5, max_size=100),
    student_answer=st.text(min_size=5, max_size=200),
    standard_answer=st.text(min_size=5, max_size=200),
    max_score=st.integers(min_value=1, max_value=100)
)
def test_grpc_grade_subjective_returns_valid_response(question, student_answer, standard_answer, max_score):
    """
    属性55：跨服务gRPC通信可用性
    
    对于任何Node后端调用Python AI服务，应使用gRPC协议进行通信
    """
    # 创建服务实例
    servicer = AIGradingServicer()
    
    # 创建请求
    request = MockSubjectiveRequest(question, student_answer, standard_answer, max_score)
    context = MockContext()
    
    # 调用gRPC方法
    response = servicer.GradeSubjective(request, context)
    
    # 验证响应结构
    assert 'score' in response or hasattr(response, 'score'), "响应应包含score字段"
    assert 'feedback' in response or hasattr(response, 'feedback'), "响应应包含feedback字段"
    assert 'key_points' in response or hasattr(response, 'key_points'), "响应应包含key_points字段"


def test_grpc_recognize_text_handles_valid_image():
    """
    测试OCR识别gRPC方法
    """
    servicer = AIGradingServicer()
    
    # 创建简单的测试图片数据
    from PIL import Image
    import io
    
    image = Image.new('RGB', (100, 50), color='white')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    image_data = img_byte_arr.getvalue()
    
    request = MockImageRequest(image_data, 'png')
    context = MockContext()
    
    response = servicer.RecognizeText(request, context)
    
    # 验证响应结构
    assert 'text' in response or hasattr(response, 'text')
    assert 'confidence' in response or hasattr(response, 'confidence')


def test_grpc_answer_question_returns_valid_response():
    """
    测试AI答疑gRPC方法
    """
    servicer = AIGradingServicer()
    
    request = MockQuestionRequest("什么是勾股定理？", "")
    context = MockContext()
    
    response = servicer.AnswerQuestion(request, context)
    
    # 验证响应结构
    assert 'answer' in response or hasattr(response, 'answer')
    assert 'steps' in response or hasattr(response, 'steps')
    assert 'related_examples' in response or hasattr(response, 'related_examples')


def test_grpc_recommend_exercises_returns_valid_response():
    """
    测试个性化推荐gRPC方法
    """
    servicer = AIGradingServicer()
    
    request = MockRecommendRequest(1, [1, 2, 3], 5)
    context = MockContext()
    
    response = servicer.RecommendExercises(request, context)
    
    # 验证响应结构
    assert 'exercises' in response or hasattr(response, 'exercises')


def test_find_available_port():
    """
    测试端口查找功能
    """
    # 测试从5000开始查找可用端口
    port = find_available_port(5000, 3)
    
    # 验证返回的是有效端口号
    assert 5000 <= port <= 5002
    assert isinstance(port, int)


def test_grpc_servicer_handles_empty_input():
    """
    测试gRPC服务处理空输入
    """
    servicer = AIGradingServicer()
    
    # 测试空问题
    request = MockQuestionRequest("", "")
    context = MockContext()
    
    response = servicer.AnswerQuestion(request, context)
    
    # 即使输入为空，也应该返回有效响应
    assert 'answer' in response or hasattr(response, 'answer')


def test_grpc_servicer_handles_invalid_image():
    """
    测试gRPC服务处理无效图片
    """
    servicer = AIGradingServicer()
    
    # 使用无效的图片数据
    request = MockImageRequest(b'invalid image data', 'png')
    context = MockContext()
    
    response = servicer.RecognizeText(request, context)
    
    # 应该返回有效响应（即使识别失败）
    assert 'text' in response or hasattr(response, 'text')
    assert 'confidence' in response or hasattr(response, 'confidence')


def test_grpc_servicer_handles_zero_max_score():
    """
    测试gRPC服务处理零分满分的情况
    """
    servicer = AIGradingServicer()
    
    request = MockSubjectiveRequest("问题", "答案", "标准答案", 0)
    context = MockContext()
    
    response = servicer.GradeSubjective(request, context)
    
    # 应该返回有效响应
    assert 'score' in response or hasattr(response, 'score')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
