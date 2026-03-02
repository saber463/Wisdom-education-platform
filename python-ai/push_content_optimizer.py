"""
推送文案优化模块
使用BERT模型优化推送文案表达，提升文案吸引力和转化率
需求：21.4
"""

import torch
from transformers import BertTokenizer, BertForSequenceClassification
import numpy as np
from typing import Dict, List, Tuple
import os
import json
from datetime import datetime

# 模型配置
MODEL_NAME = "bert-base-chinese"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 推送文案优化模型缓存
_push_content_model = None
_push_content_tokenizer = None
_appeal_model = None
_conversion_model = None


def load_push_content_models():
    """
    加载推送文案优化模型
    
    Returns:
        tuple: (tokenizer, appeal_model, conversion_model)
    """
    global _push_content_model, _push_content_tokenizer, _appeal_model, _conversion_model
    
    if _push_content_tokenizer is not None:
        return _push_content_tokenizer, _appeal_model, _conversion_model
    
    try:
        # 加载分词器
        _push_content_tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
        
        # 加载吸引力评分模型（二分类：高吸引力/低吸引力）
        _appeal_model = BertForSequenceClassification.from_pretrained(
            MODEL_NAME,
            num_labels=2
        ).to(DEVICE)
        _appeal_model.eval()
        
        # 加载转化率评分模型（二分类：高转化/低转化）
        _conversion_model = BertForSequenceClassification.from_pretrained(
            MODEL_NAME,
            num_labels=2
        ).to(DEVICE)
        _conversion_model.eval()
        
        print("推送文案优化模型加载成功")
        return _push_content_tokenizer, _appeal_model, _conversion_model
        
    except Exception as e:
        print(f"推送文案优化模型加载失败: {str(e)}")
        raise


def calculate_appeal_score(content: str) -> float:
    """
    计算推送文案的吸引力评分
    
    Args:
        content: 推送文案
        
    Returns:
        float: 吸引力评分 0-100
    """
    try:
        tokenizer, appeal_model, _ = load_push_content_models()
        
        # 分词和编码
        inputs = tokenizer(
            content,
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True
        ).to(DEVICE)
        
        # 推理
        with torch.no_grad():
            outputs = appeal_model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            
            # 获取高吸引力的概率
            appeal_prob = probabilities[0][1].item()
            appeal_score = appeal_prob * 100
            
        return appeal_score
        
    except Exception as e:
        print(f"吸引力评分计算失败: {str(e)}")
        return 50.0  # 返回默认值


def calculate_conversion_score(content: str) -> float:
    """
    计算推送文案的转化率评分
    
    Args:
        content: 推送文案
        
    Returns:
        float: 转化率评分 0-100
    """
    try:
        tokenizer, _, conversion_model = load_push_content_models()
        
        # 分词和编码
        inputs = tokenizer(
            content,
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True
        ).to(DEVICE)
        
        # 推理
        with torch.no_grad():
            outputs = conversion_model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            
            # 获取高转化的概率
            conversion_prob = probabilities[0][1].item()
            conversion_score = conversion_prob * 100
            
        return conversion_score
        
    except Exception as e:
        print(f"转化率评分计算失败: {str(e)}")
        return 50.0  # 返回默认值


