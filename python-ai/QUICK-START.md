# Python AI服务 - 快速启动指南

## 🚀 一键启动

```bash
cd python-ai
start-service.bat
```

或直接运行:
```bash
python app.py
```

## ✅ 验证服务

### 方法1: 使用验证脚本（推荐）
```bash
python checkpoint-verify.py
```

### 方法2: 手动测试
```bash
# 健康检查
curl http://localhost:5000/health

# 测试NLP问答
curl -X POST http://localhost:5000/api/qa/answer ^
  -H "Content-Type: application/json" ^
  -d "{\"question\":\"什么是勾股定理？\",\"context\":\"数学\"}"
```

## 📊 服务信息

- **HTTP端口**: 5000
- **gRPC端口**: 50051
- **状态**: ✅ 运行中

## 🔧 常用命令

### 运行测试
```bash
# 所有测试
python -m pytest tests/ -v

# 特定模块
python -m pytest tests/test_nlp_properties.py -v
```

### 停止服务
按 `Ctrl+C` 停止服务

## 📝 API端点

| 端点 | 方法 | 功能 |
|------|------|------|
| /health | GET | 健康检查 |
| /api/ocr/recognize | POST | OCR识别 |
| /api/grading/subjective | POST | 主观题评分 |
| /api/qa/answer | POST | AI答疑 |
| /api/recommend/exercises | POST | 个性化推荐 |

## ⚠️ 注意事项

1. **BERT模型**: 当前使用简化评分逻辑（网络问题）
2. **OCR功能**: 需要安装Tesseract OCR才能完整使用
3. **端口占用**: 如果端口被占用，服务会自动切换到备用端口

## 📚 更多信息

- 详细文档: README.md
- 验证报告: CHECKPOINT-8-REPORT.md
- 完成总结: ../CHECKPOINT-8-SUMMARY.md

---

**当前状态**: ✅ 服务就绪，可以继续开发
