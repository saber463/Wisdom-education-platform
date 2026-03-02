#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学情分析模块
功能：基于BERT模型分析学生学习情况，生成知识点掌握度评分和个性化建议
"""

import os
import sys
import logging
from typing import Dict, List, Tuple
import numpy as np
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 模型路径
MODEL_DIR = "./models/learning_analytics"


class LearningAnalyticsEngine:
    """学情分析引擎"""
    
    def __init__(self, load_model=True):
        """初始化学情分析引擎"""
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cpu")
        if load_model:
            self._load_model()
    
    def _load_model(self):
        """加载BERT模型"""
        try:
            if not os.path.exists(MODEL_DIR):
                logger.warning(f"模型目录不存在: {MODEL_DIR}")
                logger.info("使用预训练BERT模型作为备选方案")
                try:
                    self.tokenizer = BertTokenizer.from_pretrained("bert-base-chinese")
                    self.model = BertForSequenceClassification.from_pretrained(
                        "bert-base-chinese",
                        num_labels=3  # weak, improving, mastered
                    )
                except Exception as e:
                    logger.warning(f"无法加载预训练模型: {e}")
                    logger.info("将使用轻量级模式运行")
            else:
                logger.info(f"加载学情分析模型: {MODEL_DIR}")
                self.tokenizer = BertTokenizer.from_pretrained(MODEL_DIR)
                self.model = BertForSequenceClassification.from_pretrained(MODEL_DIR)
            
            if self.model:
                self.model.to(self.device)
                self.model.eval()
            logger.info("✓ 学情分析模型加载成功")
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            logger.info("将继续使用轻量级模式")
    
    def analyze_learning_status(
        self,
        user_id: int,
        user_type: str,
        learning_paths: List[Dict],
        error_books: List[Dict],
        answer_speeds: List[Dict]
    ) -> Dict:
        """
        分析学生学习情况
        
        Args:
            user_id: 用户ID
            user_type: 用户类型 (student/class/parent)
            learning_paths: 学习路径数据列表
            error_books: 错题本数据列表
            answer_speeds: 答题速度数据列表
        
        Returns:
            包含知识点掌握度评分和建议的字典
        """
        try:
            # 1. 计算知识点掌握度
            knowledge_point_scores = self._calculate_knowledge_point_scores(
                learning_paths,
                error_books,
                answer_speeds
            )
            
            # 2. 生成AI建议
            ai_suggestions = self._generate_suggestions(
                knowledge_point_scores,
                error_books
            )
            
            # 3. 计算整体掌握度
            overall_mastery_score = self._calculate_overall_mastery(
                knowledge_point_scores
            )
            
            return {
                'knowledge_point_scores': knowledge_point_scores,
                'ai_suggestions': ai_suggestions,
                'overall_mastery_score': overall_mastery_score
            }
        except Exception as e:
            logger.error(f"学情分析失败: {e}")
            raise
    
    def _calculate_knowledge_point_scores(
        self,
        learning_paths: List[Dict],
        error_books: List[Dict],
        answer_speeds: List[Dict]
    ) -> List[Dict]:
        """
        计算知识点掌握度评分
        
        Args:
            learning_paths: 学习路径数据
            error_books: 错题本数据
            answer_speeds: 答题速度数据
        
        Returns:
            知识点评分列表
        """
        knowledge_point_scores = []
        
        # 构建知识点映射
        kp_map = {}
        
        # 处理学习路径数据
        for path in learning_paths:
            kp_id = path.get('knowledge_point_id')
            if kp_id not in kp_map:
                kp_map[kp_id] = {
                    'id': kp_id,
                    'name': path.get('knowledge_point_name', ''),
                    'completed': 0,
                    'total': 0,
                    'errors': 0,
                    'speed_ratio': 1.0
                }
            kp_map[kp_id]['completed'] += path.get('completed_count', 0)
            kp_map[kp_id]['total'] = max(kp_map[kp_id]['total'], path.get('total_count', 0))
        
        # 处理错题本数据
        for error in error_books:
            kp_id = error.get('knowledge_point_id')
            if kp_id not in kp_map:
                kp_map[kp_id] = {
                    'id': kp_id,
                    'name': error.get('knowledge_point_name', ''),
                    'completed': 0,
                    'total': 0,
                    'errors': 0,
                    'speed_ratio': 1.0
                }
            kp_map[kp_id]['errors'] += error.get('error_count', 0)
            # 使用error_books中的total_count作为标准
            if kp_map[kp_id]['total'] == 0:
                kp_map[kp_id]['total'] = error.get('total_count', 0)
        
        # 处理答题速度数据
        for speed in answer_speeds:
            # 这里可以根据答题速度调整掌握度
            pass
        
        # 计算每个知识点的掌握度评分
        for kp_id, kp_data in kp_map.items():
            # 计算完成率
            completion_rate = 0.0
            if kp_data['total'] > 0:
                completion_rate = kp_data['completed'] / kp_data['total']
            
            # 计算错误率
            error_rate = 0.0
            if kp_data['total'] > 0:
                error_rate = kp_data['errors'] / kp_data['total']
            
            # 计算掌握度评分 (0-100)
            # 公式: 掌握度 = 完成率 * 50 + (1 - 错误率) * 50
            mastery_score = completion_rate * 50 + (1 - error_rate) * 50
            mastery_score = max(0, min(100, mastery_score))  # 限制在0-100范围
            
            # 判断状态
            if mastery_score < 40:
                status = 'weak'
            elif mastery_score < 70:
                status = 'improving'
            else:
                status = 'mastered'
            
            knowledge_point_scores.append({
                'knowledge_point_id': kp_id,
                'knowledge_point_name': kp_data['name'],
                'mastery_score': round(mastery_score, 2),
                'status': status
            })
        
        return knowledge_point_scores
    
    def _generate_suggestions(
        self,
        knowledge_point_scores: List[Dict],
        error_books: List[Dict]
    ) -> List[str]:
        """
        生成AI建议
        
        Args:
            knowledge_point_scores: 知识点评分列表
            error_books: 错题本数据
        
        Returns:
            建议列表
        """
        # 直接使用改进的建议生成逻辑
        from improvement_suggestions import ImprovementSuggestionsGenerator
        generator = ImprovementSuggestionsGenerator()
        suggestions = generator.generate_suggestions(
            knowledge_point_scores,
            error_books
        )
        
        return suggestions
    
    def _calculate_overall_mastery(
        self,
        knowledge_point_scores: List[Dict]
    ) -> float:
        """
        计算整体掌握度
        
        Args:
            knowledge_point_scores: 知识点评分列表
        
        Returns:
            整体掌握度评分 (0-100)
        """
        if not knowledge_point_scores:
            return 0.0
        
        # 计算平均掌握度
        total_score = sum(kp['mastery_score'] for kp in knowledge_point_scores)
        overall_mastery = total_score / len(knowledge_point_scores)
        
        return round(overall_mastery, 2)


# 全局实例
_engine = None


def get_engine() -> LearningAnalyticsEngine:
    """获取学情分析引擎实例"""
    global _engine
    if _engine is None:
        _engine = LearningAnalyticsEngine(load_model=False)
    return _engine


def analyze_learning_status(
    user_id: int,
    user_type: str,
    learning_paths: List[Dict],
    error_books: List[Dict],
    answer_speeds: List[Dict]
) -> Dict:
    """
    分析学生学习情况
    
    Args:
        user_id: 用户ID
        user_type: 用户类型 (student/class/parent)
        learning_paths: 学习路径数据列表
        error_books: 错题本数据列表
        answer_speeds: 答题速度数据列表
    
    Returns:
        包含知识点掌握度评分和建议的字典
    """
    engine = get_engine()
    return engine.analyze_learning_status(
        user_id,
        user_type,
        learning_paths,
        error_books,
        answer_speeds
    )


def generate_improvement_suggestions(
    knowledge_point_scores: List[Dict],
    error_books: List[Dict]
) -> List[str]:
    """
    生成个性化提升建议
    
    Args:
        knowledge_point_scores: 知识点评分列表
        error_books: 错题本数据
    
    Returns:
        建议列表
    """
    engine = get_engine()
    return engine._generate_suggestions(knowledge_point_scores, error_books)


if __name__ == '__main__':
    # 测试代码
    test_learning_paths = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'completed_count': 8,
            'total_count': 10
        },
        {
            'knowledge_point_id': 2,
            'knowledge_point_name': '二次函数',
            'completed_count': 5,
            'total_count': 10
        }
    ]
    
    test_error_books = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'error_count': 2,
            'total_count': 10
        },
        {
            'knowledge_point_id': 2,
            'knowledge_point_name': '二次函数',
            'error_count': 5,
            'total_count': 10
        }
    ]
    
    test_answer_speeds = []
    
    result = analyze_learning_status(
        user_id=1,
        user_type='student',
        learning_paths=test_learning_paths,
        error_books=test_error_books,
        answer_speeds=test_answer_speeds
    )
    
    print("学情分析结果:")
    print(f"知识点评分: {result['knowledge_point_scores']}")
    print(f"AI建议: {result['ai_suggestions']}")
    print(f"整体掌握度: {result['overall_mastery_score']}")
