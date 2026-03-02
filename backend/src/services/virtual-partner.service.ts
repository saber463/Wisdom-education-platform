/**
 * 虚拟学习伙伴服务
 * Requirements: 22.1-22.21
 * Task: 9
 */

import { executeQuery } from '../config/database.js';
import { VirtualLearningPartner, IVirtualLearningPartner } from '../models/mongodb/virtual-learning-partner.model.js';
import { connectMongoDB } from '../config/mongodb.js';

// 伙伴姓名库
const PARTNER_NAMES = [
  '小明', '小红', '小华', '小丽', '小强', '小芳', '小刚', '小美',
  '小杰', '小雯', '小宇', '小琳', '小峰', '小慧', '小涛', '小静'
];

// 伙伴签名库（按能力标签分类）
const PARTNER_SIGNATURES = {
  efficient: [
    '高效学习，事半功倍！',
    '快速掌握，轻松进阶！',
    '效率第一，质量保证！'
  ],
  steady: [
    '稳扎稳打，步步为营！',
    '持续进步，厚积薄发！',
    '踏实学习，稳步提升！'
  ],
  basic: [
    '基础扎实，未来可期！',
    '循序渐进，慢慢来！',
    '打好基础，稳步前进！'
  ]
};

// 头像URL库
const AVATAR_URLS = [
  '/avatars/partner1.png',
  '/avatars/partner2.png',
  '/avatars/partner3.png',
  '/avatars/partner4.png',
  '/avatars/partner5.png',
  '/avatars/partner6.png'
];

