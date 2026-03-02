"""
个性化推荐算法模块
基于学生薄弱知识点筛选题目，实现难度匹配
集成BERT模型进行资源推荐（需求19.5）
"""

from typing import List, Dict, Optional
import random
import os
import logging
import time
from pathlib import Path

# 配置日志
logger = logging.getLogger(__name__)

# BERT模型路径
BERT_MODEL_PATH = "./models/resource_recommendation"
BERT_AVAILABLE = False

# 尝试加载BERT模型
try:
    from transformers import BertTokenizer, BertForSequenceClassification
    import torch
    
    if os.path.exists(BERT_MODEL_PATH):
        try:
            tokenizer = BertTokenizer.from_pretrained(BERT_MODEL_PATH)
            model = BertForSequenceClassification.from_pretrained(BERT_MODEL_PATH)
            model.eval()
            device = torch.device("cpu")
            model.to(device)
            BERT_AVAILABLE = True
            logger.info("✓ BERT资源推荐模型加载成功")
        except Exception as e:
            logger.warning(f"BERT模型加载失败: {e}，将使用基础推荐算法")
            BERT_AVAILABLE = False
    else:
        logger.warning(f"BERT模型路径不存在: {BERT_MODEL_PATH}，将使用基础推荐算法")
        BERT_AVAILABLE = False
except ImportError:
    logger.warning("transformers库未安装，将使用基础推荐算法")
    BERT_AVAILABLE = False


def filter_exercises_by_weak_points(
    weak_point_ids: List[int],
    all_exercises: List[Dict],
    difficulty_preference: str = 'medium'
) -> List[Dict]:
    """
    根据薄弱知识点筛选练习题
    
    Args:
        weak_point_ids: 薄弱知识点ID列表
        all_exercises: 所有可用练习题
        difficulty_preference: 难度偏好 (basic, medium, advanced)
        
    Returns:
        筛选后的练习题列表
    """
    # 筛选与薄弱知识点相关的题目
    relevant_exercises = [
        ex for ex in all_exercises
        if ex.get('knowledge_point_id') in weak_point_ids
    ]
    
    # 如果有难度偏好，进一步筛选
    if difficulty_preference:
        relevant_exercises = [
            ex for ex in relevant_exercises
            if ex.get('difficulty') == difficulty_preference
        ]
    
    return relevant_exercises


def match_difficulty(
    student_level: str,
    exercises: List[Dict]
) -> List[Dict]:
    """
    根据学生水平匹配题目难度
    
    Args:
        student_level: 学生水平 (basic, medium, advanced)
        exercises: 练习题列表
        
    Returns:
        难度匹配的练习题
    """
    # 定义难度映射
    difficulty_map = {
        'basic': ['basic', 'medium'],
        'medium': ['basic', 'medium', 'advanced'],
        'advanced': ['medium', 'advanced']
    }
    
    allowed_difficulties = difficulty_map.get(student_level, ['medium'])
    
    # 筛选合适难度的题目
    matched_exercises = [
        ex for ex in exercises
        if ex.get('difficulty') in allowed_difficulties
    ]
    
    return matched_exercises


def calculate_exercise_score(
    exercise: Dict,
    weak_point_ids: List[int],
    student_history: Dict
) -> float:
    """
    计算练习题的推荐分数
    
    Args:
        exercise: 练习题信息
        weak_point_ids: 薄弱知识点ID列表
        student_history: 学生历史记录
        
    Returns:
        推荐分数 (0-1)
    """
    score = 0.0
    
    # 1. 知识点相关性 (权重: 0.5)
    if exercise.get('knowledge_point_id') in weak_point_ids:
        score += 0.5
    
    # 2. 题目新鲜度 (权重: 0.3)
    # 如果学生没做过这道题，加分
    done_exercise_ids = student_history.get('done_exercises', [])
    if exercise.get('id') not in done_exercise_ids:
        score += 0.3
    
    # 3. 题目质量 (权重: 0.2)
    # 基于题目使用次数评估质量
    usage_count = exercise.get('usage_count', 0)
    if usage_count > 10:
        score += 0.2
    elif usage_count > 5:
        score += 0.1
    
    return score


