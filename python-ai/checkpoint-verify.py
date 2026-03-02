"""
检查点8 - Python AI服务就绪验证脚本
验证所有AI功能和gRPC接口是否正常工作
"""

import sys
import time
import requests
import json
from io import BytesIO
from PIL import Image

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_header(msg):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}{Colors.END}\n")


class PythonAIServiceChecker:
    """Python AI服务检查器"""
    
    def __init__(self, base_url='http://localhost:5000'):
        self.base_url = base_url
        self.results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
    
    def check_service_running(self):
        """检查服务是否运行"""
        print_info("检查Python AI服务是否运行...")
        
        try:
            response = requests.get(f'{self.base_url}/health', timeout=5)
            if response.status_code == 200:
                data = response.json()
                print_success(f"服务运行中: {data.get('message', 'OK')}")
                return True
            else:
                print_error(f"服务响应异常: HTTP {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print_error("无法连接到服务，请确保服务已启动")
            print_info("提示: 运行 'python app.py' 或 'start-service.bat' 启动服务")
            return False
        except Exception as e:
            print_error(f"健康检查失败: {str(e)}")
            return False
    
    def check_ocr_module(self):
        """检查OCR模块"""
        print_info("检查OCR文字识别模块...")
        self.results['total'] += 1
        
        try:
            # 创建测试图片
            img = Image.new('RGB', (200, 100), color='white')
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            # 调用OCR接口
            files = {'image': ('test.png', img_bytes, 'image/png')}
            data = {'format': 'png'}
            
            response = requests.post(
                f'{self.base_url}/api/ocr/recognize',
                files=files,
                data=data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'text' in result and 'confidence' in result:
                    print_success(f"OCR模块正常 (置信度: {result.get('confidence', 0):.2f})")
                    self.results['passed'] += 1
                    return True
                else:
                    print_warning("OCR响应格式不完整")
                    self.results['warnings'] += 1
                    return False
            else:
                print_error(f"OCR接口错误: HTTP {response.status_code}")
                self.results['failed'] += 1
                return False
                
        except Exception as e:
            print_error(f"OCR模块测试失败: {str(e)}")
            self.results['failed'] += 1
            return False
    
    def check_bert_grading(self):
        """检查BERT评分模块"""
        print_info("检查BERT主观题评分模块...")
        self.results['total'] += 1
        
        try:
            # 测试数据
            test_data = {
                'question': '什么是勾股定理？',
                'student_answer': '勾股定理是直角三角形两直角边的平方和等于斜边的平方',
                'standard_answer': '在直角三角形中，两条直角边的平方和等于斜边的平方',
                'max_score': 10
            }
            
            response = requests.post(
                f'{self.base_url}/api/grading/subjective',
                json=test_data,
                timeout=60  # 增加超时时间，首次加载BERT模型需要更长时间
            )
            
            if response.status_code == 200:
                result = response.json()
                if all(key in result for key in ['score', 'feedback', 'key_points']):
                    print_success(f"BERT评分模块正常 (得分: {result['score']}/{test_data['max_score']})")
                    print_info(f"  反馈: {result['feedback'][:50]}...")
                    self.results['passed'] += 1
                    return True
                else:
                    print_warning("BERT响应格式不完整")
                    self.results['warnings'] += 1
                    return False
            else:
                print_error(f"BERT接口错误: HTTP {response.status_code}")
                self.results['failed'] += 1
                return False
                
        except Exception as e:
            print_error(f"BERT模块测试失败: {str(e)}")
            self.results['failed'] += 1
            return False
    
    def check_nlp_qa(self):
        """检查NLP问答模块"""
        print_info("检查NLP智能问答模块...")
        self.results['total'] += 1
        
        try:
            # 测试数据
            test_data = {
                'question': '如何计算圆的面积？',
                'context': '数学问题'
            }
            
            response = requests.post(
                f'{self.base_url}/api/qa/answer',
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if all(key in result for key in ['answer', 'steps', 'related_examples']):
                    print_success("NLP问答模块正常")
                    print_info(f"  答案: {result['answer'][:50]}...")
                    print_info(f"  步骤数: {len(result['steps'])}")
                    self.results['passed'] += 1
                    return True
                else:
                    print_warning("NLP响应格式不完整")
                    self.results['warnings'] += 1
                    return False
            else:
                print_error(f"NLP接口错误: HTTP {response.status_code}")
                self.results['failed'] += 1
                return False
                
        except Exception as e:
            print_error(f"NLP模块测试失败: {str(e)}")
            self.results['failed'] += 1
            return False
    
    def check_recommendation(self):
        """检查个性化推荐模块"""
        print_info("检查个性化推荐模块...")
        self.results['total'] += 1
        
        try:
            # 测试数据
            test_data = {
                'student_id': 1,
                'weak_point_ids': [1, 2, 3],
                'count': 5
            }
            
            response = requests.post(
                f'{self.base_url}/api/recommend/exercises',
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'exercises' in result and isinstance(result['exercises'], list):
                    print_success(f"推荐模块正常 (推荐题目数: {len(result['exercises'])})")
                    if len(result['exercises']) > 0:
                        print_info(f"  示例题目: {result['exercises'][0].get('title', 'N/A')}")
                    self.results['passed'] += 1
                    return True
                else:
                    print_warning("推荐响应格式不完整")
                    self.results['warnings'] += 1
                    return False
            else:
                print_error(f"推荐接口错误: HTTP {response.status_code}")
                self.results['failed'] += 1
                return False
                
        except Exception as e:
            print_error(f"推荐模块测试失败: {str(e)}")
            self.results['failed'] += 1
            return False
    
    def check_grpc_service(self):
        """检查gRPC服务"""
        print_info("检查gRPC服务...")
        self.results['total'] += 1
        
        try:
            # 检查gRPC proto文件是否编译
            import os
            if os.path.exists('ai_service_pb2.py') and os.path.exists('ai_service_pb2_grpc.py'):
                print_success("gRPC proto文件已编译")
                
                # 尝试导入gRPC模块
                try:
                    import ai_service_pb2
                    import ai_service_pb2_grpc
                    print_success("gRPC模块导入成功")
                    self.results['passed'] += 1
                    return True
                except ImportError as e:
                    print_warning(f"gRPC模块导入失败: {str(e)}")
                    self.results['warnings'] += 1
                    return False
            else:
                print_warning("gRPC proto文件未编译")
                print_info("  提示: 运行 'python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto'")
                self.results['warnings'] += 1
                return False
                
        except Exception as e:
            print_error(f"gRPC检查失败: {str(e)}")
            self.results['failed'] += 1
            return False
    
    def check_response_time(self):
        """检查响应时间"""
        print_info("检查API响应时间...")
        self.results['total'] += 1
        
        try:
            start_time = time.time()
            response = requests.get(f'{self.base_url}/health', timeout=5)
            elapsed = time.time() - start_time
            
            if elapsed < 1.0:
                print_success(f"响应时间正常: {elapsed*1000:.0f}ms")
                self.results['passed'] += 1
                return True
            else:
                print_warning(f"响应时间较慢: {elapsed*1000:.0f}ms")
                self.results['warnings'] += 1
                return False
                
        except Exception as e:
            print_error(f"响应时间检查失败: {str(e)}")
            self.results['failed'] += 1
            return False
    
    def print_summary(self):
        """打印检查摘要"""
        print_header("检查点8 - Python AI服务验证摘要")
        
        print(f"总检查项: {self.results['total']}")
        print(f"{Colors.GREEN}通过: {self.results['passed']}{Colors.END}")
        print(f"{Colors.YELLOW}警告: {self.results['warnings']}{Colors.END}")
        print(f"{Colors.RED}失败: {self.results['failed']}{Colors.END}")
        
        print()
        
        if self.results['failed'] == 0 and self.results['warnings'] == 0:
            print_success("✓ 所有检查通过！Python AI服务完全就绪")
            return True
        elif self.results['failed'] == 0:
            print_warning("⚠ 部分检查有警告，但服务基本可用")
            return True
        else:
            print_error("✗ 部分检查失败，请修复问题后重试")
            return False
    
    def run_all_checks(self):
        """运行所有检查"""
        print_header("检查点8 - Python AI服务就绪验证")
        
        # 1. 检查服务是否运行
        if not self.check_service_running():
            print_error("\n服务未运行，无法继续检查")
            print_info("请先启动服务: python app.py 或 start-service.bat")
            return False
        
        print()
        
        # 2. 检查各个模块
        self.check_ocr_module()
        print()
        
        self.check_bert_grading()
        print()
        
        self.check_nlp_qa()
        print()
        
        self.check_recommendation()
        print()
        
        self.check_grpc_service()
        print()
        
        self.check_response_time()
        print()
        
        # 3. 打印摘要
        return self.print_summary()


def main():
    """主函数"""
    checker = PythonAIServiceChecker()
    success = checker.run_all_checks()
    
    if success:
        print()
        print_info("下一步:")
        print("  1. 继续执行任务 9: Node.js后端核心功能开发")
        print("  2. 或运行完整测试: python -m pytest tests/ -v")
        sys.exit(0)
    else:
        print()
        print_info("故障排查:")
        print("  1. 确保服务已启动: python app.py")
        print("  2. 检查依赖安装: pip install -r requirements.txt")
        print("  3. 编译proto文件: python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto")
        print("  4. 查看日志输出排查具体错误")
        sys.exit(1)


if __name__ == '__main__':
    main()