export class VirtualPartnerService {
  /**
   * 生成虚拟学习伙伴
   * Requirements: 22.1, 22.2, 22.3, 22.4
   * 
   * @param userId 用户ID
   * @param learningPathId 学习路径ID
   * @returns 生成的伙伴信息
   */
  async generatePartner(
    userId: number,
    learningPathId: number
  ): Promise<{
    success: boolean;
    message: string;
    partner?: {
      partner_id: number;
      partner_name: string;
      partner_avatar: string;
      partner_signature: string;
      learning_ability_tag: 'efficient' | 'steady' | 'basic';
      partner_level: number;
    };
    alternatives?: Array<{
      partner_id: number;
      partner_name: string;
      partner_avatar: string;
      partner_signature: string;
    }>;
  }> {
    try {
      // 1. 检查用户是否已有伙伴
      await connectMongoDB();
      const existingPartner = await VirtualLearningPartner.findOne({ user_id: userId });
      if (existingPartner) {
        return {
          success: false,
          message: '用户已有虚拟学习伙伴'
        };
      }

      // 2. 获取用户的学习能力标签和兴趣
      const userProgress = await executeQuery<any[]>(
        `SELECT learning_ability_tag FROM learning_progress 
         WHERE user_id = ? AND learning_path_id = ?`,
        [userId, learningPathId]
      );

      const userInterests = await executeQuery<any[]>(
        `SELECT interested_languages, interested_directions 
         FROM user_interests WHERE user_id = ?`,
        [userId]
      );

      const userAbilityTag = userProgress[0]?.learning_ability_tag || 'steady';
      const userLanguages = userInterests[0]?.interested_languages || [];
      const userDirections = userInterests[0]?.interested_directions || [];

      // 3. 匹配伙伴（查找进度相近、能力标签一致、兴趣重合的用户）
      const potentialPartners = await executeQuery<any[]>(
        `SELECT DISTINCT lp.user_id, lp.learning_ability_tag,
                ui.interested_languages, ui.interested_directions,
                lp.current_step, lp.total_steps
         FROM learning_progress lp
         LEFT JOIN user_interests ui ON lp.user_id = ui.user_id
         WHERE lp.learning_path_id = ?
           AND lp.user_id != ?
           AND lp.learning_ability_tag = ?
           AND lp.status = 'in_progress'
         LIMIT 10`,
        [learningPathId, userId, userAbilityTag]
      );

      // 4. 计算匹配度并筛选（进度差≤5%，兴趣重合≥60%）
      const matchedPartners = potentialPartners
        .map(partner => {
          const progressDiff = Math.abs(
            (partner.current_step / partner.total_steps) - 
            (userProgress[0]?.current_step / userProgress[0]?.total_steps || 0)
          ) * 100;

          const languages = JSON.parse(partner.interested_languages || '[]');
          const directions = JSON.parse(partner.interested_directions || '[]');
          
          const languageOverlap = this.calculateOverlap(userLanguages, languages);
          const directionOverlap = this.calculateOverlap(userDirections, directions);
          const interestOverlap = (languageOverlap + directionOverlap) / 2;

          return {
            ...partner,
            progressDiff,
            interestOverlap,
            matchScore: progressDiff <= 5 && interestOverlap >= 0.6 ? 
              (1 - progressDiff / 5) * 0.5 + interestOverlap * 0.5 : 0
          };
        })
        .filter(p => p.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3); // 最多3个候选

      // 5. 生成主伙伴（使用匹配到的用户ID或生成虚拟ID）
      const mainPartnerId = matchedPartners[0]?.user_id || this.generateVirtualPartnerId();
      const mainPartner = await this.createPartnerProfile(mainPartnerId, userAbilityTag);

      // 6. 生成备选伙伴（最多2个）
      const alternatives = matchedPartners.slice(1, 3).map(p => ({
        partner_id: p.user_id,
        partner_name: this.generatePartnerName(),
        partner_avatar: this.selectAvatar(),
        partner_signature: this.selectSignature(userAbilityTag)
      }));

      // 7. 保存到MongoDB
      const partnerDoc = new VirtualLearningPartner({
        user_id: userId,
        partner_id: mainPartnerId,
        partner_name: mainPartner.partner_name,
        partner_avatar: mainPartner.partner_avatar,
        partner_signature: mainPartner.partner_signature,
        learning_ability_tag: userAbilityTag,
        partner_level: 1,
        interaction_history: [],
        collaborative_tasks: [],
        total_interactions: 0,
        last_interaction_at: new Date()
      });

      await partnerDoc.save();

      // 8. 同时保存到MySQL（用于快速查询）
      await executeQuery(
        `INSERT INTO virtual_partners 
         (user_id, partner_name, partner_avatar, partner_signature, 
          learning_ability_tag, partner_level, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          mainPartner.partner_name,
          mainPartner.partner_avatar,
          mainPartner.partner_signature,
          userAbilityTag,
          1,
          true
        ]
      );

      return {
        success: true,
        message: '虚拟学习伙伴生成成功',
        partner: {
          partner_id: mainPartnerId,
          ...mainPartner,
          learning_ability_tag: userAbilityTag,
          partner_level: 1
        },
        alternatives: alternatives.length > 0 ? alternatives : undefined
      };
    } catch (error) {
      console.error('生成虚拟学习伙伴失败:', error);
      return {
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 发送伙伴消息
   * Requirements: 22.5, 22.6, 22.19
   */
  async sendMessage(
    userId: number,
    messageType: 'encouragement' | 'learning_tip' | 'task_reminder' | 'question_answer' | 'celebration',
    content?: string,
    relatedKnowledgePoint?: string
  ): Promise<{
    success: boolean;
    message: string;
    response?: {
      content: string;
      message_type: string;
      timestamp: Date;
    };
  }> {
    const startTime = Date.now();
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false,
          message: '未找到虚拟学习伙伴'
        };
      }

      // 生成伙伴回复（使用Qwen3或基础算法）
      let partnerContent: string;
      if (content) {
        // 用户发送消息，生成回复
        partnerContent = await this.generatePartnerResponse(
          content,
          messageType,
          relatedKnowledgePoint,
          partnerDoc.learning_ability_tag
        );
      } else {
        // 伙伴主动发送消息
        partnerContent = await this.generatePartnerMessage(
          messageType,
          relatedKnowledgePoint,
          partnerDoc.learning_ability_tag
        );
      }

      // 保存互动记录
      partnerDoc.interaction_history.push({
        sender: 'partner',
        content: partnerContent,
        message_type: messageType,
        related_knowledge_point: relatedKnowledgePoint,
        timestamp: new Date()
      });

      partnerDoc.total_interactions += 1;
      partnerDoc.last_interaction_at = new Date();
      await partnerDoc.save();

      // 发送通知（异步，不阻塞主流程）
      try {
        const { notificationIntegrationService } = await import('./notification-integration.service.js');
        await notificationIntegrationService.sendPartnerMessageNotification(
          userId,
          partnerDoc.partner_name,
          partnerContent
        );
      } catch (error) {
        console.error('发送伙伴消息通知失败:', error);
      }

      const elapsedTime = Date.now() - startTime;

      return {
        success: true,
        message: '消息发送成功',
        response: {
          content: partnerContent,
          message_type: messageType,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('发送伙伴消息失败:', error);
      return {
        success: false,
        message: `发送失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取互动历史
   * Requirements: 22.5
   */
  async getInteractions(
    userId: number,
    limit: number = 50
  ): Promise<{
    success: boolean;
    interactions: Array<{
      sender: 'user' | 'partner';
      content: string;
      message_type: string;
      timestamp: Date;
    }>;
  }> {
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false,
          interactions: []
        };
      }

      const interactions = partnerDoc.interaction_history
        .slice(-limit)
        .map(msg => ({
          sender: msg.sender,
          content: msg.content,
          message_type: msg.message_type,
          timestamp: msg.timestamp
        }));

      return {
        success: true,
        interactions
      };
    } catch (error) {
      console.error('获取互动历史失败:', error);
      return {
        success: false,
        interactions: []
      };
    }
  }

