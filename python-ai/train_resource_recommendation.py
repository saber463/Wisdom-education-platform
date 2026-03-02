#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BERT资源推荐模型训练脚本（CPU极致优化版）
功能：基于真实教育数据训练BERT模型，用于个性化资源推荐
资源限制：CPU≤70%, 内存≤60%, 准确率目标≥88%
"""

import os
import sys
import time
import psutil
import torch
import numpy as np
from datasets import load_from_disk
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import logging
from threadpoolctl import threadpool_limits

# ====================== 日志配置 ======================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('train_resource_recommendation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ====================== CPU优化配置 ======================
CPU_CORES = max(1, psutil.cpu_count() - 2)
os.environ["OMP_NUM_THREADS"] = str(CPU_CORES)
os.environ["MKL_NUM_THREADS"] = str(CPU_CORES)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# 资源限制阈值
CPU_LIMIT = 70.0
MEMORY_LIMIT = 60.0

# ====================== 训练配置 ======================
MODEL_NAME = "bert-base-chinese"
OUTPUT_DIR = "./models/resource_recommendation"
PROCESSED_DATA_DIR = "./data/processed/resource_recommendation_dataset"

# CPU优化训练参数
BATCH_SIZE = 4
GRADIENT_ACCUMULATION_STEPS = 2
EPOCHS = 3
LEARNING_RATE = 2e-5
MAX_LENGTH = 128

# 准确率目标
ACCURACY_TARGET = 0.88

logger.info(f"CPU核心数: {psutil.cpu_count()}, 使用核心数: {CPU_CORES}")
logger.info(f"训练配置: batch_size={BATCH_SIZE}, epochs={EPOCHS}, lr={LEARNING_RATE}")


# ====================== 资源监控 ======================
class ResourceMonitor:
    """实时资源监控器"""
    
    def __init__(self):
        self.process = psutil.Process()
        self.start_time = time.time()
    
    def get_usage(self):
        """获取当前资源使用率"""
        cpu_percent = self.process.cpu_percent(interval=0.1)
        memory_percent = self.process.memory_percent()
        return cpu_percent, memory_percent
    
    def check_limits(self):
        """检查是否超过资源限制"""
        cpu, mem = self.get_usage()
        if cpu > CPU_LIMIT or mem > MEMORY_LIMIT:
            logger.warning(f"资源使用超限！CPU: {cpu:.1f}%, 内存: {mem:.1f}%")
            return False
        return True
    
    def log_usage(self):
        """记录资源使用情况"""
        cpu, mem = self.get_usage()
        elapsed = time.time() - self.start_time
        logger.info(f"资源使用 - CPU: {cpu:.1f}%, 内存: {mem:.1f}%, 运行时间: {elapsed/60:.1f}分钟")


# ====================== 数据加载 ======================
def load_dataset():
    """加载预处理后的数据集"""
    logger.info("="*60)
    logger.info("加载资源推荐数据集...")
    
    if not os.path.exists(PROCESSED_DATA_DIR):
        logger.error(f"数据集不存在: {PROCESSED_DATA_DIR}")
        logger.info("请先运行 data_preprocess.py 预处理数据")
        sys.exit(1)
    
    try:
        dataset = load_from_disk(PROCESSED_DATA_DIR)
        logger.info(f"✓ 数据集加载成功")
        logger.info(f"训练集: {len(dataset['train'])} 条")
        logger.info(f"验证集: {len(dataset['val'])} 条")
        logger.info(f"测试集: {len(dataset['test'])} 条")
        return dataset
    except Exception as e:
        logger.error(f"加载数据集失败: {e}")
        sys.exit(1)


# ====================== 数据预处理 ======================
def preprocess_function(examples, tokenizer):
    """Tokenize文本数据"""
    return tokenizer(
        examples["content"],
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH
    )


# ====================== 评估指标 ======================
def compute_metrics(eval_pred):
    """计算评估指标"""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    
    accuracy = accuracy_score(labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average='weighted', zero_division=0
    )
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }


# ====================== 主训练流程 ======================
def main():
    logger.info("="*60)
    logger.info("开始训练BERT资源推荐模型（CPU优化版）")
    logger.info("="*60)
    
    # 初始化资源监控
    monitor = ResourceMonitor()
    
    # 1. 加载数据集
    dataset = load_dataset()
    
    # 2. 加载tokenizer和模型
    logger.info("加载BERT模型和tokenizer...")
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    
    # 获取标签数量
    num_labels = len(set(dataset['train']['label']))
    logger.info(f"标签数量: {num_labels}")
    
    model = BertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=num_labels
    )
    
    # 强制使用CPU
    device = torch.device("cpu")
    model.to(device)
    logger.info(f"✓ 模型加载成功，使用设备: {device}")
    
    # 3. Tokenize数据集
    logger.info("Tokenize数据集...")
    with threadpool_limits(limits=CPU_CORES):
        tokenized_dataset = dataset.map(
            lambda x: preprocess_function(x, tokenizer),
            batched=True,
            remove_columns=dataset['train'].column_names
        )
    logger.info("✓ Tokenize完成")
    
    # 4. 配置训练参数
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        logging_dir='./logs/resource_recommendation',
        logging_steps=50,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
        save_total_limit=2,
        dataloader_num_workers=0,
        fp16=False,
        use_cpu=True,
        report_to="none"
    )
    
    # 5. 创建Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset['train'],
        eval_dataset=tokenized_dataset['val'],
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)]
    )
    
    # 6. 开始训练
    logger.info("="*60)
    logger.info("开始训练...")
    logger.info("="*60)
    
    try:
        train_result = trainer.train()
        logger.info("✓ 训练完成")
        
        # 记录训练结果
        logger.info(f"训练损失: {train_result.training_loss:.4f}")
        logger.info(f"训练时间: {train_result.metrics['train_runtime']/60:.1f}分钟")
        
    except Exception as e:
        logger.error(f"训练失败: {e}")
        sys.exit(1)
    
    # 7. 评估模型
    logger.info("="*60)
    logger.info("评估模型...")
    logger.info("="*60)
    
    eval_result = trainer.evaluate(tokenized_dataset['test'])
    
    logger.info(f"测试集准确率: {eval_result['eval_accuracy']:.4f}")
    logger.info(f"测试集精确率: {eval_result['eval_precision']:.4f}")
    logger.info(f"测试集召回率: {eval_result['eval_recall']:.4f}")
    logger.info(f"测试集F1分数: {eval_result['eval_f1']:.4f}")
    
    # 8. 检查准确率目标
    if eval_result['eval_accuracy'] >= ACCURACY_TARGET:
        logger.info(f"✓ 准确率达标！({eval_result['eval_accuracy']:.2%} >= {ACCURACY_TARGET:.2%})")
    else:
        logger.warning(f"⚠ 准确率未达标 ({eval_result['eval_accuracy']:.2%} < {ACCURACY_TARGET:.2%})")
        logger.warning("建议：增加训练数据量或调整超参数")
    
    # 9. 保存模型
    logger.info("保存模型...")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    logger.info(f"✓ 模型已保存到: {OUTPUT_DIR}")
    
    # 10. 最终资源使用报告
    monitor.log_usage()
    
    logger.info("="*60)
    logger.info("✓ BERT资源推荐模型训练完成！")
    logger.info("="*60)


if __name__ == "__main__":
    main()
