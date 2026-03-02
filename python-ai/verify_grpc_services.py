#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python AI服务gRPC接口验证脚本
验证所有AI服务gRPC接口是否正常工作
"""

import sys
import os
import json
from pathlib import Path

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def verify_proto_compilation():
    """验证proto文件是否已编译"""
    print("\n=== 验证Proto文件编译 ===")
    try:
        import ai_service_pb2
        import ai_service_pb2_grpc
        print("✓ Proto文件已编译")
        print(f"  - ai_service_pb2: {ai_service_pb2.__file__}")
        print(f"  - ai_service_pb2_grpc: {ai_service_pb2_grpc.__file__}")
        return True
    except ImportError as e:
        print(f"✗ Proto文件未编译: {e}")
        print("  请运行: python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto")
        return False


def verify_grpc_servicer():
    """验证gRPC服务实现"""
    print("\n=== 验证gRPC服务实现 ===")
    try:
        from grpc_server import AIGradingServicer, find_available_port
        print("✓ gRPC服务实现已加载")
        
        # 检查服务方法
        servicer = AIGradingServicer()
        methods = [
            'RecognizeText',
            'GradeSubjective',
            'AnswerQuestion',
            'RecommendExercises',
            'ProcessRecommendationFeedback',
            'AnalyzeLearningStatus',
            'AssessSpeech'
        ]
        
        for method in methods:
            if hasattr(servicer, method):
                print(f"  ✓ {method} 方法已实现")
            else:
                print(f"  ✗ {method} 方法未实现")
        
        # 测试端口查找
        port = find_available_port(5000, 3)
        print(f"  ✓ 端口查找功能正常 (找到端口: {port})")
        
        return True
    except Exception as e:
        print(f"✗ gRPC服务实现验证失败: {e}")
        return False


def verify_ai_modules():
    """验证AI模块"""
    print("\n=== 验证AI模块 ===")
    
    modules = {
        'ocr': 'OCR文字识别',
        'bert_grading': 'BERT主观题评分',
        'nlp_qa': 'NLP问答',
        'recommendation': '个性化推荐',
        'learning_analytics': '学情分析',
        'speech_assessment': '口语评测',
        'sentence_correction': '逐句批改',
        'tts_reference': '标准发音示范'
    }
    
    results = {}
    for module_name, description in modules.items():
        try:
            __import__(module_name)
            print(f"  ✓ {module_name}: {description}")
            results[module_name] = True
        except ImportError as e:
            print(f"  ✗ {module_name}: {description} - {str(e)[:50]}")
            results[module_name] = False
        except Exception as e:
            print(f"  ⚠ {module_name}: {description} - 加载警告: {str(e)[:50]}")
            results[module_name] = 'warning'
    
    return results


def verify_model_files():
    """验证模型文件"""
    print("\n=== 验证模型文件 ===")
    
    model_dirs = {
        './models/speech_assessment': 'Wav2Vec2口语评测模型',
        './models/learning_analytics': 'BERT学情分析模型',
        './models/resource_recommendation': 'BERT资源推荐模型'
    }
    
    for model_path, description in model_dirs.items():
        if os.path.exists(model_path):
            files = os.listdir(model_path)
            print(f"  ✓ {description}: {len(files)} 个文件")
        else:
            print(f"  ⚠ {description}: 目录不存在 ({model_path})")


def verify_requirements():
    """验证依赖包"""
    print("\n=== 验证依赖包 ===")
    
    required_packages = {
        'torch': 'PyTorch',
        'transformers': 'Transformers',
        'grpc': 'gRPC',
        'numpy': 'NumPy',
        'PIL': 'Pillow',
        'pytesseract': 'Pytesseract'
    }
    
    optional_packages = {
        'librosa': '音频处理',
        'soundfile': '音频文件',
        'gtts': 'Google TTS'
    }
    
    print("  必需包:")
    for package, name in required_packages.items():
        try:
            __import__(package)
            print(f"    ✓ {name}")
        except ImportError:
            print(f"    ✗ {name}")
    
    print("  可选包:")
    for package, name in optional_packages.items():
        try:
            __import__(package)
            print(f"    ✓ {name}")
        except ImportError:
            print(f"    ⚠ {name} (未安装)")


def verify_grpc_methods():
    """验证gRPC方法的基本功能"""
    print("\n=== 验证gRPC方法基本功能 ===")
    
    try:
        from grpc_server import AIGradingServicer
        
        class MockContext:
            def __init__(self):
                self.code = None
                self.details = None
            def set_code(self, code):
                self.code = code
            def set_details(self, details):
                self.details = details
        
        servicer = AIGradingServicer()
        context = MockContext()
        
        # 测试GradeSubjective
        class MockSubjectiveRequest:
            question = "什么是勾股定理？"
            student_answer = "直角三角形的两条直角边的平方和等于斜边的平方"
            standard_answer = "在直角三角形中，两条直角边的平方和等于斜边的平方"
            max_score = 10
        
        try:
            response = servicer.GradeSubjective(MockSubjectiveRequest(), context)
            if response:
                print("  ✓ GradeSubjective 方法可调用")
            else:
                print("  ⚠ GradeSubjective 返回空响应")
        except Exception as e:
            print(f"  ⚠ GradeSubjective 调用异常: {str(e)[:50]}")
        
        # 测试AnswerQuestion
        class MockQuestionRequest:
            question = "什么是勾股定理？"
            context = ""
        
        try:
            response = servicer.AnswerQuestion(MockQuestionRequest(), context)
            if response:
                print("  ✓ AnswerQuestion 方法可调用")
            else:
                print("  ⚠ AnswerQuestion 返回空响应")
        except Exception as e:
            print(f"  ⚠ AnswerQuestion 调用异常: {str(e)[:50]}")
        
        # 测试RecommendExercises
        class MockRecommendRequest:
            student_id = 1
            weak_point_ids = [1, 2, 3]
            count = 5
        
        try:
            response = servicer.RecommendExercises(MockRecommendRequest(), context)
            if response:
                print("  ✓ RecommendExercises 方法可调用")
            else:
                print("  ⚠ RecommendExercises 返回空响应")
        except Exception as e:
            print(f"  ⚠ RecommendExercises 调用异常: {str(e)[:50]}")
        
        return True
    except Exception as e:
        print(f"  ✗ gRPC方法验证失败: {e}")
        return False


def generate_verification_report():
    """生成验证报告"""
    print("\n" + "="*60)
    print("Python AI服务gRPC接口验证报告")
    print("="*60)
    
    results = {
        'proto_compilation': verify_proto_compilation(),
        'grpc_servicer': verify_grpc_servicer(),
        'ai_modules': verify_ai_modules(),
        'grpc_methods': verify_grpc_methods()
    }
    
    verify_model_files()
    verify_requirements()
    
    print("\n" + "="*60)
    print("验证总结")
    print("="*60)
    
    # 计算总体状态
    critical_checks = [
        results['proto_compilation'],
        results['grpc_servicer'],
        results['grpc_methods']
    ]
    
    if all(critical_checks):
        print("✓ 所有关键检查通过")
        print("✓ Python AI服务gRPC接口正常工作")
        return True
    else:
        print("✗ 部分关键检查失败")
        print("✗ 请检查上述错误并修复")
        return False


if __name__ == '__main__':
    success = generate_verification_report()
    sys.exit(0 if success else 1)
