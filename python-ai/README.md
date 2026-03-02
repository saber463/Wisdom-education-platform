# Python AI服务 - 智慧教育学习平台

## 概述

Python AI服务提供智慧教育平台的核心AI功能，包括：
- OCR文字识别
- BERT主观题评分
- NLP智能问答
-个性化练习推荐

## 技术栈

- Python 3.10+
- Flask 3.0+ (HTTP API)
- gRPC (跨服务通信)
- PyTorch + Transformers (BERT模型)
- Tesseract OCR (文字识别)

## 项目结构

```
python-ai/
├── app.py                  # Flask主应用（HTTP API）
├── grpc_server.py          # gRPC服务器
├── config.py               # 配置文件
├── ocr.py                  # OCR识别模块
├── bert_grading.py         # BERT评分模块
├── nlp_qa.py               # NLP问答模块
├── recommendation.py       # 个性化推荐模块
├── protos/
│   └── ai_service.proto    # gRPC服务定义
├── tests/                  # 属性测试
│   ├── test_ocr_properties.py
│   ├── test_bert_properties.py
│   ├── test_nlp_properties.py
│   ├── test_recommendation_properties.py
│   └── test_grpc_properties.py
└── requirements.txt        # Python依赖
```

## 安装依赖

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 安装Tesseract OCR

**Windows:**
1. 下载安装包：https://github.com/UB-Mannheim/tesseract/wiki
2. 安装到默认路径：`C:\Program Files\Tesseract-OCR\`
3. 下载中文语言包：https://github.com/tesseract-ocr/tessdata
4. 将 `chi_sim.traineddata` 放到 `C:\Program Files\Tesseract-OCR\tessdata\`

### 3. 编译gRPC Proto文件

```bash
python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto
```

## 配置

创建 `.env` 文件（参考 `.env.example`）：

```env
# 服务器配置
PORT=5000
GRPC_PORT=50051

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=edu_education_platform

# BERT模型配置
BERT_MODEL_PATH=bert-base-chinese
MODEL_CACHE_DIR=./models

# OCR配置
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
```

## 启动服务

### 启动HTTP服务（Flask）

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动

### 启动gRPC服务

gRPC服务会在Flask启动时自动在后台线程启动，监听端口 `50051`

## HTTP API接口

### 1. 健康检查

```
GET /health
```

### 2. OCR文字识别

```
POST /api/ocr/recognize
Content-Type: multipart/form-data

参数:
- image: 图片文件
- format: 图片格式 (jpg/png/pdf)

响应:
{
  "text": "识别的文本",
  "confidence": 0.95
}
```

### 3. 主观题评分

```
POST /api/grading/subjective
Content-Type: application/json

请求体:
{
  "question": "题目内容",
  "student_answer": "学生答案",
  "standard_answer": "标准答案",
  "max_score": 10
}

响应:
{
  "score": 8,
  "feedback": "回答良好...",
  "key_points": ["关键点1", "关键点2"]
}
```

### 4. AI答疑

```
POST /api/qa/answer
Content-Type: application/json

请求体:
{
  "question": "什么是勾股定理？",
  "context": "可选的上下文信息"
}

响应:
{
  "answer": "勾股定理指出...",
  "steps": ["步骤1", "步骤2"],
  "related_examples": ["例题1"]
}
```

### 5. 个性化推荐

```
POST /api/recommend/exercises
Content-Type: application/json

请求体:
{
  "student_id": 1,
  "weak_point_ids": [1, 2, 3],
  "count": 10
}

