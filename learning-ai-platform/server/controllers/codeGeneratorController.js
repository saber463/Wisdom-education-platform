import axios from 'axios';
import 'dotenv/config';

/**
 * 代码生成控制器
 * 调用AI大模型根据需求生成代码
 */

// 代码模板库（降级方案使用）
const codeTemplates = {
  javascript: {
    React组件: `import React, { useState, useEffect } from 'react';

const {componentName} = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // 初始化逻辑
  }, []);

  return (
    <div className="container">
      <h1>{title}</h1>
      {/* 组件内容 */}
    </div>
  );
};

export default {componentName};`,

    'Node.js Express路由': `const express = require('express');
const router = express.Router();

// GET /{resource}
router.get('/', async (req, res) => {
  try {
    // 查询逻辑
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// POST /{resource}
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // 创建逻辑
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;`,

    工具函数: `// 工具函数模板
export function {functionName}(params) {
  // 参数校验
  if (!params) throw new Error('参数不能为空');
  
  // 核心逻辑
  
  return result;
}

// 使用示例:
// import { {functionName} } from './utils';
// const result = {functionName}(params);`,
  },

  python: {
    Flask路由: `from flask import Blueprint, request, jsonify

bp = Blueprint('{name}', __name__, url_prefix='/{name}')

@bp.route('', methods=['GET'])
def list():
    \"\"\"获取列表\"\"\"
    items = []
    return jsonify({'success': True, 'data': items})

@bp.route('', methods=['POST'])
def create():
    \"\"\"创建资源\"\"\"
    data = request.get_json()
    # 创建逻辑
    return jsonify({'success': True, 'data': data}), 201

@bp.route('/<id>', methods=['GET', 'PUT', 'DELETE'])
def detail(id):
    \"\"\"获取/更新/删除详情\"\"\"
    if request.method == 'GET':
        pass
    elif request.method == 'PUT':
        data = request.get_json()
        # 更新逻辑
    elif request.method == 'DELETE':
        # 删除逻辑
    return jsonify({'success': True})`,

    数据处理脚本: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
\"\"\"
数据处理脚本
用途: {description}
\"\"\"

import pandas as pd
import json
from pathlib import Path


class DataProcessor:
    def __init__(self, input_path: str):
        self.input_path = Path(input_path)
        self.data = None
    
    def load_data(self):
        \"\"\"加载数据\"\"\"
        ext = self.input_path.suffix.lower()
        if ext == '.csv':
            self.data = pd.read_csv(self.input_path)
        elif ext in ['.xlsx', '.xls']:
            self.data = pd.read_excel(self.input_path)
        elif ext == '.json':
            with open(self.input_path, 'r', encoding='utf-8') as f:
                self.data = pd.DataFrame(json.load(f))
        else:
            raise ValueError(f'不支持的文件格式: {ext}')
        
        print(f'✅ 数据加载成功: {len(self.data)} 条记录')
        return self
    
    def process(self):
        \"\"\"处理数据（子类重写）\"\"\"
        raise NotImplementedError
    
    def save(self, output_path: str):
        \"\"\"保存结果\"\"\"
        out = Path(output_path)
        if out.suffix == '.csv':
            self.data.to_csv(out, index=False, encoding='utf-8')
        else:
            self.data.to_excel(out, index=False)
        print(f'✅ 结果已保存: {out}')


# 使用示例
if __name__ == '__main__':
    processor = DataProcessor('input.csv')
    processor.load_data().process().save('output.csv')`,

    类定义: `# 类定义模板
class {ClassName}:
    \"\"\"类描述\"\"\"
    
    def __init__(self, param1, param2=None):
        self.param1 = param1
        self.param2 = param2
        self._internal_state = None
    
    def method_name(self, arg1):
        \"\"\"方法说明
        
        Args:
            arg1: 参数1说明
            
        Returns:
            返回值说明
        \"\"\"
        # 方法实现
        return result
    
    @classmethod
    def factory_method(cls, config):
        \"\"\"工厂方法\"\"\"
        return cls(**config)
    
    @property
    def computed_property(self):
        \"\"\"计算属性\"\"\"
        return self._compute_value()`,
  },

  java: {
    'Spring Boot Controller': `package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/{entity}")
public class {Entity}Controller {

    private final Map<String, Object> store = new HashMap<>();
    
    /**
     * 获取所有记录
     */
    @GetMapping
    public List<Map<String, Object>> list() {
        return new ArrayList<>(store.values());
    }
    
    /**
     * 创建记录
     */
    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> data) {
        String id = UUID.randomUUID().toString();
        data.put("id", id);
        data.put("createdAt", System.currentTimeMillis());
        store.put(id, data);
        return data;
    }
    
    /**
     * 根据ID获取
     */
    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable String id) {
        Map<String, Object> item = store.get(id);
        if (item == null) {
            throw new RuntimeException("Not found");
        }
        return item;
    }
}`,

    Service层: `package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service
