/**
 * AI服务集成服务
 * 集成Qwen3模型、百度AI，实现服务降级
 * Requirements: 10.1, 10.2, 10.7, 10.8, 21.5, 22.6
 * Task: 19
 */

import { answerQuestion } from './grpc-clients.js';
import { isAIServiceAvailable, recordAIRequest } from './ai-service-manager.js';

export class AIServiceIntegrationService {
  private readonly TIMEOUT_MS = 10000; // 10秒超时

  /**
   * 调用Qwen3文本嵌入服务
   * Requirements: 10.1
   */
  async getTextEmbedding(text: string): Promise<number[]> {
    if (!isAIServiceAvailable()) {
      // 降级到基础算法：简单的词频向量
      return this.getBasicEmbedding(text);
    }

    try {
      // TODO: 调用Qwen3文本嵌入API
      // 这里需要实际的Qwen3 API调用
      // 暂时返回基础向量
      return this.getBasicEmbedding(text);
    } catch (error) {
      console.error('Qwen3文本嵌入失败，使用降级方案:', error);
      return this.getBasicEmbedding(text);
    }
  }

  /**
   * 调用Qwen3聊天服务（伙伴话术生成）
   * Requirements: 22.6
   */
  async generatePartnerChat(
    userMessage: string,
    context: {
      partnerTag: 'efficient' | 'steady' | 'basic';
      messageType: string;
      knowledgePoint?: string;
    }
  ): Promise<string> {
    if (!isAIServiceAvailable()) {
      return this.getBasicPartnerResponse(userMessage, context);
    }

    try {
      // 使用现有的answerQuestion服务生成回复
      const prompt = this.buildPartnerPrompt(userMessage, context);
      const result = await Promise.race([
        answerQuestion(prompt, JSON.stringify(context)),
        this.createTimeoutPromise()
      ]);

      if (result.answer) {
        recordAIRequest(true);
        return result.answer;
      } else {
        throw new Error('AI服务返回空结果');
      }
    } catch (error) {
      recordAIRequest(false);
      console.error('Qwen3聊天服务失败，使用降级方案:', error);
      return this.getBasicPartnerResponse(userMessage, context);
    }
  }

  /**
   * 调用Qwen3知识点掌握度评估
   * Requirements: 21.5
   */
  async evaluateKnowledgeMastery(
    userId: number,
    knowledgePointId: number,
    learningData: {
      practiceCorrectRate: number;
      codeErrorCount: number;
      videoRewatchCount: number;
      completionTimeRatio: number;
    }
  ): Promise<{ adjustedScore: number; confidence: number }> {
    if (!isAIServiceAvailable()) {
      // 降级到基础算法
      const basicScore = this.calculateBasicScore(learningData);
      return { adjustedScore: basicScore, confidence: 0.7 };
    }

    try {
      const prompt = `评估知识点掌握度：
- 练习正确率: ${learningData.practiceCorrectRate}%
- 代码错误次数: ${learningData.codeErrorCount}
- 视频回看次数: ${learningData.videoRewatchCount}
- 完成时间比: ${learningData.completionTimeRatio}

请给出综合得分(0-100)和置信度(0-1)。`;

      const result = await Promise.race([
        answerQuestion(prompt, JSON.stringify(learningData)),
        this.createTimeoutPromise()
      ]);

      if (result.answer) {
        recordAIRequest(true);
        // 解析AI返回的得分
        const scoreMatch = result.answer.match(/(\d+(?:\.\d+)?)/);
        const adjustedScore = scoreMatch ? parseFloat(scoreMatch[1]) : this.calculateBasicScore(learningData);
        return { adjustedScore: Math.min(100, Math.max(0, adjustedScore)), confidence: 0.9 };
      } else {
        throw new Error('AI服务返回空结果');
      }
    } catch (error) {
      recordAIRequest(false);
      console.error('Qwen3评估失败，使用降级方案:', error);
      const basicScore = this.calculateBasicScore(learningData);
      return { adjustedScore: basicScore, confidence: 0.7 };
    }
  }

