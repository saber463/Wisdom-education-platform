# AI模型训练完整指南

## 📋 概述

本指南详细说明如何训练智慧教育平台的三个AI模型：

1. **BERT学情分析模型** - 分析学生学习情况，输出知识点掌握度评分
2. **BERT资源推荐模型** - 基于学习行为推荐个性化学习资源
3. **Wav2Vec2口语评测模型** - 评测英文/中文口语发音准确率

## 🎯 训练目标

| 模型 | 训练数据量 | 学习率 | 批次大小 | 训练轮数 | 目标准确率 |
|------|-----------|--------|---------|---------|-----------|
| BERT学情分析 | 5万条 | 2e-5 | 16 | 3 epochs | ≥95% |
| BERT资源推荐 | 3万条 | 2e-5 | 16 | 3 epochs | ≥90% |
| Wav2Vec2口语评测 | 8万条音频 | 1e-4 | 8 | 5 epochs | ≥92% |

## 💻 硬件要求

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

### CPU训练（不推荐）
- 可以使用CPU训练，但速度极慢（约慢100倍）
- BERT模型：约需24-48小时
- Wav2Vec2模型：约需72-96小时

## 🔧 环境准备

### 1. 安装Python依赖

```bash
cd python-ai/training
pip install -r requirements-training.txt
```

### 2. 验证GPU环境

```bash
python check_gpu.py
```

**预期输出**:
```
==================================================
GPU环境检测
==================================================
✓ PyTorch版本: 2.1.0
✓ CUDA可用
  CUDA版本: 11.8
  GPU数量: 1

  GPU 0: NVIDIA GeForce RTX 4090
    显存总量: 24.00 GB
    显存已用: 0.00 GB
    显存可用: 24.00 GB

✓ GPU环境正常，可以开始训练
```

### 3. 准备训练数据

**重要提示**: 当前脚本会自动生成示例数据用于测试。实际生产环境需要准备真实标注数据。

#### 数据格式要求

**学情分析数据** (`data/train_learning_analytics.json`):
```json
[
  {
    "learning_path": "已完成5/8个知识点",
    "error_records": "错误3次",
    "answer_speed": "平均45.2秒/题",
    "mastery_score": 85.5
  }
]
```

**资源推荐数据** (`data/train_resource_recommendation.json`):
```json
[
  {
    "user_behavior": "浏览",
    "resource_type": "文章",
    "knowledge_point": "代数",
    "is_recommended": 1
  }
]
```

**口语评测数据** (`data/train_speech_assessment.json`):
```json
[
  {
    "audio_path": "data/audio/sample_000001.wav",
    "language": "en",
    "difficulty": "medium",
    "pronunciation_score": 85.3,
    "intonation_score": 78.5,
    "fluency_score": 82.1
  }
]
```

## 🚀 开始训练

### 方式1: 一键训练所有模型（推荐）

```bash
python train_all_models.py
```

这将依次训练三个模型，总耗时约：
- GPU (RTX 4090): 6-8小时
- GPU (RTX 3060): 12-16小时
- CPU: 120-200小时（不推荐）

### 方式2: 单独训练每个模型

#### 训练BERT学情分析模型

```bash
python train_learning_analytics.py \
  --train-data data/train_learning_analytics.json \
  --val-data data/val_learning_analytics.json \
  --batch-size 16 \
  --num-epochs 3 \
  --learning-rate 2e-5 \
  --output-dir models/learning_analytics
```

**预计耗时**: 2-3小时 (GPU) / 40-60小时 (CPU)

#### 训练BERT资源推荐模型

```bash
python train_resource_recommendation.py \
  --train-data data/train_resource_recommendation.json \
  --val-data data/val_resource_recommendation.json \
  --batch-size 16 \
  --num-epochs 3 \
  --learning-rate 2e-5 \
  --output-dir models/resource_recommendation
```

**预计耗时**: 1.5-2小时 (GPU) / 30-40小时 (CPU)

#### 训练Wav2Vec2口语评测模型