public class {Entity}Service {
    
    public ResultType process(RequestType request) {
        // 1. 参数校验
        validateRequest(request);
        
        // 2. 业务逻辑
        var result = doProcess(request);
        
        // 3. 返回结果
        return result;
    }
    
    private void validateRequest(RequestType request) {
        Objects.requireNonNull(request, "请求不能为空");
        // 更多校验规则
    }
    
    private ResultType doProcess(RequestType request) {
        // 核心业务逻辑
        return new ResultType();
    }
}`,
  },

  go: {
    Gin框架Handler: `package handler

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
)

type Handler struct{}

func New() *Handler {
    return &Handler{}
}

func (h *Handler) RegisterRoutes(r *gin.EngineGroup) {
    group := r.Group("/{resource}")
    {
        group.GET("", h.List)
        group.POST("", h.Create)
        group.GET("/:id", h.GetByID)
        group.PUT("/:id", h.Update)
        group.DELETE("/:id", h.Delete)
    }
}

func (h *Handler) List(c *gin.Context) {
    // 查询逻辑
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    []interface{}{},
    })
}

func (h *Handler) Create(c *gin.Context) {
    var req CreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "message": err.Error(),
        })
        return
    }
    
    // 创建逻辑
    c.JSON(http.StatusCreated, gin.H{
        "success": true,
        "data":    req,
    })`,
  },

  typescript: {
    'Vue3 Composition组件': `<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 类型定义
interface Item {
  id: string
  name: string
}

// Props
const props = defineProps<{
  title?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'change', value: string): void
  (e: 'delete', id: string): void
}>()

// 响应式数据
const loading = ref(false)
const list = ref<Item[]>([])

// 计算属性
const isEmpty = computed(() => list.value.length === 0)

// 路由
const router = useRouter()

// 生命周期
onMounted(async () => {
  await fetchData()
})

// 方法
async function fetchData() {
  loading.value = true
  try {
    // API调用
  } finally {
    loading.value = false
  }
}

function handleSelect(item: Item) {
  emit('change', item.id)
}
</script>

<template>
  <div class="{component-name}">
    <h3>{{ title || '标题' }}</h3>
    
    <div v-if="loading">加载中...</div>
    <div v-else-if="isEmpty">暂无数据</div>
    <ul v-else>
      <li v-for="item in list" :key="item.id" 
          @click="handleSelect(item)">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>`,

    API封装: `import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error),
)

// API接口定义
export const {name}Api = {
  getList: (params?: Record<string, any>) =>
    api.get('/{endpoint}', { params }),
  
  getById: (id: string) =>
    api.get(\`/{endpoint}/\${id}\`),
  
  create: (data: CreateDTO) =>
    api.post('/{endpoint}', data),
  
  update: (id: string, data: UpdateDTO) =>
    api.put(\`/{endpoint}/\${id}\`, data),
  
  delete: (id: string) =>
    api.delete(\`/{endpoint}/\${id}\`),
}

// 类型定义
interface CreateDTO {
  name: string
  [key: string]: any
}

interface UpdateDTO extends Partial<CreateDTO> {}`,
  },
};

/**
 * 生成代码
 */
