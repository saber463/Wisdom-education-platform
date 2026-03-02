#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BERT学情分析模型增量训练脚本

训练目标：
- 训练数据：5万条学情分析样本
- 学习率：2e-5
- 批次大小：16
- 训练轮数：3 epochs
- 目标准确率：≥95%

需求：16.2
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
    BertTokenizer,
    BertForSequenceClassification,
    AdamW,
    get_linear_schedule_with_warmup
)
from tqdm import tqdm
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/training_learning_analytics.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class LearningAnalyticsDataset(Dataset):
    """学情分析数据集"""
    
    def __init__(self, data_path, tokenizer, max_length=512):
        """
        Args:
            data_path: 数据文件路径（JSON格式）
            tokenizer: BERT分词器
            max_length: 最大序列长度
        """
        self.tokenizer = tokenizer
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
        
        # 构建输入文本：学习路径 + 错题记录 + 答题速度
        text = f"学习路径: {item['learning_path']} | 错题记录: {item['error_records']} | 答题速度: {item['answer_speed']}"
        
        # 分词
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        # 标签：知识点掌握度（0-100分，归一化到0-1）
        label = torch.tensor(item['mastery_score'] / 100.0, dtype=torch.float)
        
        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'label': label
        }


def prepare_sample_data(output_path, num_samples=50000):
    """
    准备示例训练数据（实际项目中需要真实数据）
    
    Args:
        output_path: 输出文件路径
        num_samples: 样本数量
    """
    logger.info(f"生成 {num_samples} 条示例数据...")
    
    knowledge_points = ['代数', '几何', '函数', '概率', '统计', '三角函数', '向量', '数列']
    
    data = []
    for i in range(num_samples):
        # 模拟学习数据
        completed_points = np.random.randint(0, len(knowledge_points))
        error_count = np.random.randint(0, 20)
        avg_speed = np.random.uniform(30, 180)  # 秒
        
        # 计算掌握度（简化模型）
        mastery_score = min(100, max(0, 
            (completed_points / len(knowledge_points)) * 100 - error_count * 2
        ))
        
        data.append({
            'learning_path': f"已完成{completed_points}/{len(knowledge_points)}个知识点",
            'error_records': f"错误{error_count}次",
            'answer_speed': f"平均{avg_speed:.1f}秒/题",
            'mastery_score': mastery_score
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
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        label = batch['label'].to(device)
        
        # 前向传播
        optimizer.zero_grad()
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
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
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            label = batch['label'].to(device)
            
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits.squeeze()
            
            loss = nn.MSELoss()(logits, label)
            
            total_loss += loss.item()
            predictions.extend(logits.cpu().numpy())
            labels.extend(label.cpu().numpy())
    
    avg_loss = total_loss / len(dataloader)
    
    # 计算准确率
    predictions = np.array(predictions) * 100
    labels = np.array(labels) * 100
    accuracy = np.mean(np.abs(predictions - labels) <= 5)
    mae = np.mean(np.abs(predictions - labels))
    
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
        logger.warning("⚠️ 未检测到GPU，训练将使用CPU（速度较慢）")
    
    # 准备数据（如果不存在）
    if not os.path.exists(args.train_data):
        logger.info("训练数据不存在，生成示例数据...")
        prepare_sample_data(args.train_data, num_samples=40000)
        prepare_sample_data(args.val_data, num_samples=5000)
        prepare_sample_data(args.test_data, num_samples=5000)
    
    # 加载分词器和模型
    logger.info("加载BERT模型...")
    tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
    model = BertForSequenceClassification.from_pretrained(
        'bert-base-chinese',
        num_labels=1  # 回归任务
    )
    model.to(device)
    
    # 准备数据集
    train_dataset = LearningAnalyticsDataset(args.train_data, tokenizer)
    val_dataset = LearningAnalyticsDataset(args.val_data, tokenizer)
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0  # Windows兼容
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
            tokenizer.save_pretrained(model_path)
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
    
    if best_accuracy >= 0.95:
        logger.info("✓ 达到目标准确率 ≥95%")
    else:
        logger.warning(f"⚠️ 未达到目标准确率 (当前: {best_accuracy:.4f}, 目标: 0.95)")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='BERT学情分析模型训练')
    
    # 数据参数
    parser.add_argument('--train-data', type=str, default='data/train_learning_analytics.json',
                        help='训练数据路径')
    parser.add_argument('--val-data', type=str, default='data/val_learning_analytics.json',
                        help='验证数据路径')
    parser.add_argument('--test-data', type=str, default='data/test_learning_analytics.json',
                        help='测试数据路径')
    
    # 训练参数
    parser.add_argument('--batch-size', type=int, default=16,
                        help='批次大小')
    parser.add_argument('--num-epochs', type=int, default=3,
                        help='训练轮数')
    parser.add_argument('--learning-rate', type=float, default=2e-5,
                        help='学习率')
    
    # 输出参数
    parser.add_argument('--output-dir', type=str, default='models/learning_analytics',
                        help='模型输出目录')
    
    args = parser.parse_args()
    
    main(args)
