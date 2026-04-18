/**
 * 讯飞AI服务 - 集成讯飞星火大模型（OpenAI兼容格式）
 *
 * 端点: https://spark-api-open.xf-yun.com/v1/chat/completions
 * 认证: Authorization: Bearer <APIPassword>
 * 支持模型: generalv3.5(Spark Max), 4.0Ultra(Spark4.0 Ultra)
 */

class XunfeiService {
  constructor() {
    // 从环境变量读取配置
    this.apiPassword =
      process.env.CHATBOT_API_PASSWORD || 'BLxtuxOPqePwFbUcXdKy:dKJVMwHikqHhRvUVrpgD';
    this.baseUrl = process.env.CHATBOT_API_URL || 'https://spark-api-open.xf-yun.com/v1';
    this.defaultModel = 'generalv3.5'; // Spark Max - 性价比最高
    this.fallbackModel = '4.0Ultra'; // Spark4.0 Ultra - 备选
  }

  /**
   * 调用讯飞星火大模型（OpenAI兼容格式）
   */
  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 4096;
    const temperature = options.temperature ?? 0.7;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiPassword}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `讯飞API ${response.status}: ${errorData.error?.message || errorData.message || 'Unknown error'}`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        throw new Error('API返回格式异常：无choices字段');
      }

      return {
        content: data.choices[0].message?.content || '',
        model: data.model,
        usage: data.usage,
        raw: data,
      };
    } catch (error) {
      console.error('讯飞AI调用失败:', error.message);

      // 尝试备选模型
      if (model !== this.fallbackModel) {
        console.log(`尝试备选模型 ${this.fallbackModel}...`);
        return this.chat(messages, { ...options, model: this.fallbackModel });
      }

      throw error;
    }
  }

  /**
   * 调用讯飞AI生成学习路径
   */
  async generateLearningPath(goal, days, intensity) {
    try {
      const prompt = this.buildPrompt(goal, days, intensity);

      const result = await this.chat(
        [
          {
            role: 'system',
            content:
              '你是一个专业的学习规划顾问。你擅长为用户制定科学、详细、可执行的学习计划。请始终使用中文回答，返回严格的JSON格式数据。',
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.6, maxTokens: 6000 }
      );

      return this.parseAIResponse(result.content);
    } catch (error) {
      console.error('讯飞AI学习路径生成失败，使用降级方案:', error.message);
      return this.getFallbackLearningPath(goal, days, intensity);
    }
  }

  /**
   * 通用AI对话接口（供其他功能使用）
   */
  async generateContent(prompt, systemPrompt = null, options = {}) {
    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const result = await this.chat(messages, options);
    return result.content;
  }

  /**
   * 构建学习路径生成的 Prompt
   */
  buildPrompt(goal, days, intensity) {
    const timeConfig = {
      low: '每天学习30-60分钟，适合在职或课业繁忙的学习者',
      medium: '每天学习60-90分钟，适合有较多空闲时间的学习者',
      high: '每天学习90-120分钟以上，适合全职学习者',
    };

    return `请为用户生成一个详细的${days}天"${goal}"学习计划。

## 基本要求
- 学习强度：${timeConfig[intensity] || timeConfig.medium}
- 每天内容必须不同，循序渐进
- 涵盖基础→进阶→实战的完整路径

## 输出格式（严格JSON）
{
  "title": "计划标题",
  "goal": "${goal}",
  "totalDays": ${days},
  "intensity": "${intensity}",
  "summary": "总体概述（3-5句话）",
  "modules": [
    {
      "day": 1,
      "moduleName": "第X天主题",
      "detailedContent": "详细内容（包含知识点、学习建议、实践任务等）",
      "topics": ["知识点1", "知识点2"],
      "estimatedTime": "建议时长",
      "dailySchedule": [
        {"time": "上午", "content": "做什么", "duration": "多长时间"},
        {"time": "下午", "content": "做什么", "duration": "多长时间"},
        {"time": "晚上", "content": "做什么", "duration": "多长时间"}
      ],
      "practice": "实践任务描述",
      "checkpoint": "自我检测点"
    }
  ]
}

注意：
1. modules数组长度必须等于${days}天
2. 每天的moduleName必须不同且体现递进关系
3. detailedContent要详细具体，不少于100字
4. 请直接返回JSON，不要添加任何其他文字`;
  }

  /**
   * 解析AI响应为结构化学习路径
   */
  parseAIResponse(content) {
    try {
      // 尝试直接解析
      const jsonMatch = content.match(/\{[\s\S]*"modules"\s*:\s*\[[\s\S]*\]\s*[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // 标准化为前端期望的格式
        return {
          title: parsed.title || `${parsed.totalDays || 30}天${parsed.goal || ''}学习计划`,
          days: parsed.totalDays || parsed.modules?.length || 30,
          certificateType: parsed.goal || '',
          intensity: parsed.intensity || 'medium',
          modules: parsed.modules || [],
          summary: parsed.summary || '',
          generatedAt: new Date().toISOString(),
          source: 'xunfei-ai',
        };
      }

      throw new Error('无法从响应中提取JSON');
    } catch (error) {
      console.error('解析AI响应失败:', error.message);
      throw new Error('AI响应格式解析失败');
    }
  }
}

export default new XunfeiService();
