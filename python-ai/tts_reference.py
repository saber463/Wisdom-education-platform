#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文本转语音（TTS）模块 - 生成标准发音示范（需求20.4）
功能：
- 使用TTS生成标准发音音频
- 返回音频URL
- 支持英文和中文
"""

import os
import logging
import hashlib
from typing import Optional, Dict
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

# TTS配置
TTS_OUTPUT_DIR = "./data/tts_audio"
TTS_CACHE_DIR = "./data/tts_cache"
MAX_TEXT_LENGTH = 500  # 最大文本长度

# 确保输出目录存在
os.makedirs(TTS_OUTPUT_DIR, exist_ok=True)
os.makedirs(TTS_CACHE_DIR, exist_ok=True)


class TTSGenerator:
    """文本转语音生成器"""
    
    def __init__(self):
        """初始化TTS生成器"""
        self.cache = {}
        self._init_tts_engine()
    
    def _init_tts_engine(self):
        """初始化TTS引擎"""
        try:
            # 尝试导入gTTS（Google Text-to-Speech）
            try:
                from gtts import gTTS
                self.gtts_available = True
                self.gTTS = gTTS
                logger.info("✓ gTTS引擎已加载")
            except ImportError:
                logger.warning("gTTS未安装，使用本地TTS模拟")
                self.gtts_available = False
            
            # 尝试导入pyttsx3（本地TTS）
            try:
                import pyttsx3
                self.pyttsx3_available = True
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 150)  # 语速
                logger.info("✓ pyttsx3引擎已加载")
            except ImportError:
                logger.warning("pyttsx3未安装")
                self.pyttsx3_available = False
                
        except Exception as e:
            logger.warning(f"TTS引擎初始化失败: {e}")
            self.gtts_available = False
            self.pyttsx3_available = False
    
    def generate_reference_audio(
        self,
        text: str,
        language: str = "en",
        speaker_id: int = 0
    ) -> Dict:
        """
        生成标准发音示范音频
        
        Args:
            text: 要转换的文本
            language: 语言（en, zh）
            speaker_id: 说话人ID（用于选择不同的声音）
            
        Returns:
            包含音频URL和元数据的字典
        """
        try:
            # 验证输入
            if not text or len(text) > MAX_TEXT_LENGTH:
                return {
                    'success': False,
                    'error': f'文本长度必须在1-{MAX_TEXT_LENGTH}之间'
                }
            
            # 生成缓存键
            cache_key = self._generate_cache_key(text, language, speaker_id)
            
            # 检查缓存
            if cache_key in self.cache:
                logger.info(f"使用缓存的TTS音频: {cache_key}")
                return self.cache[cache_key]
            
            # 生成音频
            audio_filename = f"reference_{cache_key}.wav"
            audio_path = os.path.join(TTS_OUTPUT_DIR, audio_filename)
            
            # 尝试使用gTTS生成
            if self.gtts_available:
                result = self._generate_with_gtts(text, language, audio_path)
            # 尝试使用pyttsx3生成
            elif self.pyttsx3_available:
                result = self._generate_with_pyttsx3(text, language, audio_path)
            # 使用模拟生成
            else:
                result = self._generate_mock_audio(text, language, audio_path)
            
            # 缓存结果
            if result['success']:
                self.cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error(f"TTS生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_cache_key(self, text: str, language: str, speaker_id: int) -> str:
        """
        生成缓存键
        
        Args:
            text: 文本
            language: 语言
            speaker_id: 说话人ID
            
        Returns:
            缓存键
        """
        key_str = f"{text}_{language}_{speaker_id}"
        return hashlib.md5(key_str.encode()).hexdigest()[:16]
    
    def _generate_with_gtts(self, text: str, language: str, audio_path: str) -> Dict:
        """
        使用gTTS生成音频
        
        Args:
            text: 文本
            language: 语言
            audio_path: 输出路径
            
        Returns:
            结果字典
        """
        try:
            # 语言代码映射
            lang_map = {
                'en': 'en',
                'zh': 'zh-CN'
            }
            
            lang_code = lang_map.get(language, 'en')
            
            # 生成音频
            tts = self.gTTS(text=text, lang=lang_code, slow=False)
            tts.save(audio_path)
            
            # 获取文件大小
            file_size = os.path.getsize(audio_path)
            
            logger.info(f"✓ gTTS音频生成成功: {audio_path} ({file_size} bytes)")
            
            return {
                'success': True,
                'audio_url': f"/api/speech/reference/{os.path.basename(audio_path)}",
                'audio_path': audio_path,
                'file_size': file_size,
                'language': language,
                'engine': 'gtts',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"gTTS生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_with_pyttsx3(self, text: str, language: str, audio_path: str) -> Dict:
        """
        使用pyttsx3生成音频
        
        Args:
            text: 文本
            language: 语言
            audio_path: 输出路径
            
        Returns:
            结果字典
        """
        try:
            # 设置语言
            if language == 'zh':
                # 中文需要特殊处理
                self.engine.setProperty('voice', 'chinese')
            else:
                # 英文
                self.engine.setProperty('voice', 'english')
            
            # 保存音频
            self.engine.save_to_file(text, audio_path)
            self.engine.runAndWait()
            
            # 获取文件大小
            if os.path.exists(audio_path):
                file_size = os.path.getsize(audio_path)
                logger.info(f"✓ pyttsx3音频生成成功: {audio_path} ({file_size} bytes)")
                
                return {
                    'success': True,
                    'audio_url': f"/api/speech/reference/{os.path.basename(audio_path)}",
                    'audio_path': audio_path,
                    'file_size': file_size,
                    'language': language,
                    'engine': 'pyttsx3',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': '音频文件生成失败'
                }
            
        except Exception as e:
            logger.error(f"pyttsx3生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_mock_audio(self, text: str, language: str, audio_path: str) -> Dict:
        """
        生成模拟音频（用于测试）
        
        Args:
            text: 文本
            language: 语言
            audio_path: 输出路径
            
        Returns:
            结果字典
        """
        try:
            # 生成模拟音频数据
            # 音频长度基于文本长度
            duration = max(1, len(text) / 10)  # 大约每10个字符1秒
            sample_rate = 16000
            num_samples = int(duration * sample_rate)
            
            # 生成简单的正弦波
            frequency = 440  # A4音符
            t = np.linspace(0, duration, num_samples)
            audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
            
            # 保存为WAV文件
            import soundfile as sf
            sf.write(audio_path, audio_data, sample_rate)
            
            file_size = os.path.getsize(audio_path)
            logger.info(f"✓ 模拟音频生成成功: {audio_path} ({file_size} bytes)")
            
            return {
                'success': True,
                'audio_url': f"/api/speech/reference/{os.path.basename(audio_path)}",
                'audio_path': audio_path,
                'file_size': file_size,
                'language': language,
                'engine': 'mock',
                'duration': duration,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"模拟音频生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_cached_audio(self, text: str, language: str, speaker_id: int = 0) -> Optional[str]:
        """
        获取缓存的音频URL
        
        Args:
            text: 文本
            language: 语言
            speaker_id: 说话人ID
            
        Returns:
            音频URL或None
        """
        cache_key = self._generate_cache_key(text, language, speaker_id)
        if cache_key in self.cache:
            return self.cache[cache_key].get('audio_url')
        return None
    
    def clear_cache(self):
        """清空缓存"""
        self.cache.clear()
        logger.info("TTS缓存已清空")
    
    def get_cache_stats(self) -> Dict:
        """获取缓存统计信息"""
        return {
            'cache_size': len(self.cache),
            'gtts_available': self.gtts_available,
            'pyttsx3_available': self.pyttsx3_available,
            'output_dir': TTS_OUTPUT_DIR,
            'cache_dir': TTS_CACHE_DIR
        }


# 全局实例
_tts_instance = None


def get_tts_generator() -> TTSGenerator:
    """获取TTS生成器实例（单例）"""
    global _tts_instance
    if _tts_instance is None:
        _tts_instance = TTSGenerator()
    return _tts_instance


def generate_reference_audio(
    text: str,
    language: str = "en",
    speaker_id: int = 0
) -> Dict:
    """
    生成标准发音示范音频
    
    Args:
        text: 要转换的文本
        language: 语言（en, zh）
        speaker_id: 说话人ID
        
    Returns:
        包含音频URL和元数据的字典
    """
    generator = get_tts_generator()
    return generator.generate_reference_audio(text, language, speaker_id)


if __name__ == "__main__":
    logger.info("TTS参考音频生成模块已加载")
