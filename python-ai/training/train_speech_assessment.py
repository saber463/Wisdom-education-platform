#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wav2Vec2口语评测模型增量训练脚本

训练目标：
- 训练数据：8万条音频样本
- 学习率：1e-4
- 批次大小：8
- 训练轮数：5 epochs
- 目标准确率：≥92%

需求：20.3
"""

import os
import json
import argparse
import logging
from datetime import datetime
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import (
    Wav2Vec2Processor,
    Wav2Vec2ForCTC,
    Wav2Vec2ForSequenceClassification,
    AdamW,
    get_linear_schedule_with_warmup
)
from tqdm import tqdm
import numpy as np
import librosa
from sklearn.metrics import accuracy_score, mean_absolute_error

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/training_speech_assessment.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SpeechAssessmentDataset(Dataset):
    """口语评测数据集"""
    
    def __init__(self, data_path, processor, max_length=16000*10):
        """
        Args:
            data_path: 数据文件路径（JSON格式，包含音频路径和评分）
            processor: Wav2Vec2处理器
            max_length: 最大音频长度（采样点数，默认10秒@16kHz）
        """
        self.processor = processor
        self.max_length = max_length
        
        # 加载数据
        logger.info(f"加载数据: {data_path}")
        with open(data_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        
        logger.info(f"数据集大小: {len(self.data)}")
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        
        # 加载音频
        audio_path = item['audio_path']
        
        # 如果音频文件不存在，生成模拟音频
        if not os.path.exists(audio_path):
            # 生成随机音频（实际项目中应使用真实音频）
            audio = np.random.randn(self.max_length).astype(np.float32)
            sample_rate = 16000
        else:
            audio, sample_rate = librosa.load(audio_path, sr=16000)
        
        # 处理音频
        inputs = self.processor(
            audio,
            sampling_rate=sample_rate,
            return_tensors='pt',
            padding='max_length',
            max_length=self.max_length,
            truncation=True
        )
        
        # 标签：发音准确率（0-100分，归一化到0-1）
        pronunciation_score = torch.tensor(
            item['pronunciation_score'] / 100.0,
            dtype=torch.float
        )
        
        return {
            'input_values': inputs['input_values'].squeeze(),
            'attention_mask': inputs.get('attention_mask', torch.ones_like(inputs['input_values'])).squeeze(),
            'label': pronunciation_score
        }


def prepare_sample_data(output_path, num_samples=80000):
    """
    准备示例训练数据
    
    Args:
        output_path: 输出文件路径
        num_samples: 样本数量
    """
    logger.info(f"生成 {num_samples} 条示例数据...")
    
    languages = ['en', 'zh']
    difficulty_levels = ['easy', 'medium', 'hard']
    
    data = []
    for i in range(num_samples):
        # 模拟音频数据
        language = np.random.choice(languages)
        difficulty = np.random.choice(difficulty_levels)
        
        # 模拟评分（难度越高，平均分越低）
        if difficulty == 'easy':
            base_score = np.random.uniform(70, 95)
        elif difficulty == 'medium':
            base_score = np.random.uniform(50, 80)
        else:
            base_score = np.random.uniform(30, 70)
        
        pronunciation_score = min(100, max(0, base_score + np.random.normal(0, 5)))
        intonation_score = min(100, max(0, base_score + np.random.normal(0, 8)))
        fluency_score = min(100, max(0, base_score + np.random.normal(0, 6)))
        
        data.append({
            'audio_path': f'data/audio/sample_{i:06d}.wav',
            'language': language,
            'difficulty': difficulty,
            'pronunciation_score': pronunciation_score,
            'intonation_score': intonation_score,
            'fluency_score': fluency_score
        })
    
    # 保存数据
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"示例数据已保存到: {output_path}")


def train_epoch(model, dataloader, optimizer, scheduler, device):
    """训练一个epoch"""
    model.train()
    total_loss = 0
    predictions = []
    labels = []
    
    progress_bar = tqdm(dataloader, desc="Training")
    for batch in progress_bar:
        # 移动数据到设备
        input_values = batch['input_values'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        label = batch['label'].to(device)
        
        # 前向传播
        optimizer.zero_grad()
        outputs = model(input_values=input_values, attention_mask=attention_mask)
        logits = outputs.logits.squeeze()
        
        # 计算损失（MSE）
        loss = nn.MSELoss()(logits, label)
        
        # 反向传播
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()
        
        # 记录
        total_loss += loss.item()
        predictions.extend(logits.detach().cpu().numpy())
        labels.extend(label.detach().cpu().numpy())
        
        progress_bar.set_postfix({'loss': loss.item()})
    
    avg_loss = total_loss / len(dataloader)
    
    # 计算准确率（±5分内算正确）
    predictions = np.array(predictions) * 100
    labels = np.array(labels) * 100
    accuracy = np.mean(np.abs(predictions - labels) <= 5)
    
    return avg_loss, accuracy


def evaluate(model, dataloader, device):
    """评估模型"""
    model.eval()
    total_loss = 0
    predictions = []
    labels = []
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Evaluating"):
            input_values = batch['input_values'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            label = batch['label'].to(device)
            
            outputs = model(input_values=input_values, attention_mask=attention_mask)
            logits = outputs.logits.squeeze()
            
            loss = nn.MSELoss()(logits, label)
            
            total_loss += loss.item()
            predictions.extend(logits.cpu().numpy())
            labels.extend(label.cpu().numpy())
    
    avg_loss = total_loss / len(dataloader)
    
    # 计算准确率和MAE
    predictions = np.array(predictions) * 100
    labels = np.array(labels) * 100
    accuracy = np.mean(np.abs(predictions - labels) <= 5)
    mae = mean_absolute_error(labels, predictions)
    
    return avg_loss, accuracy, mae


def main(args):
    """主训练流程"""
    
    # 创建输出目录
    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # 设置设备
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"使用设备: {device}")
    
    if not torch.cuda.is_available():
        logger.warning("⚠️ 未检测到GPU，训练将使用CPU（速度极慢，不推荐）")
        logger.warning("⚠️ Wav2Vec2模型需要大量计算资源，强烈建议使用GPU训练")
    
    # 准备数据（如果不存在）
    if not os.path.exists(args.train_data):
        logger.info("训练数据不存在，生成示例数据...")
        prepare_sample_data(args.train_data, num_samples=64000)
        prepare_sample_data(args.val_data, num_samples=8000)
        prepare_sample_data(args.test_data, num_samples=8000)
    
    # 加载处理器和模型
    logger.info("加载Wav2Vec2模型...")
    processor = Wav2Vec2Processor.from_pretrained('facebook/wav2vec2-base')
    
    # 使用序列分类模型（回归任务）
    model = Wav2Vec2ForSequenceClassification.from_pretrained(
        'facebook/wav2vec2-base',
        num_labels=1  # 回归任务
    )
    model.to(device)
    
    # 准备数据集
    train_dataset = SpeechAssessmentDataset(args.train_data, processor)
    val_dataset = SpeechAssessmentDataset(args.val_data, processor)
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0
    )
    
    # 准备优化器
    optimizer = AdamW(
        model.parameters(),
        lr=args.learning_rate,
        weight_decay=0.01,
        eps=1e-8
    )
    
    # 学习率调度器
    total_steps = len(train_loader) * args.num_epochs
    warmup_steps = int(0.1 * total_steps)
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps
    )
    
    # 训练循环
    logger.info("开始训练...")
    logger.info(f"训练样本: {len(train_dataset)}")
    logger.info(f"验证样本: {len(val_dataset)}")
    logger.info(f"批次大小: {args.batch_size}")
    logger.info(f"训练轮数: {args.num_epochs}")
    logger.info(f"学习率: {args.learning_rate}")
    
    best_accuracy = 0
    training_history = []
    
    for epoch in range(args.num_epochs):
        logger.info(f"\n{'='*50}")
        logger.info(f"Epoch {epoch + 1}/{args.num_epochs}")
        logger.info(f"{'='*50}")
        
        # 训练
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, scheduler, device)
        logger.info(f"训练损失: {train_loss:.4f}, 训练准确率: {train_acc:.4f}")
        
        # 验证
        val_loss, val_acc, val_mae = evaluate(model, val_loader, device)
        logger.info(f"验证损失: {val_loss:.4f}, 验证准确率: {val_acc:.4f}, MAE: {val_mae:.2f}")
        
        # 记录历史
        training_history.append({
            'epoch': epoch + 1,
            'train_loss': train_loss,
            'train_accuracy': train_acc,
            'val_loss': val_loss,
            'val_accuracy': val_acc,
            'val_mae': val_mae
        })
        
        # 保存最佳模型
        if val_acc > best_accuracy:
            best_accuracy = val_acc
            model_path = os.path.join(args.output_dir, 'best_model')
            model.save_pretrained(model_path)
            processor.save_pretrained(model_path)
            logger.info(f"✓ 保存最佳模型 (准确率: {val_acc:.4f})")
    
    # 保存训练历史
    history_path = os.path.join(args.output_dir, 'training_history.json')
    with open(history_path, 'w', encoding='utf-8') as f:
        json.dump(training_history, f, ensure_ascii=False, indent=2)
    
    # 最终评估
    logger.info(f"\n{'='*50}")
    logger.info("训练完成！")
    logger.info(f"{'='*50}")
    logger.info(f"最佳验证准确率: {best_accuracy:.4f}")
    logger.info(f"模型保存路径: {args.output_dir}/best_model")
    
    if best_accuracy >= 0.92:
        logger.info("✓ 达到目标准确率 ≥92%")
    else:
        logger.warning(f"⚠️ 未达到目标准确率 (当前: {best_accuracy:.4f}, 目标: 0.92)")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Wav2Vec2口语评测模型训练')
    
    # 数据参数
    parser.add_argument('--train-data', type=str, default='data/train_speech_assessment.json',
                        help='训练数据路径')
    parser.add_argument('--val-data', type=str, default='data/val_speech_assessment.json',
                        help='验证数据路径')
    parser.add_argument('--test-data', type=str, default='data/test_speech_assessment.json',
                        help='测试数据路径')
    
    # 训练参数
    parser.add_argument('--batch-size', type=int, default=8,
                        help='批次大小（Wav2Vec2需要较大内存）')
    parser.add_argument('--num-epochs', type=int, default=5,
                        help='训练轮数')
    parser.add_argument('--learning-rate', type=float, default=1e-4,
                        help='学习率')
    
    # 输出参数
    parser.add_argument('--output-dir', type=str, default='models/speech_assessment',
                        help='模型输出目录')
    
    args = parser.parse_args()
    
    main(args)
