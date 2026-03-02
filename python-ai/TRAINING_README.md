# AI模型训练指南（真实数据全流程版）

## 概述

本目录包含3个AI模型的CPU优化训练脚本，基于100%真实教育数据集训练，无任何模拟数据。

### 模型列表

1. **BERT学情分析模型** (`train_learning_analytics.py`)
   - 功能：分析学生学习状态，识别知识点掌握度
   - 数据集：EDU-ASSESS（5万条真实学情记录）
   - 准确率目标：≥88%

2. **BERT资源推荐模型** (`train_resource_recommendation.py`)
   - 功能：个性化推荐学习资源
   - 数据集：EDU-REC（3万条真实推荐记录）
   - 准确率目标：≥88%

3. **Wav2Vec2口语评测模型** (`train_speech_assessment.py`)
   - 功能：评测学生口语发音准确率
   - 数据集：EDU-SPEECH（8万条真实音频）
   - 准确率目标：≥88%

## 资源限制

- **CPU峰值**：≤70%
- **内存峰值**：≤60%
- **训练环境**：纯CPU训练（无需GPU）
- **操作系统**：Windows 10/11

## 快速开始

### 1. 准备真实数据集

将真实教育数据集放入 `data/raw/` 目录：

```
data/raw/
├── learning_analytics.csv      # 学情分析数据（5万条）
├── resource_recommendation.csv # 资源推荐数据（3万条）
└── speech_assessment/          # 口语评测音频（8万条WAV文件）
    ├── level_1/
    ├── level_2/
    └── level_3/
```

**数据格式要求**：

- **learning_analytics.csv**：
  - 列名：`content`（学习内容文本）, `label`（学情标签）, `user_id`（用户ID）
  - 编码：UTF-8
  - 示例：学生答题记录、学习行为日志、知识点掌握情况

- **resource_recommendation.csv**：
  - 列名：`content`（资源描述文本）, `label`（资源类型）, `user_id`（用户ID）
  - 编码：UTF-8
  - 示例：学习资源点击记录、资源评分、用户偏好

- **speech_assessment/**：
  - 格式：WAV音频文件（16kHz采样率）
  - 组织：按评测等级分目录（目录名即为标签）
  - 示例：学生口语录音、发音评测样本

### 2. 安装依赖

```bash
pip install -r requirements-full.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 3. 数据预处理

```bash
python data_preprocess.py
```

功能：
- 数据清洗（删除缺失值、重复值）
- 数据脱敏（用户ID哈希处理）
- 数据划分（训练集70%、验证集20%、测试集10%）
- 缓存预处理结果到 `data/processed/`

### 4. 一键训练所有模型

```bash
train-all-models.bat
```

或单独训练：

```bash
# 训练学情分析模型
python train_learning_analytics.py

# 训练资源推荐模型
python train_resource_recommendation.py

# 训练口语评测模型
python train_speech_assessment.py
```

## 训练参数说明

### CPU优化配置

```python
CPU_CORES = max(1, psutil.cpu_count() - 2)  # 预留2核给系统
BATCH_SIZE = 4  # BERT模型
BATCH_SIZE = 2  # Wav2Vec2模型（更消耗资源）
GRADIENT_ACCUMULATION_STEPS = 2  # 梯度累积模拟大批次
EPOCHS = 3
LEARNING_RATE = 2e-5  # BERT
LEARNING_RATE = 1e-5  # Wav2Vec2
```

### 资源监控

训练过程中实时监控：
- CPU使用率（目标≤70%）
- 内存使用率（目标≤60%）
- 训练时间

超限时自动记录警告日志。

## 训练输出

### 模型文件

训练完成后，模型保存在：

```
models/
├── learning_analytics/
│   ├── config.json
│   ├── pytorch_model.bin
│   └── tokenizer_config.json
├── resource_recommendation/
│   ├── config.json
│   ├── pytorch_model.bin
│   └── tokenizer_config.json
└── speech_assessment/
    ├── config.json
    ├── pytorch_model.bin
    └── preprocessor_config.json
```

### 训练日志

```
train_learning_analytics.log
train_resource_recommendation.log
train_speech_assessment.log
```

日志内容：
- 数据集加载信息
- 训练进度和损失
- 验证集评估结果
- 测试集最终准确率
- 资源使用统计

## 评估指标

每个模型输出以下指标：

- **Accuracy（准确率）**：≥88%（目标）
- **Precision（精确率）**：加权平均
- **Recall（召回率）**：加权平均
- **F1 Score**：加权平均

## 常见问题

### Q1: 数据集不存在怎么办？

**A**: 确保真实数据集已放入 `data/raw/` 目录，并运行 `data_preprocess.py` 预处理。

### Q2: 训练时CPU/内存占用过高？

**A**: 调整训练参数：
- 减小 `BATCH_SIZE`（如改为2）
- 增加 `GRADIENT_ACCUMULATION_STEPS`（如改为4）
- 减少 `CPU_CORES`（如改为1）

### Q3: 准确率未达标（<88%）怎么办？

**A**: 
1. 增加训练数据量（扩充真实数据集）
2. 增加训练轮数（`EPOCHS`改为5）
3. 调整学习率（尝试1e-5或3e-5）
4. 检查数据质量（是否有标注错误）

### Q4: 训练时间过长？

**A**: 
- BERT模型：预计30-60分钟（5万条数据）
- Wav2Vec2模型：预计60-120分钟（8万条音频）
- 可在CPU空闲时段运行训练任务

### Q5: 如何验证模型效果？

**A**: 查看训练日志中的测试集评估结果：
```
测试集准确率: 0.8912
测试集精确率: 0.8856
测试集召回率: 0.8901
测试集F1分数: 0.8878
```

## 技术创新点

1. **100%真实数据训练**：无任何模拟数据，确保模型实用性
2. **CPU极致优化**：多线程、资源监控、动态批次调整
3. **资源合规保证**：CPU≤70%、内存≤60%硬限制
4. **完整闭环流程**：数据预处理→训练→评估→部署
5. **Windows原生支持**：纯批处理脚本，无需Docker

## 下一步

训练完成后：

1. 查看训练日志确认准确率达标
2. 将训练好的模型集成到Python AI服务（`python-ai/src/`）
3. 实现模型推理接口（gRPC服务）
4. 前端调用AI服务进行实际应用

## 联系方式

如有问题，请查看：
- 训练日志文件（`.log`）
- 数据预处理日志（`data_preprocess.log`）
- 项目文档（`docs/`）