  /**
   * 调用百度AI学习行为分析
   * Requirements: 10.2
   */
  async analyzeLearningBehavior(
    userId: number,
    behaviorData: {
      videoWatchPattern: any[];
      practicePattern: any[];
      timeDistribution: any;
    }
  ): Promise<{
    learningStyle: string;
    efficiency: number;
    recommendations: string[];
  }> {
    // 百度AI集成（待实现）
    // 暂时返回基础分析
    return {
      learningStyle: 'visual', // visual/auditory/kinesthetic
      efficiency: 0.75,
      recommendations: ['建议增加练习时间', '注意错题复习']
    };
  }

  /**
   * 调用百度AI错误模式识别
   * Requirements: 10.2
   */
  async identifyErrorPatterns(
    errors: Array<{
      errorType: string;
      knowledgePoint: string;
      frequency: number;
    }>
  ): Promise<{
    patterns: Array<{
      pattern: string;
      affectedKnowledgePoints: string[];
      severity: 'high' | 'medium' | 'low';
    }>;
  }> {
    // 百度AI集成（待实现）
    // 暂时返回基础分析
    return {
      patterns: errors.map(err => ({
        pattern: `${err.errorType}错误`,
        affectedKnowledgePoints: [err.knowledgePoint],
        severity: err.frequency > 5 ? 'high' : err.frequency > 2 ? 'medium' : 'low'
      }))
    };
  }

  // ==================== 降级方案 ====================

  /**
   * 基础文本嵌入（降级方案）
   */
  private getBasicEmbedding(text: string): number[] {
    // 简单的词频向量（实际应该使用更复杂的算法）
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);
    words.forEach((word, index) => {
      embedding[index % 128] += word.length;
    });
    return embedding;
  }

  /**
   * 基础伙伴回复（降级方案）
   */
  private getBasicPartnerResponse(
    userMessage: string,
    context: {
      partnerTag: 'efficient' | 'steady' | 'basic';
      messageType: string;
      knowledgePoint?: string;
    }
  ): string {
    const responses: Record<string, Record<string, string[]>> = {
      efficient: {
        encouragement: ['加油！你一定能行的！', '继续努力，保持这个节奏！'],
        learning_tip: ['建议多做一些练习题巩固', '可以尝试不同的学习方法'],
        task_reminder: ['别忘了完成今天的任务哦', '任务进度如何了？'],
        celebration: ['太棒了！继续加油！', '恭喜你完成目标！']
      },
      steady: {
        encouragement: ['慢慢来，稳扎稳打', '坚持就是胜利'],
        learning_tip: ['建议循序渐进地学习', '可以多复习一下基础'],
        task_reminder: ['记得按时完成任务', '任务要按时完成哦'],
        celebration: ['做得好！继续保持！', '恭喜你！']
      },
      basic: {
        encouragement: ['别着急，一步一步来', '你已经做得很好了'],
        learning_tip: ['建议多花时间理解基础概念', '可以多看几遍视频'],
        task_reminder: ['记得完成任务', '任务别忘了'],
        celebration: ['太好了！', '继续努力！']
      }
    };

    const tagResponses = responses[context.partnerTag] || responses.basic;
    const typeResponses = tagResponses[context.messageType] || tagResponses.encouragement;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  }

  /**
   * 构建伙伴提示词
   */
  private buildPartnerPrompt(
    userMessage: string,
    context: {
      partnerTag: string;
      messageType: string;
      knowledgePoint?: string;
    }
  ): string {
    return `作为${context.partnerTag}类型的学习伙伴，回复用户消息："${userMessage}"。消息类型：${context.messageType}${context.knowledgePoint ? `，相关知识点：${context.knowledgePoint}` : ''}。请生成友好、鼓励性的回复。`;
  }

  /**
   * 基础得分计算（降级方案）
   */
  private calculateBasicScore(data: {
    practiceCorrectRate: number;
    codeErrorCount: number;
    videoRewatchCount: number;
    completionTimeRatio: number;
  }): number {
    const correctRateScore = data.practiceCorrectRate;
    const errorScore = Math.max(0, 100 - data.codeErrorCount * 10);
    const rewatchScore = Math.max(0, 100 - data.videoRewatchCount * 10);
    const efficiencyScore = Math.max(0, Math.min(100, 100 / data.completionTimeRatio));

    return Math.round(
      correctRateScore * 0.4 +
      errorScore * 0.3 +
      rewatchScore * 0.2 +
      efficiencyScore * 0.1
    );
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI服务超时')), this.TIMEOUT_MS);
    });
  }
}

export const aiServiceIntegrationService = new AIServiceIntegrationService();

