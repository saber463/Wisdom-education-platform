# AI模型增量训练指南

## 概述

本目录包含智慧教育平台AI模型的增量训练脚本和配置文件。

## 训练任务

### 1. BERT学情分析模型训练
- **训练数据**: 5万条学情分析样本
- **训练参数**: 学习率2e-5，批次16
- **训练轮数**: 3 epochs
- **目标准确率**: ≥95%
- **脚本**: `train_learning_analytics.py`

### 2. BERT资源推荐模型训练
- **训练数据**: 3万条资源推荐样本
- **训练参数**: 学习率2e-5，批次16
- **训练轮数**: 3 epochs
- **目标准确率**: ≥90%
- **脚本**: `train_resource_recommendation.py`

### 3. Wav2Vec2口语评测模型训练
- **训练数据**: 8万条音频样本
- **训练参数**: 学习率1e-4，批次8
- **训练轮数**: 5 epochs
- **目标准确率**: ≥92%
- **脚本**: `train_speech_assessment.py`

## 硬件要求

### 最低配置
- **GPU**: NVIDIA RTX 3060 (12GB VRAM)
- **内存**: 32GB RAM
- **存储**: 100GB 可用空间
- **CUDA**: 11.8+

### 推荐配置
- **GPU**: NVIDIA RTX 4090 (24GB VRAM)
- **内存**: 64GB RAM
- **存储**: 500GB SSD
- **CUDA**: 12.0+

## 环境准备

### 1. 安装依赖
```bash
pip install -r requirements-training.txt
```

### 2. 验证GPU
```bash
python check_gpu.py
```

### 3. 准备训练数据
```bash
python prepare_training_data.py --task all
```

## 训练流程

### 快速开始
```bash
# 训练所有模型
python train_all_models.py

# 训练单个模型
python train_learning_analytics.py
python train_resource_recommendation.py
python train_speech_assessment.py
```

### 监控训练
```bash
# 启动TensorBoard
tensorboard --logdir=./logs

# 查看训练日志
tail -f logs/training.log
```

## 模型评估

### 评估脚本
```bash
# 评估学情分析模型
python evaluate_model.py --model learning_analytics --test-data data/test_learning_analytics.json

# 评估资源推荐模型
python evaluate_model.py --model resource_recommendation --test-data data/test_resource_recommendation.json

# 评估口语评测模型
python evaluate_model.py --model speech_assessment --test-data data/test_speech_assessment/
```

## 模型部署

### 导出模型
```bash
# 导出为ONNX格式（可选）
python export_model.py --model learning_analytics --format onnx

# 复制到生产目录
python deploy_model.py --model all --target ../models/
```

## 注意事项

⚠️ **重要提示**:
1. 训练前请确保有足够的GPU内存
2. 建议使用混合精度训练（FP16）以节省内存
3. 训练过程中会自动保存检查点
4. 如遇到OOM错误，请减小批次大小

## 故障排查

### GPU内存不足
```bash
# 减小批次大小
python train_learning_analytics.py --batch-size 8

# 启用梯度累积
python train_learning_analytics.py --gradient-accumulation-steps 2
```

### 训练速度慢
```bash
# 启用混合精度训练
python train_learning_analytics.py --fp16

# 使用多GPU训练
python train_learning_analytics.py --multi-gpu
```

## 联系方式

如有问题，请联系AI团队：ai-team@example.com