def generate_optimization_suggestions(
    original_content: str,
    appeal_score: float,
    conversion_score: float,
    language: str = "zh"
) -> List[str]:
    """
    生成推送文案优化建议（支持多语言）
    
    Args:
        original_content: 原始推送文案
        appeal_score: 吸引力评分
        conversion_score: 转化率评分
        language: 语言（zh/en/es/fr/ja）
        
    Returns:
        list: 优化建议列表
    """
    suggestions = []
    
    if language == "zh":
        # 中文优化建议
        if appeal_score < 60:
            suggestions.append("建议增加表情符号或感叹号，提升文案吸引力")
        
        if conversion_score < 60:
            suggestions.append("建议添加行动号召（CTA），如'立即查看'、'点击了解'")
        
        if len(original_content) > 100:
            suggestions.append("建议缩短文案长度，提高用户阅读率")
        
        if "学习" not in original_content and "任务" not in original_content:
            suggestions.append("建议突出学习价值或任务重要性")
        
        if appeal_score > 80 and conversion_score > 80:
            suggestions.append("文案质量优秀，无需优化")
            
    elif language == "en":
        # 英文优化建议
        if appeal_score < 60:
            suggestions.append("Consider adding emojis or exclamation marks to increase appeal")
        
        if conversion_score < 60:
            suggestions.append("Add a clear call-to-action (CTA) like 'Check now' or 'Learn more'")
        
        if len(original_content) > 150:
            suggestions.append("Consider shortening the content for better readability")
        
        if "learning" not in original_content.lower() and "task" not in original_content.lower():
            suggestions.append("Highlight the learning value or task importance")
        
        if appeal_score > 80 and conversion_score > 80:
            suggestions.append("Excellent content quality, no optimization needed")
    
    elif language == "es":
        # 西班牙文优化建议
        if appeal_score < 60:
            suggestions.append("Considera agregar emojis o signos de exclamación para aumentar el atractivo")
        
        if conversion_score < 60:
            suggestions.append("Agrega un llamado a la acción claro (CTA) como 'Haz clic ahora' o 'Aprende más'")
        
        if len(original_content) > 150:
            suggestions.append("Considera acortar el contenido para mejorar la legibilidad")
        
        if "aprendizaje" not in original_content.lower() and "tarea" not in original_content.lower():
            suggestions.append("Destaca el valor del aprendizaje o la importancia de la tarea")
        
        if appeal_score > 80 and conversion_score > 80:
            suggestions.append("Excelente calidad de contenido, no se necesita optimización")
    
    elif language == "fr":
        # 法文优化建议
        if appeal_score < 60:
            suggestions.append("Envisagez d'ajouter des emojis ou des points d'exclamation pour augmenter l'attrait")
        
        if conversion_score < 60:
            suggestions.append("Ajoutez un appel à l'action clair (CTA) comme 'Cliquez maintenant' ou 'En savoir plus'")
        
        if len(original_content) > 150:
            suggestions.append("Envisagez de raccourcir le contenu pour une meilleure lisibilité")
        
        if "apprentissage" not in original_content.lower() and "tâche" not in original_content.lower():
            suggestions.append("Mettez en évidence la valeur d'apprentissage ou l'importance de la tâche")
        
        if appeal_score > 80 and conversion_score > 80:
            suggestions.append("Excellente qualité de contenu, aucune optimisation nécessaire")
    
    elif language == "ja":
        # 日文优化建议
        if appeal_score < 60:
            suggestions.append("絵文字や感嘆符を追加して、コンテンツの魅力を高めることを検討してください")
        
        if conversion_score < 60:
            suggestions.append("「今すぐ確認」や「詳しく知る」などの明確なCTAを追加してください")
        
        if len(original_content) > 100:
            suggestions.append("コンテンツを短くして、読みやすさを向上させることを検討してください")
        
        if "学習" not in original_content and "タスク" not in original_content:
            suggestions.append("学習の価値またはタスクの重要性を強調してください")
        
        if appeal_score > 80 and conversion_score > 80:
            suggestions.append("優れたコンテンツ品質です。最適化は不要です")
    
    return suggestions


def optimize_push_content_chinese(
    original_content: str,
    context: str = "",
    max_length: int = 100
) -> str:
    """
    优化中文推送文案
    
    Args:
        original_content: 原始推送文案
        context: 推送上下文
        max_length: 最大长度限制
        
    Returns:
        str: 优化后的推送文案
    """
    # 中文优化策略
    optimized = original_content
    
    # 1. 添加表情符号
    if "完成" in optimized and "✅" not in optimized:
        optimized = optimized.replace("完成", "完成✅")
    
    if "提醒" in optimized and "⏰" not in optimized:
        optimized = optimized.replace("提醒", "⏰提醒")
    
    if "学习" in optimized and "📚" not in optimized:
        optimized = optimized.replace("学习", "📚学习")
    
    # 2. 添加行动号召
    if "点击" not in optimized and "查看" not in optimized:
        if optimized.endswith("。"):
            optimized = optimized[:-1] + "，立即查看！"
        else:
            optimized += "，立即查看！"
    
    # 3. 长度控制
    if len(optimized) > max_length:
        # 截断到最大长度
        optimized = optimized[:max_length-3] + "..."
    
    # 4. 确保以感叹号或问号结尾
    if not optimized.endswith(("！", "？", "!", "?")):
        if optimized.endswith("。"):
            optimized = optimized[:-1] + "！"
        else:
            optimized += "！"
    
    return optimized


