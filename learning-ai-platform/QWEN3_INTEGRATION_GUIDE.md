# Qwen3-Embedding-8B 模型集成指南

## 1. 概述

本指南将帮助您将 Qwen3-Embedding-8B 大模型集成到学习路径生成功能中，以提高学习路径的相关性和个性化程度。

## 2. 环境变量配置

首先，确保您的 `.env` 文件中已经配置了 Qwen3-Embedding-8B 的 API 信息：

```dotenv
# Qwen3-Embedding-8B大模型API密钥
VITE_QWEN_API_KEY=sk-TA4ZwSE3an1Ggp1CAc737422E70d4e7aBf563e169bD85190
QWEN_API_KEY=sk-TA4ZwSE3an1Ggp1CAc737422E70d4e7aBf563e169bD85190
# Qwen3-Embedding-8B大模型API URL
QWEN_API_URL=https://maas-api.cn-huabei-1.xf-yun.com/v1/rerank
```

## 3. 创建 Qwen3 服务文件

在 `server/services` 目录下创建 `qwen3EmbeddingService.js` 文件，用于封装 Qwen3-Embedding-8B 模型的调用：

```javascript
const axios = require('axios');
require('dotenv').config();

// Qwen3-Embedding-8B大模型配置
const QWEN3_EMBEDDING_CONFIG = {
  url: process.env.QWEN_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1/rerank',
  apiKey: process.env.QWEN_API_KEY || 'sk-TA4ZwSE3an1Ggp1CAc737422E70d4e7aBf563e169bD85190'
};

class Qwen3EmbeddingService {
  /**
   * 使用Qwen3-Embedding-8B模型对文档进行相关性排序
   * @param {string} query - 查询内容
   * @param {Array<string>} documents - 待排序的文档列表
   * @param {number} maxOutput - 返回的最大结果数
   * @returns {Promise<Array<Object>>} - 排序后的文档结果
   */
  static async rankDocuments(query, documents, maxOutput = 5) {
    try {
      const requestData = {
        model: "Qwen3-Embedding-8B",
        query: query,
        documents: documents,
        max_output: maxOutput,
        return_documents: true
      };
      
      const response = await axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
        headers: {
          'Authorization': `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.results;
    } catch (error) {
      console.error('Qwen3-Embedding-8B模型调用失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 根据学习目标选择最相关的证书类型
   * @param {string} goal - 学习目标
   * @param {Array<string>} certificateTypes - 证书类型列表
   * @returns {Promise<string>} - 最相关的证书类型
   */
  static async selectCertificateType(goal, certificateTypes) {
    try {
      const results = await this.rankDocuments(goal, certificateTypes, 1);
      return results[0].document;
    } catch (error) {
      console.error('选择证书类型失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 对学习主题进行相关性排序
   * @param {string} goal - 学习目标
   * @param {Array<string>} topics - 学习主题列表
   * @returns {Promise<Array<string>>} - 排序后的学习主题
   */
  static async rankLearningTopics(goal, topics) {
    try {
      const results = await this.rankDocuments(goal, topics, topics.length);
      return results.map(item => item.document);
    } catch (error) {
      console.error('学习主题排序失败:', error.message);
      throw error;
    }
  }
}

module.exports = Qwen3EmbeddingService;
```

## 4. 修改 AI 路由文件

在 `server/routes/ai.js` 文件中，集成 Qwen3-Embedding-8B 模型到学习路径生成功能：

### 4.1 导入 Qwen3 服务

在文件顶部添加导入语句：

```javascript
const Qwen3EmbeddingService = require('../services/qwen3EmbeddingService');
```

### 4.2 修改学习路径生成逻辑

找到学习路径生成路由（`router.get('/learning-paths'`），并修改证书类型选择和主题排序部分：

```javascript
// 根据学习目标判断证书类型
let selectedModules;

// 使用Qwen3-Embedding-8B模型进行更智能的学习目标分析和证书类型匹配
try {
  // 准备证书类型选项
  const certificateTypes = [
    "计算机、编程、软件学习",
    "英语、雅思、托福、CET、四六级学习",
    "会计、财务、CPA、ACCA学习",
    "教师、教资、教师资格证学习",
    "设计、PS、Photoshop、AI、UI、平面设计学习"
  ];
  
  // 调用Qwen3-Embedding-8B模型获取最相关的证书类型
  const bestMatch = await Qwen3EmbeddingService.selectCertificateType(goal, certificateTypes);
  
  // 根据模型返回的结果选择证书模块
  if (bestMatch.includes('计算机')) {
    selectedModules = certificateModules["计算机"];
  } else if (bestMatch.includes('英语')) {
    selectedModules = certificateModules["英语"];
  } else if (bestMatch.includes('会计')) {
    selectedModules = certificateModules["会计"];
  } else if (bestMatch.includes('教师')) {
    selectedModules = certificateModules["教师"];
  } else if (bestMatch.includes('设计')) {
    selectedModules = certificateModules["设计"];
  } else {
    selectedModules = certificateModules["计算机"]; // 默认使用计算机模块
  }
  
  console.log(`Qwen3模型分析结果: 学习目标"${goal}"最匹配的证书类型是: ${bestMatch}`);
  
} catch (qwenError) {
  console.log('Qwen3-Embedding-8B模型调用失败，使用传统关键词匹配方式', qwenError.message);
  
  // 传统关键词匹配作为降级方案
  if (goal.includes('计算机') || goal.includes('编程') || goal.includes('软件')) {
    selectedModules = certificateModules["计算机"];
  } else if (goal.includes('英语') || goal.includes('雅思') || goal.includes('托福') || goal.includes('CET') || goal.includes('四六级')) {
    selectedModules = certificateModules["英语"];
  } else if (goal.includes('会计') || goal.includes('财务') || goal.includes('CPA') || goal.includes('ACCA')) {
    selectedModules = certificateModules["会计"];
  } else if (goal.includes('教师') || goal.includes('教资') || goal.includes('教师资格证')) {
    selectedModules = certificateModules["教师"];
  } else if (goal.includes('设计') || goal.includes('PS') || goal.includes('Photoshop') || goal.includes('AI') || goal.includes('UI') || goal.includes('平面设计')) {
    selectedModules = certificateModules["设计"];
  } else {
    // 默认使用计算机模块
    selectedModules = certificateModules["计算机"];
  }
}

// 进一步使用Qwen3-Embedding-8B模型对选择的模块主题进行相关性排序
try {
  // 提取所有主题
  const allTopics = [];
  for (const module of selectedModules) {
    for (const topic of module.topics) {
      allTopics.push(topic);
    }
  }
  
  // 调用Qwen3-Embedding-8B模型对主题进行相关性排序
  const rankedTopics = await Qwen3EmbeddingService.rankLearningTopics(goal, allTopics);
  
  // 根据排序后的主题重新组织模块
  const topicToModuleMap = new Map();
  for (const module of selectedModules) {
    for (const topic of module.topics) {
      topicToModuleMap.set(topic, module);
    }
  }
  
  // 按相关性重新排序的主题构建新的模块顺序
  const reorderedModules = [];
  const processedTopics = new Set();
  
  for (const topic of rankedTopics) {
    if (!processedTopics.has(topic)) {
      const module = topicToModuleMap.get(topic);
      if (module) {
        // 确保模块只被添加一次
        if (!reorderedModules.includes(module)) {
          reorderedModules.push(module);
        }
        processedTopics.add(topic);
      }
    }
  }
  
  // 如果重新排序成功，使用新的模块顺序
  if (reorderedModules.length > 0) {
    selectedModules = reorderedModules;
    console.log(`Qwen3模型已优化学习主题顺序，提高了与目标"${goal}"的相关性`);
  }
  
} catch (qwenError) {
  console.log('Qwen3-Embedding-8B模型主题排序失败，使用默认顺序', qwenError.message);
  // 使用默认顺序
}
```

## 5. 测试集成效果

完成上述修改后，启动服务器并测试学习路径生成功能：

```bash
# 在server目录下
npm start

# 然后使用curl或Postman测试
curl -X GET "http://localhost:4001/api/ai/learning-paths?goal=学习Java编程&days=30&intensity=medium" -H "Authorization: Bearer YOUR_TOKEN"
```

## 6. 功能优化建议

为了充分利用 Qwen3-Embedding-8B 模型的优势，您可以考虑以下优化：

1. **内容相关性增强**：使用模型对学习资源进行相关性排序，确保最相关的资源优先展示
2. **个性化推荐**：结合用户历史学习数据和兴趣，生成更个性化的学习路径
3. **知识点关联**：利用模型的 embedding 能力，建立知识点之间的关联关系
4. **动态调整**：根据用户的学习进度和反馈，动态调整学习路径

## 7. 故障排除

如果遇到问题，请检查以下几点：

1. 确保 Qwen3-Embedding-8B 的 API Key 配置正确
2. 确保网络连接正常，可以访问 Qwen3-Embedding-8B 的 API 地址
3. 检查服务器日志，查看是否有相关错误信息
4. 确保所有依赖项都已正确安装

如果问题仍然存在，请参考 Qwen3-Embedding-8B 的官方文档或联系技术支持。