响应:
{
  "exercises": [
    {
      "id": 1,
      "title": "练习题1",
      "difficulty": "medium",
      "knowledge_point_id": 1
    }
  ]
}
```

## gRPC服务

### 服务定义

```protobuf
service AIGradingService {
  rpc RecognizeText(ImageRequest) returns (TextResponse);
  rpc GradeSubjective(SubjectiveRequest) returns (GradingResponse);
  rpc AnswerQuestion(QuestionRequest) returns (AnswerResponse);
  rpc RecommendExercises(RecommendRequest) returns (RecommendResponse);
}
```

### 端口自动切换

如果默认端口被占用，服务会自动尝试以下端口：
- HTTP: 5000 → 5001 → 5002
- gRPC: 50051 → 50052 → 50053

## 运行测试

### 运行所有属性测试

```bash
pytest tests/ -v
```

### 运行特定模块测试

```bash
# OCR测试
pytest tests/test_ocr_properties.py -v

# BERT评分测试
pytest tests/test_bert_properties.py -v

# NLP问答测试
pytest tests/test_nlp_properties.py -v

# 推荐算法测试
pytest tests/test_recommendation_properties.py -v

# gRPC通信测试
pytest tests/test_grpc_properties.py -v
```

## 模块说明

### OCR模块 (ocr.py)

- **功能**: 图片文字识别
- **预处理**: 灰度化、二值化、降噪
- **支持格式**: JPG, PNG, PDF
- **识别率**: ≥95%

### BERT评分模块 (bert_grading.py)

- **功能**: 主观题语义相似度评分
- **模型**: bert-base-chinese
- **准确率**: ≥92%
- **评分范围**: 0-满分

### NLP问答模块 (nlp_qa.py)

- **功能**: 智能问答、解题步骤生成
- **知识库**: 数学、物理、化学
- **响应时间**: ≤5秒

### 推荐算法模块 (recommendation.py)

- **功能**: 基于薄弱知识点的个性化推荐
- **推荐数量**: 5-10道题
- **难度匹配**: 根据学生水平自动调整

## 性能指标

- OCR识别响应时间: ≤1秒
- BERT评分响应时间: ≤3秒
- NLP问答响应时间: ≤5秒
- 推荐算法响应时间: ≤500ms
- gRPC通信延迟: ≤100ms

## 故障恢复

### 端口占用

服务会自动检测端口占用并切换到备用端口

### 模型加载失败

如果BERT模型加载失败，系统会使用简化的评分逻辑

### OCR识别失败

返回空文本和0置信度，不会导致服务崩溃

## 开发说明

### 添加新的知识点

编辑 `nlp_qa.py` 中的 `KNOWLEDGE_BASE` 字典：

```python
KNOWLEDGE_BASE = {
    "数学": {
        "新知识点": {
            "answer": "答案内容",
            "steps": ["步骤1", "步骤2"],
            "examples": ["例题1"]
        }
    }
}
```

### 调整推荐算法

修改 `recommendation.py` 中的评分权重：

```python
def calculate_exercise_score(exercise, weak_point_ids, student_history):
    score = 0.0
    score += 0.5  # 知识点相关性权重
    score += 0.3  # 题目新鲜度权重
    score += 0.2  # 题目质量权重
    return score
```

## 注意事项

1. **BERT模型首次加载**: 首次运行时会下载BERT模型（约400MB），需要网络连接
2. **Tesseract路径**: 确保 `config.py` 中的 `TESSERACT_PATH` 正确
3. **内存占用**: BERT模型会占用约2GB内存
4. **CPU使用**: 建议限制CPU使用率≤70%

## 故障排查

### 问题1: ModuleNotFoundError

```bash
# 解决方案：安装缺失的依赖
pip install -r requirements.txt
```

### 问题2: Tesseract not found

```bash
# 解决方案：检查Tesseract安装路径
# 修改 config.py 中的 TESSERACT_PATH
```

### 问题3: BERT模型下载失败

```bash
# 解决方案：使用国内镜像
export HF_ENDPOINT=https://hf-mirror.com
pip install transformers
```

### 问题4: gRPC端口被占用

```bash
# 解决方案：服务会自动切换到备用端口
# 或手动修改 config.py 中的 GRPC_PORT
```

## 联系方式

如有问题，请查看项目文档或联系开发团队。