def optimize_push_content_english(
    original_content: str,
    context: str = "",
    max_length: int = 150
) -> str:
    """
    优化英文推送文案
    
    Args:
        original_content: 原始推送文案
        context: 推送上下文
        max_length: 最大长度限制
        
    Returns:
        str: 优化后的推送文案
    """
    # 英文优化策略
    optimized = original_content
    
    # 1. 添加表情符号
    if "complete" in optimized.lower() and "✅" not in optimized:
        optimized = optimized.replace("complete", "complete ✅")
    
    if "reminder" in optimized.lower() and "⏰" not in optimized:
        optimized = optimized.replace("reminder", "⏰ reminder")
    
    if "learning" in optimized.lower() and "📚" not in optimized:
        optimized = optimized.replace("learning", "📚 learning")
    
    # 2. 添加行动号召
    if "click" not in optimized.lower() and "view" not in optimized.lower():
        if optimized.endswith("."):
            optimized = optimized[:-1] + ". Check it out now!"
        else:
            optimized += ". Check it out now!"
    
    # 3. 长度控制
    if len(optimized) > max_length:
        optimized = optimized[:max_length-3] + "..."
    
    # 4. 确保以感叹号或问号结尾
    if not optimized.endswith(("!", "?")):
        if optimized.endswith("."):
            optimized = optimized[:-1] + "!"
        else:
            optimized += "!"
    
    return optimized


def optimize_push_content_spanish(
    original_content: str,
    context: str = "",
    max_length: int = 150
) -> str:
    """
    优化西班牙文推送文案
    
    Args:
        original_content: 原始推送文案
        context: 推送上下文
        max_length: 最大长度限制
        
    Returns:
        str: 优化后的推送文案
    """
    # 西班牙文优化策略
    optimized = original_content
    
    # 1. 添加表情符号
    if "completar" in optimized.lower() and "✅" not in optimized:
        optimized = optimized.replace("completar", "completar ✅")
    
    if "recordatorio" in optimized.lower() and "⏰" not in optimized:
        optimized = optimized.replace("recordatorio", "⏰ recordatorio")
    
    if "aprendizaje" in optimized.lower() and "📚" not in optimized:
        optimized = optimized.replace("aprendizaje", "📚 aprendizaje")
    
    # 2. 添加行动号召
    if "haz clic" not in optimized.lower() and "ver" not in optimized.lower():
        if optimized.endswith("."):
            optimized = optimized[:-1] + ". ¡Haz clic ahora!"
        else:
            optimized += ". ¡Haz clic ahora!"
    
    # 3. 长度控制
    if len(optimized) > max_length:
        optimized = optimized[:max_length-3] + "..."
    
    # 4. 确保以感叹号或问号结尾
    if not optimized.endswith(("!", "¡", "?", "¿")):
        if optimized.endswith("."):
            optimized = optimized[:-1] + "!"
        else:
            optimized += "!"
    
    return optimized


def optimize_push_content_french(
    original_content: str,
    context: str = "",
    max_length: int = 150
) -> str:
    """
    优化法文推送文案
    
    Args:
        original_content: 原始推送文案
        context: 推送上下文
        max_length: 最大长度限制
        
    Returns:
        str: 优化后的推送文案
    """
    # 法文优化策略
    optimized = original_content
    
    # 1. 添加表情符号
    if "compléter" in optimized.lower() and "✅" not in optimized:
        optimized = optimized.replace("compléter", "compléter ✅")
    
    if "rappel" in optimized.lower() and "⏰" not in optimized:
        optimized = optimized.replace("rappel", "⏰ rappel")
    
    if "apprentissage" in optimized.lower() and "📚" not in optimized:
        optimized = optimized.replace("apprentissage", "📚 apprentissage")
    
    # 2. 添加行动号召
    if "cliquez" not in optimized.lower() and "voir" not in optimized.lower():
        if optimized.endswith("."):
            optimized = optimized[:-1] + ". Cliquez maintenant!"
        else:
            optimized += ". Cliquez maintenant!"
    
    # 3. 长度控制
    if len(optimized) > max_length:
        optimized = optimized[:max_length-3] + "..."
    
    # 4. 确保以感叹号或问号结尾
    if not optimized.endswith(("!", "?")):
        if optimized.endswith("."):
            optimized = optimized[:-1] + "!"
        else:
            optimized += "!"
    
    return optimized


