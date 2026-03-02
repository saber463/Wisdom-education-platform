# AI模型训练快速开始指南

## 5分钟快速上手

### 步骤1：准备数据（2分钟）

将真实教育数据集放入 `data/raw/` 目录：

```
python-ai/data/raw/
├── learning_analytics.csv      # 学情分析数据（5万条）
├── resource_recommendation.csv # 资源推荐数据（3万条）
└── speech_assessment/          # 口语评测音频（8万条WAV）
    ├── level_1/
    ├── level_2/
    └── level_3/
```

**CSV文件格式**：
- 必须包含列：`content`（文本内容）, `label`（标签）, `user_id`（用户ID）
- 编码：UTF-8
- 分隔符：逗号

**音频文件格式**：
- 格式：WAV
- 采样率：16kHz
- 组织：按评测等级分目录（目录名即为标签）

### 步骤2：安装依赖（1分钟）

```bash
cd python-ai
pip install -r requirements-full.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 步骤3：一键训练（2分钟启动）

```bash
train-all-models.bat
```

脚本会自动：
1. 检查Python环境和依赖包
2. 预处理数据集（如需要）
3. 依次训练3个AI模型
4. 输出训练结果总结

## 训练时间预估

- **BERT学情分析模型**：30-60分钟
- **BERT资源推荐模型**：20-40分钟
- **Wav2Vec2口语评测模型**：60-120分钟

**总计**：约2-4小时（取决于CPU性能和数据量）

## 查看训练结果

### 1. 查看训练日志

```bash
# 学情分析模型
type train_learning_analytics.log

# 资源推荐模型
type train_resource_recommendation.log

# 口语评测模型
type train_speech_assessment.log
```

### 2. 检查准确率

日志中会显示：
```
测试集准确率: 0.8912  # 目标≥0.88
测试集精确率: 0.8856
测试集召回率: 0.8901
测试集F1分数: 0.8878
```

### 3. 检查资源使用

日志中会显示：
```
资源使用 - CPU: 65.3%, 内存: 52.1%, 运行时间: 45.2分钟
```

## 训练好的模型位置

```
python-ai/models/
├── learning_analytics/      # 学情分析模型
├── resource_recommendation/ # 资源推荐模型
└── speech_assessment/       # 口语评测模型
```

## 常见问题

### Q: 数据集不存在怎么办？

**A**: 确保真实数据集已放入 `data/raw/` 目录。如果没有真实数据，脚本会报错并提示。

### Q: 训练时CPU/内存占用过高？

**A**: 编辑训练脚本，调整以下参数：
```python
BATCH_SIZE = 2  # 改为更小的批次
GRADIENT_ACCUMULATION_STEPS = 4  # 增加梯度累积
CPU_CORES = 1  # 减少使用的CPU核心数
```

### Q: 准确率未达标（<88%）？

**A**: 
1. 增加训练数据量
2. 增加训练轮数：`EPOCHS = 5`
3. 调整学习率：`LEARNING_RATE = 1e-5` 或 `3e-5`
4. 检查数据质量

### Q: 如何单独训练某个模型？

**A**: 
```bash
# 只训练学情分析模型
python train_learning_analytics.py

# 只训练资源推荐模型
python train_resource_recommendation.py

# 只训练口语评测模型
python train_speech_assessment.py
```

### Q: 如何重新预处理数据？

**A**: 
```bash
# 删除旧的预处理数据
rmdir /s /q data\processed

# 重新预处理
python data_preprocess.py
```

## 下一步

训练完成后：

1. ✅ 查看训练日志确认准确率达标
2. ✅ 将训练好的模型集成到Python AI服务
3. ✅ 实现模型推理接口（gRPC服务）
4. ✅ 前端调用AI服务进行实际应用

## 技术支持

详细文档：
- `TRAINING_README.md` - 完整训练指南
- `TASK-32-IMPLEMENTATION-SUMMARY.md` - 实现总结
- `data_preprocess.py` - 数据预处理脚本源码
- `train_*.py` - 训练脚本源码

## 竞赛亮点

✨ **100%真实数据训练**：无任何模拟数据  
✨ **CPU极致优化**：资源限制合规（CPU≤70%，内存≤60%）  
✨ **完整闭环流程**：数据预处理→训练→评估→部署  
✨ **一键启动脚本**：自动化程度高  
✨ **Windows原生支持**：无需Docker