```bash
python train_speech_assessment.py \
  --train-data data/train_speech_assessment.json \
  --val-data data/val_speech_assessment.json \
  --batch-size 8 \
  --num-epochs 5 \
  --learning-rate 1e-4 \
  --output-dir models/speech_assessment
```

**预计耗时**: 4-5小时 (GPU) / 80-100小时 (CPU)

## 📊 监控训练进度

### 查看训练日志

```bash
# 实时查看日志
tail -f logs/training_learning_analytics.log
tail -f logs/training_resource_recommendation.log
tail -f logs/training_speech_assessment.log
```

### 使用TensorBoard（可选）

```bash
# 启动TensorBoard
tensorboard --logdir=./logs

# 在浏览器打开
# http://localhost:6006
```

## 📈 训练输出

每个模型训练完成后会生成：

```
models/
├── learning_analytics/
│   ├── best_model/
│   │   ├── config.json
│   │   ├── pytorch_model.bin
│   │   └── tokenizer_config.json
│   └── training_history.json
├── resource_recommendation/
│   ├── best_model/
│   └── training_history.json
└── speech_assessment/
    ├── best_model/
    └── training_history.json
```

## 🔍 模型评估

训练完成后，查看训练历史：

```bash
cat models/learning_analytics/training_history.json
```

**示例输出**:
```json
[
  {
    "epoch": 1,
    "train_loss": 0.0234,
    "train_accuracy": 0.9123,
    "val_loss": 0.0198,
    "val_accuracy": 0.9345,
    "val_mae": 4.23
  },
  {
    "epoch": 2,
    "train_loss": 0.0156,
    "train_accuracy": 0.9456,
    "val_loss": 0.0142,
    "val_accuracy": 0.9567,
    "val_mae": 3.12
  }
]
```

## 🚨 常见问题

### 1. GPU内存不足 (OOM)

**错误信息**: `RuntimeError: CUDA out of memory`

**解决方案**:
```bash
# 减小批次大小
python train_learning_analytics.py --batch-size 8

# 或启用梯度累积
python train_learning_analytics.py --gradient-accumulation-steps 2
```

### 2. 训练速度慢

**解决方案**:
```bash
# 启用混合精度训练（FP16）
python train_learning_analytics.py --fp16

# 使用多GPU训练
python train_learning_analytics.py --multi-gpu
```

### 3. 模型准确率不达标

**可能原因**:
- 训练数据质量不高
- 训练轮数不够
- 学习率设置不当

**解决方案**:
- 增加训练轮数: `--num-epochs 5`
- 调整学习率: `--learning-rate 1e-5`
- 检查数据标注质量

### 4. CUDA版本不匹配

**错误信息**: `The detected CUDA version (X.X) mismatches the version that was used to compile PyTorch (Y.Y)`

**解决方案**:
```bash
# 重新安装匹配的PyTorch版本
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## 📦 模型部署

训练完成后，将模型复制到生产目录：

```bash
# 复制到Python AI服务的models目录
cp -r models/learning_analytics/best_model ../models/learning_analytics
cp -r models/resource_recommendation/best_model ../models/resource_recommendation
cp -r models/speech_assessment/best_model ../models/speech_assessment
```

## 📝 注意事项

1. **训练前备份**: 训练前建议备份现有模型
2. **定期保存**: 训练过程中会自动保存检查点
3. **资源监控**: 训练时监控GPU温度和内存使用
4. **数据隐私**: 确保训练数据符合隐私保护要求
5. **版本管理**: 记录每次训练的参数和结果

## 🔗 相关文档

- [BERT模型文档](https://huggingface.co/bert-base-chinese)
- [Wav2Vec2模型文档](https://huggingface.co/facebook/wav2vec2-base)
- [Transformers库文档](https://huggingface.co/docs/transformers)
- [PyTorch文档](https://pytorch.org/docs/stable/index.html)

## 📧 技术支持

如有问题，请联系AI团队：
- 邮箱: ai-team@example.com
- 文档: 查看项目README.md

---

**最后更新**: 2026-01-15
**版本**: 1.0.0
