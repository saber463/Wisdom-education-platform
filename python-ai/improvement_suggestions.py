#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
个性化提升建议生成模块
功能：基于学生学情数据生成个性化的学习改进建议
"""

import logging
from typing import Dict, List
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImprovementSuggestionsGenerator:
    """个性化提升建议生成器"""
    
    def __init__(self):
        """初始化建议生成器"""
        self.max_suggestions = 5
        self.max_length_per_suggestion = 500
    
    def generate_suggestions(
        self,
        knowledge_point_scores: List[Dict],
        error_books: List[Dict],
        learning_paths: List[Dict] = None,
        answer_speeds: List[Dict] = None
    ) -> List[str]:
        """
        生成个性化提升建议
        
        Args:
            knowledge_point_scores: 知识点评分列表
            error_books: 错题本数据列表
            learning_paths: 学习路径数据（可选）
            answer_speeds: 答题速度数据（可选）
        
        Returns:
            建议列表（最多5条，每条≤500字）
        """
        suggestions = []
        
        try:
            # 1. 分析薄弱知识点
            weak_suggestions = self._analyze_weak_points(knowledge_point_scores)
            suggestions.extend(weak_suggestions)
            
            # 2. 分析错题本
            error_suggestions = self._analyze_error_books(error_books)
            suggestions.extend(error_suggestions)
            
            # 3. 分析学习进度
            if learning_paths:
                progress_suggestions = self._analyze_learning_progress(learning_paths)
                suggestions.extend(progress_suggestions)
            
            # 4. 分析答题速度
            if answer_speeds:
                speed_suggestions = self._analyze_answer_speed(answer_speeds)
                suggestions.extend(speed_suggestions)
            
            # 5. 生成综合建议
            comprehensive_suggestions = self._generate_comprehensive_suggestions(
                knowledge_point_scores,
                error_books
            )
            suggestions.extend(comprehensive_suggestions)
            
            # 6. 限制建议数量和长度
            suggestions = suggestions[:self.max_suggestions]
            suggestions = [s[:self.max_length_per_suggestion] for s in suggestions]
            
            # 7. 如果没有建议，生成默认建议
            if not suggestions:
                suggestions = [self._get_default_suggestion()]
            
            logger.info(f"生成了{len(suggestions)}条提升建议")
            return suggestions
            
        except Exception as e:
            logger.error(f"生成建议失败: {e}")
            return [self._get_default_suggestion()]
    
    def _analyze_weak_points(self, knowledge_point_scores: List[Dict]) -> List[str]:
        """
        分析薄弱知识点并生成建议
        
        Args:
            knowledge_point_scores: 知识点评分列表
        
        Returns:
            建议列表
        """
        suggestions = []
        
        # 找出薄弱知识点（掌握度<40）
        weak_points = [
            kp for kp in knowledge_point_scores 
            if kp.get('status') == 'weak'
        ]
        
        if weak_points:
            # 按掌握度排序，找出最薄弱的3个
            weak_points_sorted = sorted(
                weak_points,
                key=lambda x: x.get('mastery_score', 0)
            )[:3]
            
            weak_names = '、'.join([kp['knowledge_point_name'] for kp in weak_points_sorted])
            
            suggestion = (
                f"您在{weak_names}等知识点的掌握度较低。建议：\n"
                f"1. 重新学习这些知识点的基础概念\n"
                f"2. 通过做相关练习题来加深理解\n"
                f"3. 建立知识点之间的联系，形成完整的知识体系\n"
                f"4. 定期复习这些知识点，避免遗忘"
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    def _analyze_error_books(self, error_books: List[Dict]) -> List[str]:
        """
        分析错题本并生成建议
        
        Args:
            error_books: 错题本数据列表
        
        Returns:
            建议列表
        """
        suggestions = []
        
        if not error_books:
            return suggestions
        
        # 计算总错题数
        total_errors = sum(e.get('error_count', 0) for e in error_books)
        
        if total_errors > 0:
            # 找出错误最多的知识点
            error_books_sorted = sorted(
                error_books,
                key=lambda x: x.get('error_count', 0),
                reverse=True
            )[:2]
            
            if total_errors > 10:
                error_names = '、'.join([e['knowledge_point_name'] for e in error_books_sorted])
                suggestion = (
                    f"您有{total_errors}道错题，其中{error_names}等知识点错误较多。建议：\n"
                    f"1. 重点复习这些错题，理解错误原因\n"
                    f"2. 针对错题类型进行专项训练\n"
                    f"3. 建立错题本，定期回顾\n"
                    f"4. 避免重复犯同样的错误"
                )
                suggestions.append(suggestion)
            elif total_errors > 5:
                suggestion = (
                    f"您有{total_errors}道错题。建议：\n"
                    f"1. 逐一分析每道错题的原因\n"
                    f"2. 针对错误类型进行针对性复习\n"
                    f"3. 加强相关知识点的练习"
                )
                suggestions.append(suggestion)
        
        return suggestions
    
    def _analyze_learning_progress(self, learning_paths: List[Dict]) -> List[str]:
        """
        分析学习进度并生成建议
        
        Args:
            learning_paths: 学习路径数据列表
        
        Returns:
            建议列表
        """
        suggestions = []
        
        if not learning_paths:
            return suggestions
        
        # 计算平均完成率
        total_completed = sum(p.get('completed_count', 0) for p in learning_paths)
        total_count = sum(p.get('total_count', 0) for p in learning_paths)
        
        if total_count > 0:
            completion_rate = total_completed / total_count
            
            if completion_rate < 0.5:
                suggestion = (
                    f"您的学习进度较慢，完成率仅为{completion_rate*100:.1f}%。建议：\n"
                    f"1. 制定合理的学习计划，逐步推进\n"
                    f"2. 每天坚持学习，保持学习连贯性\n"
                    f"3. 利用碎片时间进行学习\n"
                    f"4. 寻找学习的兴趣点，提高学习动力"
                )
                suggestions.append(suggestion)
            elif completion_rate < 0.8:
                suggestion = (
                    f"您的学习进度良好，完成率为{completion_rate*100:.1f}%。建议：\n"
                    f"1. 继续保持学习节奏\n"
                    f"2. 加强对已学知识的复习和巩固\n"
                    f"3. 逐步提高学习难度"
                )
                suggestions.append(suggestion)
        
        return suggestions
    
    def _analyze_answer_speed(self, answer_speeds: List[Dict]) -> List[str]:
        """
        分析答题速度并生成建议
        
        Args:
            answer_speeds: 答题速度数据列表
        
        Returns:
            建议列表
        """
        suggestions = []
        
        if not answer_speeds:
            return suggestions
        
        # 计算平均答题速度比
        speed_ratios = []
        for speed in answer_speeds:
            expected = speed.get('expected_time_seconds', 1)
            actual = speed.get('time_spent_seconds', 0)
            if expected > 0:
                ratio = actual / expected
                speed_ratios.append(ratio)
        
        if speed_ratios:
            avg_ratio = sum(speed_ratios) / len(speed_ratios)
            
            if avg_ratio > 1.5:
                suggestion = (
                    f"您的答题速度较慢，平均用时是预期的{avg_ratio:.1f}倍。建议：\n"
                    f"1. 加强基础知识的掌握，提高解题效率\n"
                    f"2. 练习快速识别题型和解题方法\n"
                    f"3. 做一些限时练习，逐步提高答题速度\n"
                    f"4. 避免过度思考，相信自己的判断"
                )
                suggestions.append(suggestion)
            elif avg_ratio < 0.7:
                suggestion = (
                    f"您的答题速度很快，但要注意准确性。建议：\n"
                    f"1. 在保持速度的同时，确保答题准确\n"
                    f"2. 仔细审题，避免因粗心出错\n"
                    f"3. 定期检查自己的答题质量"
                )
                suggestions.append(suggestion)
        
        return suggestions
    
    def _generate_comprehensive_suggestions(
        self,
        knowledge_point_scores: List[Dict],
        error_books: List[Dict]
    ) -> List[str]:
        """
        生成综合建议
        
        Args:
            knowledge_point_scores: 知识点评分列表
            error_books: 错题本数据列表
        
        Returns:
            建议列表
        """
        suggestions = []
        
        if not knowledge_point_scores:
            return suggestions
        
        # 计算整体掌握度
        avg_mastery = sum(kp.get('mastery_score', 0) for kp in knowledge_point_scores) / len(knowledge_point_scores)
        
        # 统计各状态的知识点数量
        weak_count = sum(1 for kp in knowledge_point_scores if kp.get('status') == 'weak')
        improving_count = sum(1 for kp in knowledge_point_scores if kp.get('status') == 'improving')
        mastered_count = sum(1 for kp in knowledge_point_scores if kp.get('status') == 'mastered')
        
        # 生成综合建议
        if avg_mastery < 50:
            suggestion = (
                f"您的整体掌握度为{avg_mastery:.1f}%，还需要加强学习。建议：\n"
                f"1. 制定详细的学习计划，系统地学习各个知识点\n"
                f"2. 从基础知识开始，逐步深入\n"
                f"3. 多做练习题，加深理解\n"
                f"4. 定期总结和复习，形成知识体系"
            )
            suggestions.append(suggestion)
        elif avg_mastery < 75:
            suggestion = (
                f"您的整体掌握度为{avg_mastery:.1f}%，学习效果良好。建议：\n"
                f"1. 继续保持学习热情\n"
                f"2. 重点加强{weak_count}个薄弱知识点的学习\n"
                f"3. 做一些综合性练习题，提高综合应用能力\n"
                f"4. 为冲刺高分做准备"
            )
            suggestions.append(suggestion)
        else:
            suggestion = (
                f"您的整体掌握度为{avg_mastery:.1f}%，学习效果优秀！建议：\n"
                f"1. 保持学习的连贯性和稳定性\n"
                f"2. 挑战更高难度的题目\n"
                f"3. 帮助其他同学学习，巩固自己的知识\n"
                f"4. 为更高层次的学习做准备"
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    def _get_default_suggestion(self) -> str:
        """获取默认建议"""
        return (
            "继续保持学习进度，定期复习已学知识点。"
            "如有疑问，可以通过AI答疑功能获取帮助。"
        )


# 全局实例
_generator = None


def get_generator() -> ImprovementSuggestionsGenerator:
    """获取建议生成器实例"""
    global _generator
    if _generator is None:
        _generator = ImprovementSuggestionsGenerator()
    return _generator


def generate_improvement_suggestions(
    knowledge_point_scores: List[Dict],
    error_books: List[Dict],
    learning_paths: List[Dict] = None,
    answer_speeds: List[Dict] = None
) -> List[str]:
    """
    生成个性化提升建议
    
    Args:
        knowledge_point_scores: 知识点评分列表
        error_books: 错题本数据列表
        learning_paths: 学习路径数据（可选）
        answer_speeds: 答题速度数据（可选）
    
    Returns:
        建议列表
    """
    generator = get_generator()
    return generator.generate_suggestions(
        knowledge_point_scores,
        error_books,
        learning_paths,
        answer_speeds
    )


if __name__ == '__main__':
    # 测试代码
    test_kp_scores = [
        {
            'knowledge_point_id': 1,
            'knowledge_point_name': '一次函数',
            'mastery_score': 85.0,
            'status': 'mastered'
        },
        {
            'knowledge_point_id': 2,
            'knowledge_point_name': '二次函数',
            'mastery_score': 35.0,
            'status': 'weak'
        },
        {
            'knowledge_point_id': 3,
            'knowledge_point_name': '三角函数',
            'mastery_score': 60.0,
            'status': 'improving'
        }
    ]
    
    test_error_books = [
        {
            'knowledge_point_id': 2,
            'knowledge_point_name': '二次函数',
            'error_count': 8,
            'total_count': 10
        }
    ]
    
    suggestions = generate_improvement_suggestions(
        test_kp_scores,
        test_error_books
    )
    
    print("生成的提升建议:")
    for i, suggestion in enumerate(suggestions, 1):
        print(f"\n建议{i}:")
        print(suggestion)
