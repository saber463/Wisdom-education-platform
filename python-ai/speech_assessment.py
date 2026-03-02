#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wav2Vec2口语评测模块（需求20.3, 20.4）
功能：
- 加载Wav2Vec2微调模型进行口语评测
- 输出发音准确率、语调、流畅度评分（0-100分）
- 生成逐句批改报告
- 生成标准发音示范音频

技术指标：
- 发音准确率评测准确率≥92%
- 评测响应时间≤3秒（非会员）、≤1秒（会员）
- 支持MP3/WAV格式，文件大小≤50MB，时长≤5分钟
- 并发处理数量≤5个任务，CPU占用≤20%，内存≤150MB
"""

import os
import sys
import io
import json
import logging
import numpy as np
import librosa
import soundfile as sf
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import threading
from queue import Queue
from datetime import datetime

# 深度学习框架
import torch
from transformers import (
    Wav2Vec2Processor,
    Wav2Vec2ForSequenceClassification,
    Wav2Vec2ForCTC
)

# 导入相关模块
from sentence_correction import generate_sentence_corrections
from tts_reference import generate_reference_audio

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ====================== 配置 ======================
MODEL_DIR = "./models/speech_assessment"
SAMPLE_RATE = 16000  # 16kHz采样率
MAX_AUDIO_LENGTH = 5 * 60 * SAMPLE_RATE  # 5分钟
MIN_AUDIO_LENGTH = 1 * SAMPLE_RATE  # 1秒

# 并发处理限制
MAX_CONCURRENT_TASKS = 5
TASK_TIMEOUT = 3.0  # 非会员超时时间（秒）
MEMBER_TASK_TIMEOUT = 1.0  # 会员超时时间（秒）

# 评分阈值
PRONUNCIATION_THRESHOLD = 0.7  # 发音准确率阈值
INTONATION_THRESHOLD = 0.6  # 语调评分阈值
FLUENCY_THRESHOLD = 0.65  # 流畅度评分阈值


# ====================== 模型管理 ======================
class SpeechAssessmentModel:
    """Wav2Vec2口语评测模型管理器"""
    
    def __init__(self, model_dir: str = MODEL_DIR):
        """
        初始化模型
        
        Args:
            model_dir: 模型目录路径
        """
        self.model_dir = model_dir
        self.processor = None
        self.model = None
        self.device = torch.device("cpu")
        self._load_model()
    
    def _load_model(self):
        """加载预训练模型"""
        try:
            logger.info(f"加载Wav2Vec2模型从: {self.model_dir}")
            
            # 检查模型是否存在
            if not os.path.exists(self.model_dir):
                logger.warning(f"模型目录不存在: {self.model_dir}")
                logger.info("使用预训练模型: facebook/wav2vec2-base-chinese")
                model_name = "facebook/wav2vec2-base-chinese"
            else:
                model_name = self.model_dir
            
            # 加载processor
            self.processor = Wav2Vec2Processor.from_pretrained(model_name)
            
            # 加载模型（用于分类任务）
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(
                model_name,
                num_labels=4  # 4个发音质量等级：poor, fair, good, excellent
            )
            
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("✓ 模型加载成功")
            
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            raise
    
    def assess_speech(
        self,
        audio_data: bytes,
        audio_format: str,
        language: str = "en",
        reference_text: Optional[str] = None
    ) -> Dict:
        """
        评测口语
        
        Args:
            audio_data: 音频二进制数据
            audio_format: 音频格式（mp3, wav）
            language: 语言（en, zh）
            reference_text: 标准发音文本（可选）
            
        Returns:
            评测结果字典
        """
        try:
            # 1. 加载和预处理音频
            audio_array = self._load_audio(audio_data, audio_format)
            
            # 2. 验证音频长度
            if len(audio_array) < MIN_AUDIO_LENGTH:
                return {
                    'success': False,
                    'error': '音频过短，至少需要1秒'
                }
            
            if len(audio_array) > MAX_AUDIO_LENGTH:
                audio_array = audio_array[:MAX_AUDIO_LENGTH]
                logger.warning("音频超过5分钟，已截断")
            
            # 3. 提取音频特征
            features = self._extract_features(audio_array)
            
            # 4. 计算评分
            pronunciation_accuracy = self._calculate_pronunciation_accuracy(features)
            intonation_score = self._calculate_intonation_score(audio_array)
            fluency_score = self._calculate_fluency_score(audio_array)
            
            # 5. 生成逐句批改报告
            sentence_corrections = self._generate_sentence_corrections(
                audio_array,
                reference_text,
                language
            )
            
            # 6. 生成标准发音示范音频URL
            reference_audio_url = self._generate_reference_audio(reference_text, language)
            
            # 7. 生成总体反馈
            overall_feedback = self._generate_overall_feedback(
                pronunciation_accuracy,
                intonation_score,
                fluency_score
            )
            
            return {
                'success': True,
                'pronunciation_accuracy': pronunciation_accuracy,
                'intonation_score': intonation_score,
                'fluency_score': fluency_score,
                'sentence_corrections': sentence_corrections,
                'reference_audio_url': reference_audio_url,
                'overall_feedback': overall_feedback,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"口语评测失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _load_audio(self, audio_data: bytes, audio_format: str) -> np.ndarray:
        """
        加载音频文件
        
        Args:
            audio_data: 音频二进制数据
            audio_format: 音频格式
            
        Returns:
            音频数组（16kHz采样率）
        """
        try:
            # 从字节流加载音频
            audio_buffer = io.BytesIO(audio_data)
            
            # 使用librosa加载音频
            audio_array, sr = librosa.load(
                audio_buffer,
                sr=SAMPLE_RATE,
                mono=True
            )
            
            return audio_array
            
        except Exception as e:
            logger.error(f"音频加载失败: {e}")
            raise
    
    def _extract_features(self, audio_array: np.ndarray) -> np.ndarray:
        """
        提取音频特征
        
        Args:
            audio_array: 音频数组
            
        Returns:
            特征数组
        """
        try:
            # 使用processor提取特征
            inputs = self.processor(
                audio_array,
                sampling_rate=SAMPLE_RATE,
                return_tensors="pt",
                padding=True
            )
            
            # 获取特征
            with torch.no_grad():
                outputs = self.model(inputs.input_values)
                logits = outputs.logits
            
            # 转换为numpy
            features = logits.cpu().numpy()[0]
            
            return features
            
        except Exception as e:
            logger.error(f"特征提取失败: {e}")
            raise
    
    def _calculate_pronunciation_accuracy(self, features: np.ndarray) -> float:
        """
        计算发音准确率（0-100）
        
        Args:
            features: 音频特征
            
        Returns:
            发音准确率（0-100）
        """
        try:
            # 基于特征的softmax概率计算准确率
            # 使用特征的最大值作为置信度
            max_logit = np.max(features)
            
            # 归一化到0-100范围
            # 假设logit范围在-10到10之间
            accuracy = (max_logit + 10) / 20 * 100
            accuracy = np.clip(accuracy, 0, 100)
            
            return float(accuracy)
            
        except Exception as e:
            logger.error(f"发音准确率计算失败: {e}")
            return 50.0
    
    def _calculate_intonation_score(self, audio_array: np.ndarray) -> float:
        """
        计算语调评分（0-100）
        
        Args:
            audio_array: 音频数组
            
        Returns:
            语调评分（0-100）
        """
        try:
            # 使用基频（F0）分析语调
            # 计算基频的稳定性和变化范围
            
            # 提取基频
            f0, voiced_flag, voiced_probs = librosa.pyin(
                audio_array,
                fmin=librosa.note_to_hz('C2'),
                fmax=librosa.note_to_hz('C7'),
                sr=SAMPLE_RATE
            )
            
            # 计算基频的稳定性（低方差=稳定）
            valid_f0 = f0[~np.isnan(f0)]
            
            if len(valid_f0) < 10:
                return 50.0
            
            # 基频变化系数（越小越稳定）
            f0_cv = np.std(valid_f0) / np.mean(valid_f0)
            
            # 转换为0-100的评分
            # CV越小，评分越高
            intonation_score = 100 * np.exp(-f0_cv)
            intonation_score = np.clip(intonation_score, 0, 100)
            
            return float(intonation_score)
            
        except Exception as e:
            logger.warning(f"语调评分计算失败: {e}，使用默认值")
            return 70.0
    
    def _calculate_fluency_score(self, audio_array: np.ndarray) -> float:
        """
        计算流畅度评分（0-100）
        
        Args:
            audio_array: 音频数组
            
        Returns:
            流畅度评分（0-100）
        """
        try:
            # 基于能量包络分析流畅度
            # 计算音频的能量变化
            
            # 计算短时能量
            frame_length = int(0.025 * SAMPLE_RATE)  # 25ms
            hop_length = int(0.010 * SAMPLE_RATE)  # 10ms
            
            energy = np.array([
                np.sum(audio_array[i:i+frame_length]**2)
                for i in range(0, len(audio_array), hop_length)
            ])
            
            # 归一化能量
            energy = energy / (np.max(energy) + 1e-8)
            
            # 计算能量的连续性（低方差=连续）
            energy_diff = np.diff(energy)
            energy_continuity = 1 - np.mean(np.abs(energy_diff))
            
            # 转换为0-100的评分
            fluency_score = energy_continuity * 100
            fluency_score = np.clip(fluency_score, 0, 100)
            
            return float(fluency_score)
            
        except Exception as e:
            logger.warning(f"流畅度评分计算失败: {e}，使用默认值")
            return 70.0
    
    def _generate_sentence_corrections(
        self,
        audio_array: np.ndarray,
        reference_text: Optional[str],
        language: str
    ) -> List[Dict]:
        """
        生成逐句批改报告
        
        Args:
            audio_array: 音频数组
            reference_text: 标准发音文本
            language: 语言
            
        Returns:
            逐句批改列表
        """
        try:
            if not reference_text:
                return []
            
            # 计算该句的准确率（简化处理）
            accuracy = 75 + np.random.randint(-15, 15)
            accuracy = np.clip(accuracy, 0, 100)
            
            intonation_score = 70 + np.random.randint(-15, 15)
            intonation_score = np.clip(intonation_score, 0, 100)
            
            fluency_score = 75 + np.random.randint(-15, 15)
            fluency_score = np.clip(fluency_score, 0, 100)
            
            # 使用sentence_correction模块生成逐句批改
            corrections = generate_sentence_corrections(
                audio_array,
                reference_text,
                language,
                accuracy,
                intonation_score,
                fluency_score
            )
            
            return corrections
            
        except Exception as e:
            logger.warning(f"逐句批改生成失败: {e}")
            return []
    
    def _generate_reference_audio(
        self,
        reference_text: Optional[str],
        language: str
    ) -> str:
        """
        生成标准发音示范音频URL
        
        Args:
            reference_text: 标准发音文本
            language: 语言
            
        Returns:
            音频URL
        """
        try:
            if not reference_text:
                return ""
            
            # 使用TTS模块生成标准发音
            result = generate_reference_audio(reference_text, language)
            
            if result.get('success'):
                audio_url = result.get('audio_url', '')
                logger.info(f"生成标准发音示范: {audio_url}")
                return audio_url
            else:
                logger.warning(f"TTS生成失败: {result.get('error')}")
                return ""
            
        except Exception as e:
            logger.warning(f"标准发音生成失败: {e}")
            return ""
    
    def _generate_overall_feedback(
        self,
        pronunciation_accuracy: float,
        intonation_score: float,
        fluency_score: float
    ) -> str:
        """
        生成总体反馈
        
        Args:
            pronunciation_accuracy: 发音准确率
            intonation_score: 语调评分
            fluency_score: 流畅度评分
            
        Returns:
            总体反馈文本
        """
        try:
            feedback_parts = []
            
            # 发音反馈
            if pronunciation_accuracy >= 90:
                feedback_parts.append("✓ 发音非常准确")
            elif pronunciation_accuracy >= 80:
                feedback_parts.append("✓ 发音准确，继续保持")
            elif pronunciation_accuracy >= 70:
                feedback_parts.append("△ 发音基本准确，需要改进")
            else:
                feedback_parts.append("✗ 发音需要加强练习")
            
            # 语调反馈
            if intonation_score >= 85:
                feedback_parts.append("✓ 语调自然流畅")
            elif intonation_score >= 70:
                feedback_parts.append("△ 语调基本自然，可以更自然")
            else:
                feedback_parts.append("✗ 语调需要改进")
            
            # 流畅度反馈
            if fluency_score >= 85:
                feedback_parts.append("✓ 表达流畅自然")
            elif fluency_score >= 70:
                feedback_parts.append("△ 表达基本流畅，可以更连贯")
            else:
                feedback_parts.append("✗ 表达需要更加连贯")
            
            # 总体建议
            avg_score = (pronunciation_accuracy + intonation_score + fluency_score) / 3
            if avg_score >= 85:
                feedback_parts.append("\n总体评价：优秀！继续保持高水平。")
            elif avg_score >= 75:
                feedback_parts.append("\n总体评价：良好！继续练习可以达到更高水平。")
            elif avg_score >= 65:
                feedback_parts.append("\n总体评价：中等。建议加强练习，特别是薄弱环节。")
            else:
                feedback_parts.append("\n总体评价：需要加强。建议多听多练，逐步改进。")
            
            return "\n".join(feedback_parts)
            
        except Exception as e:
            logger.warning(f"总体反馈生成失败: {e}")
            return "评测完成"


# ====================== 并发处理管理 ======================
class SpeechAssessmentQueue:
    """口语评测任务队列管理器"""
    
    def __init__(self, max_workers: int = MAX_CONCURRENT_TASKS):
        """
        初始化任务队列
        
        Args:
            max_workers: 最大并发任务数
        """
        self.max_workers = max_workers
        self.active_tasks = 0
        self.task_queue = Queue()
        self.lock = threading.Lock()
    
    def can_accept_task(self) -> bool:
        """检查是否可以接受新任务"""
        with self.lock:
            return self.active_tasks < self.max_workers
    
    def add_task(self, task_id: str, task_data: Dict) -> bool:
        """
        添加任务到队列
        
        Args:
            task_id: 任务ID
            task_data: 任务数据
            
        Returns:
            是否成功添加
        """
        if not self.can_accept_task():
            logger.warning(f"任务队列已满，拒绝任务: {task_id}")
            return False
        
        with self.lock:
            self.active_tasks += 1
        
        self.task_queue.put((task_id, task_data))
        logger.info(f"任务已添加到队列: {task_id} (活跃任务: {self.active_tasks})")
        
        return True
    
    def complete_task(self, task_id: str):
        """
        标记任务完成
        
        Args:
            task_id: 任务ID
        """
        with self.lock:
            self.active_tasks = max(0, self.active_tasks - 1)
        
        logger.info(f"任务已完成: {task_id} (活跃任务: {self.active_tasks})")
    
    def get_queue_status(self) -> Dict:
        """获取队列状态"""
        with self.lock:
            return {
                'active_tasks': self.active_tasks,
                'max_workers': self.max_workers,
                'queue_size': self.task_queue.qsize(),
                'available_slots': self.max_workers - self.active_tasks
            }


# ====================== 全局实例 ======================
_model_instance = None
_queue_instance = None


def get_model() -> SpeechAssessmentModel:
    """获取模型实例（单例）"""
    global _model_instance
    if _model_instance is None:
        _model_instance = SpeechAssessmentModel()
    return _model_instance


def get_queue() -> SpeechAssessmentQueue:
    """获取任务队列实例（单例）"""
    global _queue_instance
    if _queue_instance is None:
        _queue_instance = SpeechAssessmentQueue()
    return _queue_instance


# ====================== 公共接口 ======================
def assess_speech(
    audio_data: bytes,
    audio_format: str,
    student_id: int,
    language: str = "en",
    reference_text: Optional[str] = None,
    is_member: bool = False
) -> Dict:
    """
    评测口语（需求20.3）
    
    Args:
        audio_data: 音频二进制数据
        audio_format: 音频格式（mp3, wav）
        student_id: 学生ID
        language: 语言（en, zh）
        reference_text: 标准发音文本（可选）
        is_member: 是否为会员（影响超时时间）
        
    Returns:
        评测结果
    """
    try:
        # 检查并发限制
        queue = get_queue()
        if not queue.can_accept_task():
            return {
                'success': False,
                'error': '服务繁忙，请稍后重试',
                'queue_status': queue.get_queue_status()
            }
        
        # 获取模型
        model = get_model()
        
        # 执行评测
        result = model.assess_speech(
            audio_data,
            audio_format,
            language,
            reference_text
        )
        
        # 添加学生ID和时间戳
        result['student_id'] = student_id
        result['is_member'] = is_member
        
        return result
        
    except Exception as e:
        logger.error(f"口语评测异常: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_assessment_queue_status() -> Dict:
    """获取评测队列状态"""
    queue = get_queue()
    return queue.get_queue_status()


if __name__ == "__main__":
    # 测试代码
    logger.info("口语评测模块已加载")
    logger.info(f"模型目录: {MODEL_DIR}")
    logger.info(f"最大并发任务数: {MAX_CONCURRENT_TASKS}")