  /**
   * 生成每日共同任务
   * Requirements: 22.7, 22.8
   */
  async generateDailyTask(userId: number): Promise<{
    success: boolean;
    task?: {
      task_id: number;
      task_description: string;
      target_count: number;
      reward_points: number;
      reward_badge_fragment: string;
    };
  }> {
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false
        };
      }

      // 检查今天是否已有任务
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingTask = partnerDoc.collaborative_tasks.find(
        task => task.completed_at && new Date(task.completed_at) >= today
      );

      if (existingTask) {
        return {
          success: true,
          task: {
            task_id: existingTask.task_id,
            task_description: existingTask.task_description,
            target_count: existingTask.target_count,
            reward_points: existingTask.target_count * 5 * 1.5, // 基础积分×1.5
            reward_badge_fragment: 'collaboration_badge_fragment'
          }
        };
      }

      // 生成新任务
      const taskId = Date.now();
      const taskDescriptions = [
        '一起完成3道练习题',
        '一起观看2个视频课节',
        '一起完成1个实战项目',
        '一起打卡学习5天'
      ];
      const randomDescription = taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)];
      const targetCount = randomDescription.includes('道') ? 3 : 
                         randomDescription.includes('个') ? 2 : 5;

      partnerDoc.collaborative_tasks.push({
        task_id: taskId,
        task_description: randomDescription,
        user_progress: 0,
        partner_progress: 0,
        target_count: targetCount,
        completed: false
      });

      await partnerDoc.save();

      return {
        success: true,
        task: {
          task_id: taskId,
          task_description: randomDescription,
          target_count: targetCount,
          reward_points: targetCount * 5 * 1.5, // 基础积分×1.5
          reward_badge_fragment: 'collaboration_badge_fragment'
        }
      };
    } catch (error) {
      console.error('生成每日任务失败:', error);
      return {
        success: false
      };
    }
  }

  /**
   * 更新任务进度
   * Requirements: 22.7, 22.8
   */
  async updateTaskProgress(
    userId: number,
    taskId: number,
    progress: number
  ): Promise<{
    success: boolean;
    message: string;
    completed?: boolean;
    reward?: {
      points: number;
      badge_fragment: string;
    };
  }> {
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false,
          message: '未找到虚拟学习伙伴'
        };
      }

      const task = partnerDoc.collaborative_tasks.find(t => t.task_id === taskId);
      if (!task) {
        return {
          success: false,
          message: '未找到任务'
        };
      }

      task.user_progress = progress;
      
      // 模拟伙伴进度（随机增加）
      if (Math.random() > 0.5) {
        task.partner_progress = Math.min(
          task.partner_progress + Math.floor(Math.random() * 2) + 1,
          task.target_count
        );
      }

      // 检查是否完成
      if (task.user_progress >= task.target_count && task.partner_progress >= task.target_count) {
        task.completed = true;
        task.completed_at = new Date();

        // 奖励积分和徽章碎片
        const rewardPoints = task.target_count * 5 * 1.5; // 基础积分×1.5
        
        // 更新用户积分
        await executeQuery(
          `UPDATE user_points SET points = points + ? WHERE user_id = ?`,
          [rewardPoints, userId]
        );

        // 记录积分交易
        await executeQuery(
          `INSERT INTO point_transactions 
           (user_id, points, transaction_type, description)
           VALUES (?, ?, 'reward', ?)`,
          [userId, rewardPoints, '完成共同任务奖励']
        );

        return {
          success: true,
          message: '任务完成！',
          completed: true,
          reward: {
            points: rewardPoints,
            badge_fragment: 'collaboration_badge_fragment'
          }
        };
      }

      await partnerDoc.save();

      return {
        success: true,
        message: '进度更新成功',
        completed: false
      };
    } catch (error) {
      console.error('更新任务进度失败:', error);
      return {
        success: false,
        message: `更新失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取进度比拼和排行榜
   * Requirements: 22.9, 22.10
   */
  async getProgressComparison(userId: number): Promise<{
    success: boolean;
    progressDiff?: number;
    leaderboard?: Array<{
      user_id: number;
      partner_name: string;
      completed_tasks: number;
      rank: number;
    }>;
  }> {
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false
        };
      }

      // 计算进度差（模拟）
      const userProgress = await executeQuery<any[]>(
        `SELECT current_step, total_steps FROM learning_progress 
         WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      const userProgressPercent = userProgress[0] 
        ? (userProgress[0].current_step / userProgress[0].total_steps) * 100 
        : 0;

      // 模拟伙伴进度（用户进度±5%）
      const partnerProgressPercent = Math.max(0, Math.min(100, 
        userProgressPercent + (Math.random() * 10 - 5)
      ));

      const progressDiff = Math.abs(userProgressPercent - partnerProgressPercent);

      // 获取每周排行榜
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const allPartners = await VirtualLearningPartner.find({
        'collaborative_tasks.completed_at': { $gte: weekStart }
      });

      const leaderboard = allPartners
        .map(p => ({
          user_id: p.user_id,
          partner_name: p.partner_name,
          completed_tasks: p.collaborative_tasks.filter(
            t => t.completed && t.completed_at && new Date(t.completed_at) >= weekStart
          ).length
        }))
        .sort((a, b) => b.completed_tasks - a.completed_tasks)
        .slice(0, 10)
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      return {
        success: true,
        progressDiff,
        leaderboard
      };
    } catch (error) {
      console.error('获取进度比拼失败:', error);
      return {
        success: false
      };
    }
  }

  /**
   * 伙伴答疑
   * Requirements: 22.12, 22.13
   */
  async askQuestion(
    userId: number,
    question: string
  ): Promise<{
    success: boolean;
    answer?: string;
    canAnswer: boolean;
    guidance?: string;
  }> {
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false,
          canAnswer: false
        };
      }

      // 基于答疑知识库的初步解答（简化实现）
      const keywords = ['函数', '变量', '循环', '条件', '类', '对象'];
      const hasKeyword = keywords.some(kw => question.includes(kw));

      if (hasKeyword) {
        // 可以解答
        const answer = `关于"${question}"，这是一个很好的问题。让我为你简单解释一下...`;
        
        // 保存互动记录
        partnerDoc.interaction_history.push({
          sender: 'user',
          content: question,
          message_type: 'question_answer',
          timestamp: new Date()
        });
        partnerDoc.interaction_history.push({
          sender: 'partner',
          content: answer,
          message_type: 'question_answer',
          timestamp: new Date()
        });
        partnerDoc.total_interactions += 2;
        partnerDoc.last_interaction_at = new Date();
        await partnerDoc.save();

        return {
          success: true,
          answer,
          canAnswer: true
        };
      } else {
        // 无法解答，引导用户
        const guidance = '这个问题比较复杂，建议你到实时答疑室或咨询教师获取更详细的解答。';
        
        partnerDoc.interaction_history.push({
          sender: 'user',
          content: question,
          message_type: 'question_answer',
          timestamp: new Date()
        });
        partnerDoc.interaction_history.push({
          sender: 'partner',
          content: guidance,
          message_type: 'question_answer',
          timestamp: new Date()
        });
        partnerDoc.total_interactions += 2;
        partnerDoc.last_interaction_at = new Date();
        await partnerDoc.save();

        return {
          success: true,
          canAnswer: false,
          guidance
        };
      }
    } catch (error) {
      console.error('伙伴答疑失败:', error);
      return {
        success: false,
        canAnswer: false
      };
    }
  }

  /**
   * 更新伙伴设置
   * Requirements: 22.21
   */
  async updateSettings(
    userId: number,
    settings: {
      is_active?: boolean;
      interaction_frequency?: 'high' | 'medium' | 'low';
    }
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 更新MySQL
      if (settings.is_active !== undefined) {
        await executeQuery(
          `UPDATE virtual_partners SET is_active = ? WHERE user_id = ?`,
          [settings.is_active, userId]
        );
      }

      if (settings.interaction_frequency) {
        await executeQuery(
          `UPDATE virtual_partners SET interaction_frequency = ? WHERE user_id = ?`,
          [settings.interaction_frequency, userId]
        );
      }

      return {
        success: true,
        message: '设置更新成功'
      };
    } catch (error) {
      console.error('更新伙伴设置失败:', error);
      return {
        success: false,
        message: `更新失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 切换伙伴
   * Requirements: 22.21
   */
  async switchPartner(
    userId: number,
    newPartnerId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await connectMongoDB();
      const partnerDoc = await VirtualLearningPartner.findOne({ user_id: userId });
      
      if (!partnerDoc) {
        return {
          success: false,
          message: '未找到虚拟学习伙伴'
        };
      }

      // 生成新伙伴人设
      const newPartner = await this.createPartnerProfile(newPartnerId, partnerDoc.learning_ability_tag);

      partnerDoc.partner_id = newPartnerId;
      partnerDoc.partner_name = newPartner.partner_name;
      partnerDoc.partner_avatar = newPartner.partner_avatar;
      partnerDoc.partner_signature = newPartner.partner_signature;
      await partnerDoc.save();

      // 更新MySQL
      await executeQuery(
        `UPDATE virtual_partners 
         SET partner_name = ?, partner_avatar = ?, partner_signature = ?
         WHERE user_id = ?`,
        [newPartner.partner_name, newPartner.partner_avatar, newPartner.partner_signature, userId]
      );

      return {
        success: true,
        message: '切换伙伴成功'
      };
    } catch (error) {
      console.error('切换伙伴失败:', error);
      return {
        success: false,
        message: `切换失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // ==================== 辅助方法 ====================

  private calculateOverlap(arr1: any[], arr2: any[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    const intersection = arr1.filter(item => arr2.includes(item));
    return intersection.length / Math.max(arr1.length, arr2.length);
  }

  private generateVirtualPartnerId(): number {
    return 1000000 + Math.floor(Math.random() * 999999);
  }

  private generatePartnerName(): string {
    return PARTNER_NAMES[Math.floor(Math.random() * PARTNER_NAMES.length)];
  }

  private selectAvatar(): string {
    return AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
  }

  private selectSignature(abilityTag: 'efficient' | 'steady' | 'basic'): string {
    const signatures = PARTNER_SIGNATURES[abilityTag];
    return signatures[Math.floor(Math.random() * signatures.length)];
  }

  private async createPartnerProfile(
    partnerId: number,
    abilityTag: 'efficient' | 'steady' | 'basic'
  ): Promise<{
    partner_name: string;
    partner_avatar: string;
    partner_signature: string;
  }> {
    return {
      partner_name: this.generatePartnerName(),
      partner_avatar: this.selectAvatar(),
      partner_signature: this.selectSignature(abilityTag)
    };
  }

  private async generatePartnerResponse(
    userMessage: string,
    messageType: string,
    knowledgePoint?: string,
    abilityTag?: 'efficient' | 'steady' | 'basic'
  ): Promise<string> {
    // 简化实现：使用模板生成回复
    // 实际应该调用Qwen3 API
    const templates = {
      encouragement: [
        '加油！我们一起努力！',
        '相信你可以的！',
        '坚持下去，你会成功的！'
      ],
      learning_tip: [
        `关于${knowledgePoint || '这个知识点'}，建议你多练习几遍。`,
        `学习${knowledgePoint || '这个内容'}时，可以尝试结合实际项目。`,
        `掌握${knowledgePoint || '这个知识点'}需要时间和耐心。`
      ],
      task_reminder: [
        '别忘了我们的共同任务哦！',
        '任务快到期了，我们一起加油完成！',
        '记得完成任务，完成后有奖励！'
      ],
      question_answer: [
        '这是一个很好的问题，让我为你解答...',
        '关于这个问题，我的理解是...',
        '这个问题很重要，建议你...'
      ],
      celebration: [
        '恭喜你完成课程！',
        '太棒了！我们一起庆祝！',
        '你的进步让我很骄傲！'
      ]
    };

    const templateList = templates[messageType as keyof typeof templates] || templates.encouragement;
    return templateList[Math.floor(Math.random() * templateList.length)];
  }

  private async generatePartnerMessage(
    messageType: string,
    knowledgePoint?: string,
    abilityTag?: 'efficient' | 'steady' | 'basic'
  ): Promise<string> {
    return this.generatePartnerResponse('', messageType, knowledgePoint, abilityTag);
  }
}

export const virtualPartnerService = new VirtualPartnerService();