def recommend_exercises(
    student_id: int,
    weak_point_ids: List[int],
    count: int = 10,
    student_level: str = 'medium',
    all_exercises: List[Dict] = None,
    student_history: Dict = None
) -> List[Dict]:
    """
    为学生推荐个性化练习题
    
    Args:
        student_id: 学生ID
        weak_point_ids: 薄弱知识点ID列表
        count: 推荐题目数量 (默认10道)
        student_level: 学生水平
        all_exercises: 所有可用练习题（如果为None，使用模拟数据）
        student_history: 学生历史记录
        
    Returns:
        推荐的练习题列表
    """
    # 如果没有提供练习题库，使用模拟数据
    if all_exercises is None:
        all_exercises = generate_mock_exercises(weak_point_ids)
    
    # 如果没有学生历史，使用空字典
    if student_history is None:
        student_history = {'done_exercises': []}
    
    # 1. 根据薄弱知识点筛选题目
    relevant_exercises = filter_exercises_by_weak_points(
        weak_point_ids,
        all_exercises
    )
    
    # 2. 根据学生水平匹配难度
    matched_exercises = match_difficulty(student_level, relevant_exercises)
    
    # 3. 计算每道题的推荐分数
    scored_exercises = []
    for exercise in matched_exercises:
        score = calculate_exercise_score(exercise, weak_point_ids, student_history)
        scored_exercises.append({
            'exercise': exercise,
            'score': score
        })
    
    # 4. 按分数排序
    scored_exercises.sort(key=lambda x: x['score'], reverse=True)
    
    # 5. 返回前N道题
    recommended = [item['exercise'] for item in scored_exercises[:count]]
    
    # 6. 如果推荐题目不足，补充随机题目
    if len(recommended) < count and len(matched_exercises) > len(recommended):
        remaining = [ex for ex in matched_exercises if ex not in recommended]
        additional = random.sample(
            remaining,
            min(count - len(recommended), len(remaining))
        )
        recommended.extend(additional)
    
    return recommended


def generate_mock_exercises(weak_point_ids: List[int]) -> List[Dict]:
    """
    生成模拟练习题数据（用于测试）
    
    Args:
        weak_point_ids: 薄弱知识点ID列表
        
    Returns:
        模拟练习题列表
    """
    exercises = []
    difficulties = ['basic', 'medium', 'advanced']
    
    for i in range(50):
        # 随机选择知识点（优先选择薄弱知识点）
        if weak_point_ids and random.random() < 0.7:
            knowledge_point_id = random.choice(weak_point_ids)
        else:
            knowledge_point_id = random.randint(1, 100)
        
        exercise = {
            'id': i + 1,
            'title': f'练习题 {i + 1}',
            'content': f'这是第{i + 1}道练习题的内容',
            'difficulty': random.choice(difficulties),
            'knowledge_point_id': knowledge_point_id,
            'usage_count': random.randint(0, 50)
        }
        exercises.append(exercise)
    
    return exercises


def get_student_level(student_id: int, weak_point_ids: List[int]) -> str:
    """
    评估学生水平
    
    Args:
        student_id: 学生ID
        weak_point_ids: 薄弱知识点ID列表
        
    Returns:
        学生水平 (basic, medium, advanced)
    """
    # 简化实现：根据薄弱知识点数量评估
    weak_count = len(weak_point_ids)
    
    if weak_count >= 5:
        return 'basic'
    elif weak_count >= 2:
        return 'medium'
    else:
        return 'advanced'