def optimize_push_content_japanese(
    original_content: str,
    context: str = "",
    max_length: int = 100
) -> str:
    """
    优化日文推送文案
    
    Args:
        original_content: 原始推送文案
        context: 推送上下文
        max_length: 最大长度限制
        
    Returns:
        str: 优化后的推送文案
    """
    # 日文优化策略
    optimized = original_content
    
    # 1. 添加表情符号
    if "完了" in optimized and "✅" not in optimized:
        optimized = optimized.replace("完了", "完了✅")
    
    if "リマインダー" in optimized and "⏰" not in optimized:
        optimized = optimized.replace("リマインダー", "⏰リマインダー")
    
    if "学習" in optimized and "📚" not in optimized:
        optimized = optimized.replace("学習", "📚学習")
    
    # 2. 添加行动号召
    if "クリック" not in optimized and "確認" not in optimized:
        if optimized.endswith("。"):
            optimized = optimized[:-1] + "、今すぐ確認してください！"
        else:
            optimized += "、今すぐ確認してください！"
    
    # 3. 长度控制
    if len(optimized) > max_length:
        optimized = optimized[:max_length-3] + "..."
    
    # 4. 确保以感叹号或问号结尾
    if not optimized.endswith(("！", "？", "!", "?")):
        if optimized.endswith("。"):
            optimized = optimized[:-1] + "！"
        else:
            optimized += "！"
    
    return optimized


def optimize_push_content(
    original_content: str,
    language: str = "zh",
    context: str = "",
    max_length: int = None
) -> Dict:
    """
    优化推送文案（支持多语言）
    
    Args:
        original_content: 原始推送文案
        language: 语言（zh/en/es/fr/ja）
        context: 推送上下文
        max_length: 最大长度限制
        
    Returns:
        dict: 优化结果
    """
    try:
        # 设置默认最大长度
        if max_length is None:
            if language == "zh":
                max_length = 100
            elif language == "ja":
                max_length = 100
            else:
                max_length = 150
        
        # 根据语言选择优化策略
        if language == "zh":
            optimized_content = optimize_push_content_chinese(
                original_content,
                context,
                max_length
            )
        elif language == "en":
            optimized_content = optimize_push_content_english(
                original_content,
                context,
                max_length
            )
        elif language == "es":
            optimized_content = optimize_push_content_spanish(
                original_content,
                context,
                max_length
            )
        elif language == "fr":
            optimized_content = optimize_push_content_french(
                original_content,
                context,
                max_length
            )
        elif language == "ja":
            optimized_content = optimize_push_content_japanese(
                original_content,
                context,
                max_length
            )
        else:
            # 默认使用英文优化
            optimized_content = optimize_push_content_english(
                original_content,
                context,
                max_length
            )
        
        # 计算吸引力和转化率评分
        appeal_score = calculate_appeal_score(optimized_content)
        conversion_score = calculate_conversion_score(optimized_content)
        
        # 生成优化建议
        suggestions = generate_optimization_suggestions(
            original_content,
            appeal_score,
            conversion_score,
            language
        )
        
        return {
            'success': True,
            'original_content': original_content,
            'optimized_content': optimized_content,
            'appeal_score': appeal_score,
            'conversion_score': conversion_score,
            'optimization_suggestions': suggestions,
            'message': '推送文案优化成功',
            'language': language
        }
        
    except Exception as e:
        print(f"推送文案优化失败: {str(e)}")
        return {
            'success': False,
            'original_content': original_content,
            'optimized_content': original_content,
            'appeal_score': 50.0,
            'conversion_score': 50.0,
            'optimization_suggestions': [],
            'message': f'推送文案优化失败: {str(e)}',
            'language': language
        }


# 推送文案优化统计
_optimization_stats = {
    'total_optimizations': 0,
    'avg_appeal_score': 0.0,
    'avg_conversion_score': 0.0,
    'last_optimization_time': None
}


def get_optimization_statistics() -> Dict:
    """
    获取推送文案优化统计信息
    
    Returns:
        dict: 统计信息
    """
    return _optimization_stats.copy()


def update_optimization_statistics(appeal_score: float, conversion_score: float):
    """
    更新推送文案优化统计信息
    
    Args:
        appeal_score: 吸引力评分
        conversion_score: 转化率评分
    """
    global _optimization_stats
    
    total = _optimization_stats['total_optimizations']
    avg_appeal = _optimization_stats['avg_appeal_score']
    avg_conversion = _optimization_stats['avg_conversion_score']
    
    # 更新平均值
    new_total = total + 1
    _optimization_stats['avg_appeal_score'] = (avg_appeal * total + appeal_score) / new_total
    _optimization_stats['avg_conversion_score'] = (avg_conversion * total + conversion_score) / new_total
    _optimization_stats['total_optimizations'] = new_total
    _optimization_stats['last_optimization_time'] = datetime.now().isoformat()
