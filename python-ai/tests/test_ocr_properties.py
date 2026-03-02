"""
OCR识别功能可用性属性测试
Feature: smart-education-platform, Property 19: OCR识别功能可用性
验证需求：5.2
"""

import pytest
from hypothesis import given, strategies as st, settings
from PIL import Image, ImageDraw, ImageFont
import io
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ocr import recognize_text, preprocess_image


def create_test_image_with_text(text: str, width: int = 400, height: int = 100) -> bytes:
    """
    创建包含指定文本的测试图片
    
    Args:
        text: 要渲染的文本
        width: 图片宽度
        height: 图片高度
        
    Returns:
        图片的字节数据
    """
    # 创建白色背景图片
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # 使用默认字体绘制文本
    try:
        # 尝试使用系统字体
        font = ImageFont.truetype("arial.ttf", 32)
    except:
        # 如果失败，使用默认字体
        font = ImageFont.load_default()
    
    # 在图片中心绘制文本
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    position = ((width - text_width) // 2, (height - text_height) // 2)
    draw.text(position, text, fill='black', font=font)
    
    # 转换为字节
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()


@settings(max_examples=100, deadline=5000)
@given(
    text=st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
        min_size=1,
        max_size=20
    )
)
def test_ocr_returns_result_for_any_text_image(text):
    """
    属性19：OCR识别功能可用性
    
    对于任何包含文本的图片，OCR模块应返回结果（包含text和confidence字段）
    """
    # 创建包含文本的测试图片
    image_data = create_test_image_with_text(text)
    
    # 调用OCR识别
    result = recognize_text(image_data, 'png')
    
    # 验证返回结果包含必需字段
    assert 'text' in result, "OCR结果应包含'text'字段"
    assert 'confidence' in result, "OCR结果应包含'confidence'字段"
    
    # 验证字段类型
    assert isinstance(result['text'], str), "text字段应为字符串类型"
    assert isinstance(result['confidence'], float), "confidence字段应为浮点数类型"
    
    # 验证置信度范围
    assert 0.0 <= result['confidence'] <= 1.0, "置信度应在0-1范围内"


def test_ocr_handles_empty_image():
    """
    测试OCR处理空白图片的情况
    """
    # 创建空白图片
    image = Image.new('RGB', (200, 100), color='white')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    image_data = img_byte_arr.getvalue()
    
    # 调用OCR识别
    result = recognize_text(image_data, 'png')
    
    # 验证返回结果结构正确
    assert 'text' in result
    assert 'confidence' in result
    assert isinstance(result['text'], str)
    assert isinstance(result['confidence'], float)


def test_ocr_handles_invalid_image_data():
    """
    测试OCR处理无效图片数据的情况
    """
    # 使用无效的图片数据
    invalid_data = b'not an image'
    
    # 调用OCR识别
    result = recognize_text(invalid_data, 'png')
    
    # 验证返回结果结构正确（即使识别失败）
    assert 'text' in result
    assert 'confidence' in result
    assert result['text'] == ''
    assert result['confidence'] == 0.0


def test_preprocess_image_maintains_image_type():
    """
    测试图片预处理保持图片对象类型
    """
    # 创建测试图片
    image = Image.new('RGB', (200, 100), color='white')
    
    # 预处理
    processed = preprocess_image(image)
    
    # 验证返回的是PIL Image对象
    assert isinstance(processed, Image.Image)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