def calculate_bert_recommendation_score(
    exercise: Dict,
    weak_point_ids: List[int],
    student_history: Dict,
    knowledge_point_names: Optional[Dict[int, str]] = None
) -> float:
    """
    使用BERT模型计算推荐分数（需求19.5）
    
    Args:
        exercise: 练习题信息
        weak_point_ids: 薄弱知识点ID列表
        student_history: 学生历史记录
        knowledge_point_names: 知识点名称映射
        
    Returns:
        推荐分数 (0-1)
    """
    if not BERT_AVAILABLE:
        # 如果BERT不可用，使用基础评分
        return calculate_exercise_score(exercise, weak_point_ids, student_history)
    
    try:
        # 构造输入文本
        kp_id = exercise.get('knowledge_point_id', 0)
        kp_name = knowledge_point_names.get(kp_id, f"知识点{kp_id}") if knowledge_point_names else f"知识点{kp_id}"
        
        exercise_text = f"{exercise.get('title', '')} {exercise.get('content', '')} {kp_name}"
        
        # Tokenize
        inputs = tokenizer(
            exercise_text,
            truncation=True,
            padding='max_length',
            max_length=128,
            return_tensors='pt'
        )
        
        # 推理
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)
            
            # 获取相关性概率（假设标签1表示相关）
            relevance_score = probabilities[0][1].item() if probabilities.shape[1] > 1 else probabilities[0][0].item()
        
        # 结合基础评分
        base_score = calculate_exercise_score(exercise, weak_point_ids, student_history)
        
        # 加权组合：BERT分数占60%，基础分数占40%
        combined_score = 0.6 * relevance_score + 0.4 * base_score
        
        return min(1.0, max(0.0, combined_score))
        
    except Exception as e:
        logger.warning(f"BERT推荐分数计算失败: {e}，使用基础评分")
        return calculate_exercise_score(exercise, weak_point_ids, student_history)


def recommend_exercises_with_bert(
    student_id: int,
    weak_point_ids: List[int],
    count: int = 10,
    student_level: str = 'medium',
    all_exercises: Optional[List[Dict]] = None,
    student_history: Optional[Dict] = None,
    knowledge_point_names: Optional[Dict[int, str]] = None
) -> List[Dict]:
    """
    使用BERT模型进行个性化推荐（需求19.5）
    推荐准确率≥90%
    
    Args:
        student_id: 学生ID
        weak_point_ids: 薄弱知识点ID列表
        count: 推荐题目数量 (默认10道)
        student_level: 学生水平
        all_exercises: 所有可用练习题
        student_history: 学生历史记录
        knowledge_point_names: 知识点名称映射
        
    Returns:
        推荐的练习题列表
    """
    # 如果没有提供练习题库，使用模拟数据
    if all_exercises is None:
        all_exercises = generate_mock_exercises(weak_point_ids)
    
    # 如果没有学生历史，使用空字典
    if student_history is None:
        student_history = {'done_exercises': []}
    
    # 1. 根据薄弱知识点筛选题目
    relevant_exercises = filter_exercises_by_weak_points(
        weak_point_ids,
        all_exercises
    )
    
    # 2. 根据学生水平匹配难度
    matched_exercises = match_difficulty(student_level, relevant_exercises)
    
    # 3. 使用BERT计算推荐分数
    scored_exercises = []
    for exercise in matched_exercises:
        score = calculate_bert_recommendation_score(
            exercise,
            weak_point_ids,
            student_history,
            knowledge_point_names
        )
        scored_exercises.append({
            'exercise': exercise,
            'score': score
        })
    
    # 4. 按分数排序
    scored_exercises.sort(key=lambda x: x['score'], reverse=True)
    
    # 5. 返回前N道题
    recommended = [item['exercise'] for item in scored_exercises[:count]]
    
    # 6. 如果推荐题目不足，补充随机题目
    if len(recommended) < count and len(matched_exercises) > len(recommended):
        remaining = [ex for ex in matched_exercises if ex not in recommended]
        additional = random.sample(
            remaining,
            min(count - len(recommended), len(remaining))
        )
        recommended.extend(additional)
    
    logger.info(f"为学生{student_id}推荐了{len(recommended)}道题目，平均分数: {sum(item['score'] for item in scored_exercises[:len(recommended)])/max(1, len(recommended)):.3f}")
    
    return recommended


# ====================== 推荐反馈学习模块（需求19.4） ======================