export async function generateCode(req, res, next) {
  try {
    const { language, requirement, template } = req.body;

    if (!language || !requirement) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: language 和 requirement',
      });
    }

    const apiKey = process.env.AI_API_KEY;

    // 如果有API Key，尝试调用AI生成
    if (apiKey) {
      try {
        const aiCode = await callAICodeGeneration(language, requirement, apiKey);
        return res.json({
          success: true,
          code: aiCode,
          language,
          source: 'ai',
        });
      } catch (aiError) {
        console.warn('⚠️ AI代码生成失败，使用模板降级:', aiError.message);
      }
    }

    // 降级方案：从模板库匹配
    const fallbackCode = getTemplateFallback(language, requirement, template);

    res.json({
      success: true,
      code: fallbackCode,
      language,
      source: 'template',
      note: apiKey ? 'AI服务暂时不可用，已使用模板生成' : '未配置AI_API_KEY，使用模板生成',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 调用AI大模型生成代码
 */
async function callAICodeGeneration(language, requirement, apiKey) {
  const apiUrl = process.env.CHATBOT_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1';

  const systemPrompt = `你是一个专业的编程助手。请根据用户的需求生成高质量的${language}代码。

要求：
1. 只输出代码，不要包含任何解释文字
2. 代码要完整可运行，包含必要的导入和类型定义
3. 添加适当的中文注释
4. 遵循该语言的编码规范和最佳实践`;

  const response = await axios.post(
    `${apiUrl}/chat/completions`,
    {
      model: 'Qwen3-7B',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请用 ${language} 实现以下功能：\n\n${requirement}` },
      ],
      temperature: 0.5,
      max_tokens: 2048,
      top_p: 0.95,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const rawContent = response.data?.choices?.[0]?.message?.content || '';

  // 提取代码块（如果模型返回了markdown包裹的代码）
  const codeMatch = rawContent.match(/```[\w]*\n([\s\S]*?)```/);
  return codeMatch ? codeMatch[1] : rawContent;
}

/**
 * 模板降级方案
 */
function getTemplateFallback(language, requirement, selectedTemplate) {
  const langKey = language.toLowerCase();
  const templates = codeTemplates[langKey];

  if (!templates) {
    // 返回通用模板
    return generateGenericTemplate(language, requirement);
  }

  // 如果指定了模板
  if (selectedTemplate && templates[selectedTemplate]) {
    return formatTemplate(templates[selectedTemplate], requirement);
  }

  // 尝试根据需求关键词匹配最佳模板
  const bestMatch = findBestMatch(requirement, templates);
  return formatTemplate(templates[bestMatch], requirement);
}

/**
 * 关键词匹配最佳模板
 */
function findBestMatch(requirement, templates) {
  const keywords = {
    'react|component|组件': ['React组件'],
    'flask|django|web|接口': ['Flask路由'],
    'express|node|api': ['Node.js Express路由'],
    'spring|controller': ['Spring Boot Controller'],
    'gin|handler': ['Gin框架Handler'],
    'vue|composition|setup': ['Vue3 Composition组件'],
    'api|request|http': ['API封装'],
    'class|类': ['类定义'],
    'data|pandas|csv|excel|数据处理': ['数据处理脚本'],
    'service|业务逻辑': ['Service层'],
    'util|helper|tool|工具函数': ['工具函数'],
  };

  const lowerReq = requirement.toLowerCase();

  for (const [pattern, names] of Object.entries(keywords)) {
    if (new RegExp(pattern).test(lowerReq)) {
      for (const name of names) {
        if (templates[name]) return name;
      }
    }
  }

  // 默认返回第一个模板
  return Object.keys(templates)[0];
}

/**
 * 格式化模板（替换占位符）
 */
function formatTemplate(template, requirement) {
  return template
    .replace(/{componentName}/g, 'MyComponent')
    .replace(/{functionName}/g, 'myFunction')
    .replace(/{ClassName}/g, 'MyClass')
    .replace(/{Entity}/g, 'Resource')
    .replace(/{name}/g, 'module')
    .replace(/{resource}/g, 'resources')
    .replace(/{endpoint}/g, 'items')
    .replace(/{description}/g, requirement.slice(0, 50));
}

/**
 * 通用代码模板（当没有匹配的语言时）
 */
function generateGenericTemplate(language, requirement) {
  return `// ${requirement}
// 语言: ${language}
// 注意: 当前语言暂无预设模板，以下是基础示例代码

// 请根据实际需求修改此代码

console.log('${requirement}');
`;
}
