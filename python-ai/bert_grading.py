"""
BERT主观题评分模块
使用预训练BERT模型进行语义相似度计算和评分
"""

import torch
from transformers import BertTokenizer, BertModel
import numpy as np
from typing import List, Dict
import os
from config import BERT_MODEL_PATH, MODEL_CACHE_DIR

# 全局模型和分词器
_tokenizer = None
_model = None


def load_bert_model():
    """
    加载预训练BERT模型（bert-base-chinese）
    """
    global _tokenizer, _model
    
    if _tokenizer is None or _model is None:
        print("正在加载BERT模型...")
        try:
            # 创建模型缓存目录
            os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
            
            # 加载分词器和模型
            _tokenizer = BertTokenizer.from_pretrained(
                BERT_MODEL_PATH,
                cache_dir=MODEL_CACHE_DIR
            )
            _model = BertModel.from_pretrained(
                BERT_MODEL_PATH,
                cache_dir=MODEL_CACHE_DIR
            )
            
            # 设置为评估模式
            _model.eval()
            
            print("BERT模型加载成功")
        except Exception as e:
            print(f"BERT模型加载失败: {str(e)}")
            print("将使用简化的评分逻辑")
    
    return _tokenizer, _model


def get_sentence_embedding(text: str) -> np.ndarray:
    """
    获取句子的BERT嵌入向量
    
    Args:
        text: 输入文本
        
    Returns:
        句子的嵌入向量
    """
    tokenizer, model = load_bert_model()
    
    if tokenizer is None or model is None:
        # 如果模型加载失败，返回零向量
        return np.zeros(768)
    
    try:
        # 分词
        inputs = tokenizer(
            text,
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=512
        )
        
        # 获取模型输出
        with torch.no_grad():
            outputs = model(**inputs)
        
        # 使用[CLS]标记的输出作为句子嵌入
        sentence_embedding = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
        
        return sentence_embedding
        
    except Exception as e:
        print(f"获取嵌入向量失败: {str(e)}")
        return np.zeros(768)


def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """
    计算两个文本的语义相似度
    
    Args:
        text1: 第一个文本
        text2: 第二个文本
        
    Returns:
        相似度分数 (0-1)
    """
    # 获取两个句子的嵌入向量
    embedding1 = get_sentence_embedding(text1)
    embedding2 = get_sentence_embedding(text2)
    
    # 计算余弦相似度
    dot_product = np.dot(embedding1, embedding2)
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    similarity = dot_product / (norm1 * norm2)
    
    # 将相似度从[-1, 1]映射到[0, 1]
    similarity = (similarity + 1) / 2
    
    return float(similarity)


def extract_key_points(text: str) -> List[str]:
    """
    从文本中提取关键点
    
    Args:
        text: 输入文本
        
    Returns:
        关键点列表
    """
    # 简化实现：按句号分割文本
    sentences = [s.strip() for s in text.split('。') if s.strip()]
    
    # 过滤掉过短的句子
    key_points = [s for s in sentences if len(s) >= 5]
    
    return key_points[:5]  # 最多返回5个关键点


def grade_subjective_answer(
    question: str,
    student_answer: str,
    standard_answer: str,
    max_score: int
) -> Dict:
    """
    主观题评分
    
    Args:
        question: 题目内容
        student_answer: 学生答案
        standard_answer: 标准答案
        max_score: 满分
        
    Returns:
        评分结果字典
        {
            'score': int,
            'feedback': str,
            'key_points': List[str]
        }
    """
    # 计算语义相似度
    similarity = calculate_semantic_similarity(student_answer, standard_answer)
    
    # 根据相似度计算分数
    score = int(similarity * max_score)
    
    # 提取标准答案的关键点
    key_points = extract_key_points(standard_answer)
    
    # 生成反馈
    if similarity >= 0.9:
        feedback = "回答优秀，完全理解了题目要点。"
    elif similarity >= 0.75:
        feedback = "回答良好，基本掌握了核心内容，但还有提升空间。"
    elif similarity >= 0.6:
        feedback = "回答一般，理解了部分要点，建议参考标准答案加深理解。"
    else:
        feedback = "回答需要改进，建议重新学习相关知识点。"
    
    return {
        'score': score,
        'feedback': feedback,
        'key_points': key_points
    }


def batch_grade_subjective(questions_data: List[Dict]) -> List[Dict]:
    """
    批量评分主观题
    
    Args:
        questions_data: 题目数据列表，每项包含question, student_answer, standard_answer, max_score
        
    Returns:
        评分结果列表
    """
    results = []
    
    for data in questions_data:
        result = grade_subjective_answer(
            data['question'],
            data['student_answer'],
            data['standard_answer'],
            data['max_score']
        )
        results.append(result)
    
    return results