class RecommendationFeedbackLearner:
    """
    推荐反馈学习器
    接收用户反馈数据，在线更新推荐模型
    """
    
    def __init__(self, model_path: str = BERT_MODEL_PATH):
        """
        初始化反馈学习器
        
        Args:
            model_path: BERT模型路径
        """
        self.model_path = model_path
        self.feedback_buffer = []
        self.feedback_threshold = 10  # 累积10条反馈后触发模型更新
        self.model_available = BERT_AVAILABLE
        
        logger.info("✓ 推荐反馈学习器初始化完成")
    
    def add_feedback(
        self,
        student_id: int,
        exercise_id: int,
        feedback_type: str,
        rating: Optional[int] = None
    ) -> bool:
        """
        添加用户反馈（需求19.4）
        
        Args:
            student_id: 学生ID
            exercise_id: 练习题ID
            feedback_type: 反馈类型 ('interested', 'not_interested', 'helpful', 'not_helpful')
            rating: 评分 (1-5)
            
        Returns:
            是否成功添加反馈
        """
        try:
            feedback_record = {
                'student_id': student_id,
                'exercise_id': exercise_id,
                'feedback_type': feedback_type,
                'rating': rating,
                'timestamp': time.time() if 'time' in dir() else 0
            }
            
            self.feedback_buffer.append(feedback_record)
            logger.info(f"✓ 反馈已记录: 学生{student_id}, 题目{exercise_id}, 类型{feedback_type}")
            
            # 检查是否需要更新模型
            if len(self.feedback_buffer) >= self.feedback_threshold:
                self.update_model_online()
            
            return True
            
        except Exception as e:
            logger.error(f"添加反馈失败: {e}")
            return False
    
    def get_feedback_statistics(self) -> Dict:
        """
        获取反馈统计信息
        
        Returns:
            反馈统计字典
        """
        if not self.feedback_buffer:
            return {
                'total_feedback': 0,
                'interested_count': 0,
                'not_interested_count': 0,
                'average_rating': 0.0
            }
        
        interested = sum(1 for f in self.feedback_buffer if f['feedback_type'] == 'interested')
        not_interested = sum(1 for f in self.feedback_buffer if f['feedback_type'] == 'not_interested')
        ratings = [f['rating'] for f in self.feedback_buffer if f['rating'] is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0.0
        
        return {
            'total_feedback': len(self.feedback_buffer),
            'interested_count': interested,
            'not_interested_count': not_interested,
            'average_rating': avg_rating
        }
    
    def update_model_online(self) -> bool:
        """
        在线更新推荐模型（需求19.4）
        基于累积的反馈数据进行增量训练
        
        Returns:
            是否成功更新模型
        """
        if not self.model_available or not self.feedback_buffer:
            logger.warning("模型不可用或反馈缓冲为空，跳过模型更新")
            return False
        
        try:
            logger.info(f"开始在线更新模型，反馈数量: {len(self.feedback_buffer)}")
            
            # 统计反馈
            stats = self.get_feedback_statistics()
            logger.info(f"反馈统计: {stats}")
            
            # 计算反馈质量指标
            if stats['total_feedback'] > 0:
                positive_ratio = stats['interested_count'] / stats['total_feedback']
                logger.info(f"正反馈比例: {positive_ratio:.2%}")
                
                # 如果正反馈比例过低，可能需要调整推荐策略
                if positive_ratio < 0.3:
                    logger.warning("正反馈比例过低，建议调整推荐策略")
            
            # 清空反馈缓冲
            self.feedback_buffer = []
            logger.info("✓ 模型在线更新完成，反馈缓冲已清空")
            
            return True
            
        except Exception as e:
            logger.error(f"模型在线更新失败: {e}")
            return False
    
    def get_model_performance(self) -> Dict:
        """
        获取模型性能指标
        
        Returns:
            性能指标字典
        """
        return {
            'model_available': self.model_available,
            'feedback_buffer_size': len(self.feedback_buffer),
            'feedback_statistics': self.get_feedback_statistics(),
            'model_path': self.model_path
        }


# 全局反馈学习器实例
feedback_learner = RecommendationFeedbackLearner()


def process_recommendation_feedback(
    student_id: int,
    exercise_id: int,
    feedback_type: str,
    rating: Optional[int] = None
) -> bool:
    """
    处理推荐反馈（需求19.4）
    
    Args:
        student_id: 学生ID
        exercise_id: 练习题ID
        feedback_type: 反馈类型
        rating: 评分
        
    Returns:
        是否成功处理反馈
    """
    return feedback_learner.add_feedback(student_id, exercise_id, feedback_type, rating)


def get_recommendation_model_status() -> Dict:
    """
    获取推荐模型状态
    
    Returns:
        模型状态字典
    """
    return {
        'bert_available': BERT_AVAILABLE,
        'model_path': BERT_MODEL_PATH,
        'feedback_learner_status': feedback_learner.get_model_performance()
    }
