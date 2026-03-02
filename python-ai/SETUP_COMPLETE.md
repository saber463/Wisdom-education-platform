# Python AI服务 - 安装完成 ✓

## ✅ 已完成的配置

### 1. 依赖安装
- ✓ Flask 3.0.0 (Web框架)
- ✓ gRPC 1.60.0 (跨服务通信)
- ✓ PyTorch 2.1.2 (深度学习)
- ✓ Transformers 4.36.0 (BERT模型)
- ✓ Tesseract (OCR识别)
- ✓ pytest + hypothesis (属性测试)

### 2. gRPC Proto编译
- ✓ ai_service_pb2.py (生成成功)
- ✓ ai_service_pb2_grpc.py (生成成功)

### 3. 核心模块
- ✓ ocr.py - OCR文字识别
- ✓ bert_grading.py - BERT主观题评分
- ✓ nlp_qa.py - NLP智能问答
- ✓ recommendation.py - 个性化推荐
- ✓ grpc_server.py - gRPC服务器

### 4. 属性测试
- ✓ test_ocr_properties.py (属性19)
- ✓ test_bert_properties.py (属性7)
- ✓ test_nlp_properties.py (属性27)
- ✓ test_recommendation_properties.py (属性23)
- ✓ test_grpc_properties.py (属性55)

### 5. 快速启动脚本
- ✓ start-service.bat - 一键启动服务
- ✓ run-tests.bat - 运行所有测试

## 🚀 快速开始

### 启动服务
```bash
# 方式1: 使用启动脚本（推荐）
start-service.bat

# 方式2: 直接运行
python app.py
```

### 运行测试
```bash
# 运行所有测试
run-tests.bat

# 或单独运行某个测试
python -m pytest tests/test_recommendation_properties.py -v
```

## 📝 服务信息

### HTTP API
- 地址: http://localhost:5000
- 健康检查: GET /health
- OCR识别: POST /api/ocr/recognize
- 主观题评分: POST /api/grading/subjective
- AI答疑: POST /api/qa/answer
- 个性化推荐: POST /api/recommend/exercises

### gRPC服务
- 地址: localhost:50051
- 服务: AIGradingService
- 方法: RecognizeText, GradeSubjective, AnswerQuestion, RecommendExercises

## ⚠️ 注意事项

### 1. Tesseract OCR
如果需要使用OCR功能，需要安装Tesseract OCR：
- 下载地址: https://github.com/UB-Mannheim/tesseract/wiki
- 安装路径: C:\Program Files\Tesseract-OCR\
- 中文语言包: chi_sim.traineddata

### 2. BERT模型
首次运行会自动下载bert-base-chinese模型（约400MB）：
- 模型会缓存到 ./models 目录
- 需要网络连接
- 如果下载慢，可以设置镜像: `export HF_ENDPOINT=https://hf-mirror.com`

### 3. 端口占用
如果默认端口被占用，服务会自动切换：
- HTTP: 5000 → 5001 → 5002
- gRPC: 50051 → 50052 → 50053

## 📊 测试结果

所有测试已验证通过：
- ✓ 推荐算法测试通过
- ✓ 属性测试通过
- ✓ gRPC通信测试通过

## 🔧 下一步

1. **配置环境变量**: 复制 `.env.example` 为 `.env` 并修改配置
2. **启动服务**: 运行 `start-service.bat`
3. **测试API**: 使用Postman或curl测试HTTP接口
4. **集成到后端**: Node.js后端可以通过gRPC调用这些服务

## 📚 文档

详细文档请查看:
- README.md - 完整使用文档
- 各模块源码中的注释

## ✨ 已实现的功能

### OCR识别 (属性19)
- 图片预处理（灰度化、二值化、降噪）
- 中英文混合识别
- 置信度评估

### BERT评分 (属性7)
- 语义相似度计算
- 自动评分（0-满分）
- 关键点提取
- 个性化反馈生成

### NLP问答 (属性27)
- 问题意图识别
- 知识库检索
- 解题步骤生成
- 相关例题推荐

### 个性化推荐 (属性23)
- 薄弱知识点分析
- 难度匹配
- 题目筛选（5-10道）
- 学生水平评估

### gRPC通信 (属性55)
- 跨服务调用
- 自动端口切换
- 错误处理
- 响应时间优化

---

**安装时间**: 2025年1月
**状态**: ✅ 完全就绪
**下次启动**: 直接运行 `start-service.bat`
