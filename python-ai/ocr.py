"""
OCR文字识别模块
使用pytesseract实现图片文字识别，支持图片预处理
"""

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import io
import os
from config import TESSERACT_PATH

# 配置Tesseract路径
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    图片预处理：灰度化、二值化、降噪
    
    Args:
        image: PIL Image对象
        
    Returns:
        预处理后的图片
    """
    # 转换为灰度图
    gray_image = image.convert('L')
    
    # 增强对比度
    enhancer = ImageEnhance.Contrast(gray_image)
    enhanced_image = enhancer.enhance(2.0)
    
    # 二值化处理
    threshold = 128
    binary_image = enhanced_image.point(lambda x: 0 if x < threshold else 255, '1')
    
    # 降噪处理
    denoised_image = binary_image.filter(ImageFilter.MedianFilter(size=3))
    
    return denoised_image


def recognize_text(image_data: bytes, image_format: str = 'jpg') -> dict:
    """
    识别图片中的文字
    
    Args:
        image_data: 图片二进制数据
        image_format: 图片格式 (jpg, png, pdf)
        
    Returns:
        包含识别文本和置信度的字典
        {
            'text': str,
            'confidence': float
        }
    """
    try:
        # 从字节数据加载图片
        image = Image.open(io.BytesIO(image_data))
        
        # 预处理图片
        processed_image = preprocess_image(image)
        
        # OCR识别（中文+英文）
        text = pytesseract.image_to_string(
            processed_image,
            lang='chi_sim+eng',
            config='--psm 6'  # 假设单列文本
        )
        
        # 获取置信度信息
        data = pytesseract.image_to_data(
            processed_image,
            lang='chi_sim+eng',
            output_type=pytesseract.Output.DICT
        )
        
        # 计算平均置信度
        confidences = [float(conf) for conf in data['conf'] if conf != '-1']
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return {
            'text': text.strip(),
            'confidence': avg_confidence / 100.0  # 转换为0-1范围
        }
        
    except Exception as e:
        print(f"OCR识别错误: {str(e)}")
        return {
            'text': '',
            'confidence': 0.0
        }


def recognize_text_from_file(file_path: str) -> dict:
    """
    从文件路径识别文字
    
    Args:
        file_path: 图片文件路径
        
    Returns:
        包含识别文本和置信度的字典
    """
    try:
        with open(file_path, 'rb') as f:
            image_data = f.read()
        
        # 获取文件扩展名
        ext = os.path.splitext(file_path)[1].lower().replace('.', '')
        
        return recognize_text(image_data, ext)
        
    except Exception as e:
        print(f"文件读取错误: {str(e)}")
        return {
            'text': '',
            'confidence': 0.0
        }
