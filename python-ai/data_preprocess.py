#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
真实教育数据集预处理脚本（CPU多核优化版）
功能：数据清洗、脱敏、格式标准化、训练/验证/测试集划分、缓存
"""

import os
import pandas as pd
import numpy as np
import librosa
import multiprocessing
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split
import psutil
import logging
from tqdm import tqdm

# ====================== 日志配置 ======================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_preprocess.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ====================== 全局配置 ======================
RAW_DATA_DIR = "./data/raw"
PROCESSED_DATA_DIR = "./data/processed"

# 文本数据列名映射（根据真实数据调整）
TEXT_COLUMNS = {
    "text": "content",      # 文本内容列名
    "label": "label",       # 标签列名
    "user_id": "user_id"    # 用户ID列名
}

# 音频配置
AUDIO_SR = 16000  # 统一采样率16kHz
AUDIO_MAX_LENGTH = 10  # 最大音频长度（秒）

# ====================== CPU优化配置 ======================
CPU_CORES = max(1, psutil.cpu_count() - 2)  # 预留2核给系统
os.environ["OMP_NUM_THREADS"] = str(CPU_CORES)
os.environ["MKL_NUM_THREADS"] = str(CPU_CORES)

# 创建目录
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
os.makedirs(RAW_DATA_DIR, exist_ok=True)

logger.info(f"CPU核心数: {psutil.cpu_count()}, 使用核心数: {CPU_CORES}")


def preprocess_text_data(file_path, task_name):
    """
    预处理文本数据（学情分析/资源推荐）
    
    Args:
        file_path: 原始CSV文件路径
        task_name: 任务名称（用于缓存命名）
    
    Returns:
        cache_path: 预处理后的数据集缓存路径
    """
    logger.info(f"="*60)
    logger.info(f"开始预处理 {task_name} 文本数据...")
    logger.info(f"数据文件: {file_path}")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        logger.error(f"数据文件不存在: {file_path}")
        logger.info(f"请将真实数据集放入 {RAW_DATA_DIR} 目录")
        return None
    
    # 读取CSV文件
    try:
        df = pd.read_csv(file_path, encoding="utf-8")
        logger.info(f"原始数据量: {len(df)} 条")
    except Exception as e:
        logger.error(f"读取CSV文件失败: {e}")
        return None
    
    # 数据清洗
    logger.info("执行数据清洗...")
    
    # 1. 删除缺失值
    original_len = len(df)
    df = df.dropna(subset=[TEXT_COLUMNS["text"], TEXT_COLUMNS["label"]])
    logger.info(f"删除缺失值: {original_len - len(df)} 条")
    
    # 2. 删除重复值
    original_len = len(df)
    df = df.drop_duplicates(subset=[TEXT_COLUMNS["text"]])
    logger.info(f"删除重复值: {original_len - len(df)} 条")
    
    # 3. 数据脱敏：用户ID哈希处理
    if TEXT_COLUMNS["user_id"] in df.columns:
        df["user_id_hash"] = df[TEXT_COLUMNS["user_id"]].apply(
            lambda x: hash(str(x)) % 1000000
        )
        df = df.drop(columns=[TEXT_COLUMNS["user_id"]])
        df = df.rename(columns={"user_id_hash": "user_id"})
        logger.info("用户ID已脱敏（哈希处理）")
    
    # 4. 标准化列名
    df = df.rename(columns={
        TEXT_COLUMNS["text"]: "content",
        TEXT_COLUMNS["label"]: "label"
    })
    
    logger.info(f"清洗后数据量: {len(df)} 条")
    
    # 划分训练/验证/测试集 (7:2:1)
    logger.info("划分训练/验证/测试集 (7:2:1)...")
    train_df, test_df = train_test_split(df, test_size=0.1, random_state=42)
    train_df, val_df = train_test_split(train_df, test_size=2/9, random_state=42)
    
    logger.info(f"训练集: {len(train_df)} 条")
    logger.info(f"验证集: {len(val_df)} 条")
    logger.info(f"测试集: {len(test_df)} 条")
    
    # 转为Dataset格式
    train_ds = Dataset.from_pandas(train_df.reset_index(drop=True))
    val_ds = Dataset.from_pandas(val_df.reset_index(drop=True))
    test_ds = Dataset.from_pandas(test_df.reset_index(drop=True))
    
    ds_dict = DatasetDict({
        "train": train_ds,
        "val": val_ds,
        "test": test_ds
    })
    
    # 缓存预处理结果
    cache_path = os.path.join(PROCESSED_DATA_DIR, f"{task_name}_dataset")
    ds_dict.save_to_disk(cache_path)
    
    logger.info(f"✓ {task_name} 数据预处理完成！")
    logger.info(f"缓存路径: {cache_path}")
    logger.info(f"="*60)
    
    return cache_path


def preprocess_audio_file(audio_path):
    """
    单音频文件预处理（口语评测专用）
    
    Args:
        audio_path: 音频文件路径
    
    Returns:
        dict: 包含音频特征和标签的字典
    """
    try:
        # 加载音频
        y, sr = librosa.load(audio_path, sr=AUDIO_SR, duration=AUDIO_MAX_LENGTH)
        
        # 提取MFCC特征（20维）
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        
        # 特征归一化
        mfcc = (mfcc - np.mean(mfcc)) / (np.std(mfcc) + 1e-8)
        
        # 假设标签是父目录名（根据实际数据调整）
        label = os.path.basename(os.path.dirname(audio_path))
        
        return {
            "audio_feature": mfcc.T.tolist(),  # 转置后保存
            "audio_name": os.path.basename(audio_path),
            "label": label
        }
    except Exception as e:
        logger.warning(f"处理音频 {audio_path} 失败: {e}")
        return None


def preprocess_audio_data(audio_dir, task_name):
    """
    预处理音频数据（口语评测），多核并行处理
    
    Args:
        audio_dir: 音频文件目录
        task_name: 任务名称
    
    Returns:
        cache_path: 预处理后的数据集缓存路径
    """
    logger.info(f"="*60)
    logger.info(f"开始预处理 {task_name} 音频数据...")
    logger.info(f"音频目录: {audio_dir}")
    
    # 检查目录是否存在
    if not os.path.exists(audio_dir):
        logger.error(f"音频目录不存在: {audio_dir}")
        logger.info(f"请将真实音频数据放入 {audio_dir} 目录")
        return None
    
    # 收集所有WAV文件
    audio_paths = []
    for root, _, files in os.walk(audio_dir):
        for file in files:
            if file.lower().endswith(".wav"):
                audio_paths.append(os.path.join(root, file))
    
    logger.info(f"找到音频文件: {len(audio_paths)} 个")
    
    if len(audio_paths) == 0:
        logger.error("未找到WAV格式音频文件")
        return None
    
    # 多核并行处理
    logger.info(f"使用 {CPU_CORES} 核并行处理音频...")
    with multiprocessing.Pool(CPU_CORES) as pool:
        results = list(tqdm(
            pool.imap(preprocess_audio_file, audio_paths),
            total=len(audio_paths),
            desc="处理音频"
        ))
    
    # 过滤无效数据
    results = [r for r in results if r is not None]
    logger.info(f"有效音频数据: {len(results)} 条")
    
    # 转为DataFrame
    df = pd.DataFrame(results)
    
    # 划分训练/验证/测试集
    logger.info("划分训练/验证/测试集 (7:2:1)...")
    train_df, test_df = train_test_split(df, test_size=0.1, random_state=42)
    train_df, val_df = train_test_split(train_df, test_size=2/9, random_state=42)
    
    logger.info(f"训练集: {len(train_df)} 条")
    logger.info(f"验证集: {len(val_df)} 条")
    logger.info(f"测试集: {len(test_df)} 条")
    
    # 转为Dataset格式
    train_ds = Dataset.from_pandas(train_df.reset_index(drop=True))
    val_ds = Dataset.from_pandas(val_df.reset_index(drop=True))
    test_ds = Dataset.from_pandas(test_df.reset_index(drop=True))
    
    ds_dict = DatasetDict({
        "train": train_ds,
        "val": val_ds,
        "test": test_ds
    })
    
    # 缓存结果
    cache_path = os.path.join(PROCESSED_DATA_DIR, f"{task_name}_dataset")
    ds_dict.save_to_disk(cache_path)
    
    logger.info(f"✓ {task_name} 音频数据预处理完成！")
    logger.info(f"缓存路径: {cache_path}")
    logger.info(f"="*60)
    
    return cache_path


if __name__ == "__main__":
    logger.info("="*60)
    logger.info("开始预处理真实教育数据集")
    logger.info("="*60)
    
    # 1. 预处理学情分析数据
    learning_analytics_path = os.path.join(RAW_DATA_DIR, "learning_analytics.csv")
    preprocess_text_data(learning_analytics_path, "learning_analytics")
    
    # 2. 预处理资源推荐数据
    resource_rec_path = os.path.join(RAW_DATA_DIR, "resource_recommendation.csv")
    preprocess_text_data(resource_rec_path, "resource_recommendation")
    
    # 3. 预处理口语评测音频数据
    speech_dir = os.path.join(RAW_DATA_DIR, "speech_assessment")
    preprocess_audio_data(speech_dir, "speech_assessment")
    
    logger.info("="*60)
    logger.info("✓ 所有真实数据预处理完成！")
    logger.info(f"预处理后的数据保存在: {PROCESSED_DATA_DIR}")
    logger.info("="*60)
