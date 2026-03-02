"""
gRPC服务端实现
提供OCR识别、BERT评分、NLP问答、个性化推荐、推荐反馈、学情分析、口语评测、推送文案优化八个RPC方法
"""

import grpc
from concurrent import futures
import time
import os
import sys

# 导入AI模块
from ocr import recognize_text
from bert_grading import grade_subjective_answer
from nlp_qa import answer_question
from recommendation import recommend_exercises
from learning_analytics import analyze_learning_status
from speech_assessment import assess_speech, get_assessment_queue_status
from push_content_optimizer import optimize_push_content, update_optimization_statistics
from config import GRPC_PORT

# 注意：需要先编译proto文件生成Python代码
# python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto

try:
    import ai_service_pb2
    import ai_service_pb2_grpc
    PROTO_COMPILED = True
except ImportError:
    print("警告: proto文件未编译，gRPC服务将无法启动")
    print("请运行: python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto")
    PROTO_COMPILED = False


class AIGradingServicer:
    """AI批改服务实现"""
    
    def RecognizeText(self, request, context):
        """OCR文字识别"""
        try:
            result = recognize_text(request.image_data, request.format)
            if PROTO_COMPILED:
                return ai_service_pb2.TextResponse(
                    text=result['text'],
                    confidence=result['confidence']
                )
            else:
                return {'text': result['text'], 'confidence': result['confidence']}
        except Exception as e:
            print(f"OCR识别错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"OCR识别失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.TextResponse(text='', confidence=0.0)
            else:
                return {'text': '', 'confidence': 0.0}
    
    def GradeSubjective(self, request, context):
        """主观题评分"""
        try:
            result = grade_subjective_answer(
                request.question,
                request.student_answer,
                request.standard_answer,
                request.max_score
            )
            if PROTO_COMPILED:
                return ai_service_pb2.GradingResponse(
                    score=result['score'],
                    feedback=result['feedback'],
                    key_points=result['key_points']
                )
            else:
                return result
        except Exception as e:
            print(f"主观题评分错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"评分失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.GradingResponse(
                    score=0,
                    feedback='评分失败',
                    key_points=[]
                )
            else:
                return {'score': 0, 'feedback': '评分失败', 'key_points': []}
    
    def AnswerQuestion(self, request, context):
        """AI答疑"""
        try:
            result = answer_question(request.question, request.context)
            if PROTO_COMPILED:
                return ai_service_pb2.AnswerResponse(
                    answer=result['answer'],
                    steps=result['steps'],
                    related_examples=result['related_examples']
                )
            else:
                return result
        except Exception as e:
            print(f"AI答疑错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"答疑失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.AnswerResponse(
                    answer='抱歉，暂时无法回答',
                    steps=[],
                    related_examples=[]
                )
            else:
                return {'answer': '抱歉，暂时无法回答', 'steps': [], 'related_examples': []}
    
    def RecommendExercises(self, request, context):
        """个性化推荐"""
        try:
            from recommendation import recommend_exercises_with_bert, get_student_level
            student_level = get_student_level(
                request.student_id,
                list(request.weak_point_ids)
            )
            exercises = recommend_exercises_with_bert(
                request.student_id,
                list(request.weak_point_ids),
                request.count,
                student_level
            )
            if PROTO_COMPILED:
                exercise_messages = []
                for ex in exercises:
                    exercise_messages.append(
                        ai_service_pb2.Exercise(
                            id=ex['id'],
                            title=ex['title'],
                            difficulty=ex['difficulty'],
                            knowledge_point_id=ex['knowledge_point_id']
                        )
                    )
                return ai_service_pb2.RecommendResponse(exercises=exercise_messages)
            else:
                return {'exercises': exercises}
        except Exception as e:
            print(f"推荐算法错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"推荐失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.RecommendResponse(exercises=[])
            else:
                return {'exercises': []}
    
    def ProcessRecommendationFeedback(self, request, context):
        """处理推荐反馈"""
        try:
            from recommendation import process_recommendation_feedback, feedback_learner
            success = process_recommendation_feedback(
                request.student_id,
                request.exercise_id,
                request.feedback_type,
                request.rating if request.rating > 0 else None
            )
            stats = feedback_learner.get_feedback_statistics()
            if PROTO_COMPILED:
                return ai_service_pb2.FeedbackResponse(
                    success=success,
                    message="反馈已记录" if success else "反馈记录失败",
                    feedback_count=stats['total_feedback']
                )
            else:
                return {
                    'success': success,
                    'message': "反馈已记录" if success else "反馈记录失败",
                    'feedback_count': stats['total_feedback']
                }
        except Exception as e:
            print(f"反馈处理错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"反馈处理失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.FeedbackResponse(
                    success=False,
                    message=f"反馈处理失败: {str(e)}",
                    feedback_count=0
                )
            else:
                return {
                    'success': False,
                    'message': f"反馈处理失败: {str(e)}",
                    'feedback_count': 0
                }
    
    def AnalyzeLearningStatus(self, request, context):
        """学情分析"""
        try:
            learning_paths = []
            for path in request.learning_paths:
                learning_paths.append({
                    'knowledge_point_id': path.knowledge_point_id,
                    'knowledge_point_name': path.knowledge_point_name,
                    'completed_count': path.completed_count,
                    'total_count': path.total_count
                })
            
            error_books = []
            for error in request.error_books:
                error_books.append({
                    'knowledge_point_id': error.knowledge_point_id,
                    'knowledge_point_name': error.knowledge_point_name,
                    'error_count': error.error_count,
                    'total_count': error.total_count
                })
            
            answer_speeds = []
            for speed in request.answer_speeds:
                answer_speeds.append({
                    'question_id': speed.question_id,
                    'time_spent_seconds': speed.time_spent_seconds,
                    'expected_time_seconds': speed.expected_time_seconds
                })
            
            result = analyze_learning_status(
                request.user_id,
                request.user_type,
                learning_paths,
                error_books,
                answer_speeds
            )
            
            if PROTO_COMPILED:
                kp_scores = []
                for kp in result['knowledge_point_scores']:
                    kp_scores.append(
                        ai_service_pb2.KnowledgePointScore(
                            knowledge_point_id=kp['knowledge_point_id'],
                            knowledge_point_name=kp['knowledge_point_name'],
                            mastery_score=kp['mastery_score'],
                            status=kp['status']
                        )
                    )
                
                return ai_service_pb2.LearningAnalysisResponse(
                    knowledge_point_scores=kp_scores,
                    ai_suggestions=result['ai_suggestions'],
                    overall_mastery_score=result['overall_mastery_score']
                )
            else:
                return result
        except Exception as e:
            print(f"学情分析错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"学情分析失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.LearningAnalysisResponse(
                    knowledge_point_scores=[],
                    ai_suggestions=[],
                    overall_mastery_score=0.0
                )
            else:
                return {
                    'knowledge_point_scores': [],
                    'ai_suggestions': [],
                    'overall_mastery_score': 0.0
                }
    
    def AssessSpeech(self, request, context):
        """口语评测"""
        try:
            result = assess_speech(
                request.audio_data,
                request.audio_format,
                request.student_id,
                request.language,
                request.reference_text if request.reference_text else None,
                is_member=False
            )
            
            if not result.get('success', False):
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(result.get('error', '口语评测失败'))
                if PROTO_COMPILED:
                    return ai_service_pb2.SpeechAssessmentResponse(
                        pronunciation_accuracy=0.0,
                        intonation_score=0.0,
                        fluency_score=0.0,
                        sentence_corrections=[],
                        reference_audio_url='',
                        overall_feedback=result.get('error', '评测失败')
                    )
                else:
                    return result
            
            if PROTO_COMPILED:
                sentence_corrections = []
                for correction in result.get('sentence_corrections', []):
                    sentence_corrections.append(
                        ai_service_pb2.SentenceCorrection(
                            sentence_index=correction['sentence_index'],
                            sentence_text=correction['sentence_text'],
                            accuracy=correction['accuracy'],
                            error_words=correction['error_words'],
                            suggestions=correction['suggestions']
                        )
                    )
                
                return ai_service_pb2.SpeechAssessmentResponse(
                    pronunciation_accuracy=result['pronunciation_accuracy'],
                    intonation_score=result['intonation_score'],
                    fluency_score=result['fluency_score'],
                    sentence_corrections=sentence_corrections,
                    reference_audio_url=result['reference_audio_url'],
                    overall_feedback=result['overall_feedback']
                )
            else:
                return result
        except Exception as e:
            print(f"口语评测错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"口语评测失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.SpeechAssessmentResponse(
                    pronunciation_accuracy=0.0,
                    intonation_score=0.0,
                    fluency_score=0.0,
                    sentence_corrections=[],
                    reference_audio_url='',
                    overall_feedback=f'口语评测失败: {str(e)}'
                )
            else:
                return {
                    'success': False,
                    'error': str(e)
                }
    
    def OptimizePushContent(self, request, context):
        """推送文案优化"""
        try:
            result = optimize_push_content(
                request.original_content,
                request.language if request.language else 'zh',
                request.context if request.context else '',
                request.max_length if request.max_length > 0 else None
            )
            
            if result['success']:
                update_optimization_statistics(
                    result['appeal_score'],
                    result['conversion_score']
                )
            
            if PROTO_COMPILED:
                return ai_service_pb2.OptimizePushContentResponse(
                    optimized_content=result['optimized_content'],
                    appeal_score=result['appeal_score'],
                    conversion_score=result['conversion_score'],
                    optimization_suggestions=result['optimization_suggestions'],
                    success=result['success'],
                    message=result['message']
                )
            else:
                return result
        except Exception as e:
            print(f"推送文案优化错误: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"推送文案优化失败: {str(e)}")
            if PROTO_COMPILED:
                return ai_service_pb2.OptimizePushContentResponse(
                    optimized_content=request.original_content,
                    appeal_score=50.0,
                    conversion_score=50.0,
                    optimization_suggestions=[],
                    success=False,
                    message=f'推送文案优化失败: {str(e)}'
                )
            else:
                return {
                    'success': False,
                    'optimized_content': request.original_content,
                    'appeal_score': 50.0,
                    'conversion_score': 50.0,
                    'optimization_suggestions': [],
                    'message': f'推送文案优化失败: {str(e)}'
                }


def find_available_port(start_port: int, max_attempts: int = 3) -> int:
    """查找可用端口"""
    import socket
    
    for i in range(max_attempts):
        port = start_port + i
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('', port))
            sock.close()
            return port
        except OSError:
            print(f"端口 {port} 已被占用，尝试下一个端口...")
            continue
    
    return start_port


def serve():
    """启动gRPC服务器"""
    if not PROTO_COMPILED:
        print("错误: proto文件未编译，无法启动gRPC服务")
        print("请先运行: python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto")
        return
    
    port = find_available_port(GRPC_PORT)
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    
    ai_service_pb2_grpc.add_AIGradingServiceServicer_to_server(
        AIGradingServicer(),
        server
    )
    
    server.add_insecure_port(f'[::]:{port}')
    server.start()
    print(f'Python AI gRPC服务已启动，监听端口: {port}')
    
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print('正在关闭gRPC服务器...')
        server.stop(0)


if __name__ == '__main__':
    serve()
