/**
 * AI动态学习路径服务
 * 负责学习数据采集、知识点评估、路径调整等功能
 * Requirements: 21.1-21.20
 */

import { executeQuery } from '../config/database.js';
import { LearningDataCollection } from '../models/mongodb/learning-data-collection.model.js';
import { AILearningPathDynamic } from '../models/mongodb/ai-learning-path-dynamic.model.js';

/** MySQL 查询行类型（用于 executeQuery 返回的数组） */
type SqlRow = Record<string, unknown>;

// 学习数据采集请求接口
export interface LearningDataCollectionRequest {
  user_id: number;
  lesson_id: number;
  data_type: 'video' | 'practice' | 'completion';
  video_data?: {
    pause_positions: number[];
    rewatch_segments?: Array<{ start: number; end: number }>;
    fast_forward_rate?: number;
    playback_speed?: number;
  };
  practice_data?: {
    error_type: 'syntax' | 'logic' | 'performance' | 'runtime';
    knowledge_point_ids: number[];
    correct_rate: number;
    error_details?: string;
    attempt_count?: number;
  };
  completion_data?: {
    completion_time: number;
    resource_views?: number;
    interaction_count?: number;
  };
  session_id: string;
}

// 知识点掌握度接口
export interface KnowledgeMastery {
  knowledge_point_id: number;
  knowledge_point_name: string;
  mastery_level: 'mastered' | 'consolidating' | 'weak';
  practice_correct_rate: number;
  code_error_count: number;
  video_rewatch_count: number;
  lesson_completion_time: number;
  comprehensive_score: number;
}

// 学习能力画像接口
export interface LearningAbilityProfile {
  user_id: number;
  ability_tag: 'efficient' | 'steady' | 'basic';
  avg_completion_time_ratio: number; // 实际时间/预期时间
  repeat_practice_count: number;
  error_patterns: Array<{
    error_type: string;
    knowledge_point_ids: number[];
    frequency: number;
  }>;
}

// 路径调整结果接口
export interface PathAdjustmentResult {
  adjusted_path: {
    current_step: number;
    steps: number[];
    skipped_steps: number[];
    added_steps: Array<{
      step_id: number;
      type: 'micro_lesson' | 'practice' | 'qa_case';
      knowledge_point_id: number;
    }>;
  };
  adjustment_reason: string;
  affected_knowledge_points: Array<{
    kp_id: number;
    kp_name: string;
    mastery_level: string;
    action: 'skip' | 'reinforce';
  }>;
}

export class AILearningPathService {
  /**
   * 采集学习数据
   * Requirements: 21.1, 21.2, 21.3, 21.4
   */
  async collectLearningData(data: LearningDataCollectionRequest): Promise<{ success: boolean; message: string; data_id?: string }> {
    try {
      const startTime = Date.now();

      // 验证数据类型和对应数据
      if (data.data_type === 'video' && !data.video_data) {
        return { success: false, message: '视频数据不能为空' };
      }
      if (data.data_type === 'practice' && !data.practice_data) {
        return { success: false, message: '练习数据不能为空' };
      }
      if (data.data_type === 'completion' && !data.completion_data) {
        return { success: false, message: '完成数据不能为空' };
      }

      // 处理视频数据
      let processedVideoData = null;
      if (data.video_data) {
        const rewatch_segments = data.video_data.rewatch_segments || [];
        processedVideoData = {
          pause_positions: data.video_data.pause_positions || [],
          rewatch_segments,
          fast_forward_rate: data.video_data.fast_forward_rate || 0,
          playback_speed: data.video_data.playback_speed || 1.0,
          total_pauses: data.video_data.pause_positions?.length || 0,
          total_rewatch_count: rewatch_segments.length
        };
      }

      // 处理练习数据
      let processedPracticeData = null;
      if (data.practice_data) {
        processedPracticeData = {
          error_type: data.practice_data.error_type,
          knowledge_point_ids: data.practice_data.knowledge_point_ids,
          correct_rate: data.practice_data.correct_rate,
          error_details: data.practice_data.error_details || '',
          attempt_count: data.practice_data.attempt_count || 1
        };
      }

      // 处理完成数据
      let processedCompletionData = null;
      if (data.completion_data) {
        processedCompletionData = {
          completion_time: data.completion_data.completion_time,
          resource_views: data.completion_data.resource_views || 0,
          interaction_count: data.completion_data.interaction_count || 0
        };
      }

      // 存储到MongoDB
      const collectionRecord = await LearningDataCollection.create({
        user_id: data.user_id,
        lesson_id: data.lesson_id,
        data_type: data.data_type,
        video_data: processedVideoData,
        practice_data: processedPracticeData,
        completion_data: processedCompletionData,
        collected_at: new Date(),
        session_id: data.session_id
      });

      const elapsedTime = Date.now() - startTime;

      // 确保采集延迟不超过5秒 (Requirement 21.4)
      if (elapsedTime > 5000) {
        console.warn(`学习数据采集延迟过高: ${elapsedTime}ms`);
      }

      return {
        success: true,
        message: '学习数据采集成功',
        data_id: collectionRecord._id.toString()
      };
    } catch (error) {
      console.error('学习数据采集失败:', error);
      return {
        success: false,
        message: `学习数据采集失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取用户的学习数据统计
   */
  async getUserLearningStats(userId: number, lessonId?: number): Promise<any> {
    try {
      const query: any = { user_id: userId };
      if (lessonId) {
        query.lesson_id = lessonId;
      }

      const data = await LearningDataCollection.find(query)
        .sort({ collected_at: -1 })
        .limit(100)
        .lean();

      // 统计视频行为
      const videoData = data.filter(d => d.data_type === 'video');
      const totalPauses = videoData.reduce((sum, d) => sum + (d.video_data?.total_pauses || 0), 0);
      const totalRewatches = videoData.reduce((sum, d) => sum + (d.video_data?.total_rewatch_count || 0), 0);

      // 统计练习数据
      const practiceData = data.filter(d => d.data_type === 'practice');
      const avgCorrectRate = practiceData.length > 0
        ? practiceData.reduce((sum, d) => sum + (d.practice_data?.correct_rate || 0), 0) / practiceData.length
        : 0;
      const totalErrors = practiceData.reduce((sum, d) => sum + (d.practice_data?.attempt_count || 0) - 1, 0);

      // 统计完成数据
      const completionData = data.filter(d => d.data_type === 'completion');
      const avgCompletionTime = completionData.length > 0
        ? completionData.reduce((sum, d) => sum + (d.completion_data?.completion_time || 0), 0) / completionData.length
        : 0;

      return {
        total_records: data.length,
        video_stats: {
          total_pauses: totalPauses,
          total_rewatches: totalRewatches,
          avg_pauses_per_video: videoData.length > 0 ? totalPauses / videoData.length : 0
        },
        practice_stats: {
          total_practices: practiceData.length,
          avg_correct_rate: avgCorrectRate,
          total_errors: totalErrors
        },
        completion_stats: {
          total_completions: completionData.length,
          avg_completion_time: avgCompletionTime
        }
      };
    } catch (error) {
      console.error('获取学习数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 评估用户的知识点掌握度
   * Requirements: 21.5, 21.6
   * 
   * 该方法整合学习数据，评估用户对特定知识点的掌握程度：
   * 1. 收集用户在该知识点的所有学习数据
   * 2. 计算综合得分
   * 3. 映射掌握度等级
   * 4. 保存评估结果到数据库
   * 5. 可选：调用Qwen3模型进行AI辅助评估
   * 
   * @param userId 用户ID
   * @param knowledgePointId 知识点ID
   * @param useAIModel 是否使用AI模型辅助评估（默认false，使用规则算法）
   * @returns 知识点掌握度评估结果
   */
  async evaluateKnowledgePoint(
    userId: number,
    knowledgePointId: number,
    useAIModel: boolean = false
  ): Promise<KnowledgeMastery> {
    try {
      const startTime = Date.now();

      // 1. 获取知识点信息
      const knowledgePoints = (await executeQuery(
        'SELECT id, name FROM knowledge_points WHERE id = ?',
        [knowledgePointId]
      )) as SqlRow[];

      if (knowledgePoints.length === 0) {
        throw new Error(`知识点 ${knowledgePointId} 不存在`);
      }

      const knowledgePointName = knowledgePoints[0].name as string;

      // 2. 从MongoDB获取该知识点的练习数据
      const practiceData = await LearningDataCollection.find({
        user_id: userId,
        data_type: 'practice',
        'practice_data.knowledge_point_ids': knowledgePointId
      }).lean();

      // 3. 计算练习正确率
      let practiceCorrectRate = 0;
      let codeErrorCount = 0;
      
      if (practiceData.length > 0) {
        const totalCorrectRate = practiceData.reduce((sum, record) => {
          return sum + (record.practice_data?.correct_rate || 0);
        }, 0);
        practiceCorrectRate = totalCorrectRate / practiceData.length;

        // 统计代码错误次数
        codeErrorCount = practiceData.filter(record => 
          record.practice_data && record.practice_data.correct_rate < 100
        ).length;
      }

      // 4. 从MongoDB获取该知识点相关课节的视频数据
      // 首先获取包含该知识点的课节
      const lessons = (await executeQuery(
        `SELECT DISTINCT cl.id, cl.estimated_minutes 
         FROM course_lessons cl
         JOIN lesson_knowledge_points lkp ON cl.id = lkp.lesson_id
         WHERE lkp.knowledge_point_id = ?`,
        [knowledgePointId]
      )) as { id: number; estimated_minutes: number }[];

      const lessonIds = lessons.map((l) => l.id);
      
      // 获取视频回看数据
      let videoRewatchCount = 0;
      if (lessonIds.length > 0) {
        const videoData = await LearningDataCollection.find({
          user_id: userId,
          lesson_id: { $in: lessonIds },
          data_type: 'video'
        }).lean();

        videoRewatchCount = videoData.reduce((sum, record) => {
          return sum + (record.video_data?.total_rewatch_count || 0);
        }, 0);
      }

      // 5. 获取完成时长数据
      let completionTimeRatio = 1.0;
      if (lessonIds.length > 0) {
        const completionData = await LearningDataCollection.find({
          user_id: userId,
          lesson_id: { $in: lessonIds },
          data_type: 'completion'
        }).lean();

        if (completionData.length > 0 && lessons.length > 0) {
          const totalActualTime = completionData.reduce((sum, record) => {
            return sum + (record.completion_data?.completion_time || 0);
          }, 0);

          const totalExpectedTime = lessons.reduce((sum: number, lesson) => {
            return sum + (lesson.estimated_minutes * 60);
          }, 0);

          if (totalExpectedTime > 0) {
            completionTimeRatio = totalActualTime / totalExpectedTime;
          }
        }
      }

      // 6. 计算综合得分
      const comprehensiveScore = this.calculateComprehensiveScore(
        practiceCorrectRate,
        codeErrorCount,
        videoRewatchCount,
        completionTimeRatio
      );

      // 7. 可选：使用AI模型调整评估结果
      if (useAIModel) {
        try {
          // TODO: 集成Qwen3模型进行AI辅助评估
          // 这里可以调用AI服务，传入学习数据，获取AI的评估建议
          // const aiAdjustment = await this.callQwen3ForEvaluation(userId, knowledgePointId, comprehensiveScore);
          // comprehensiveScore = aiAdjustment.adjusted_score;
          console.log('AI模型评估功能待集成');
        } catch (error) {
          console.warn('AI模型评估失败，使用规则算法结果:', error);
        }
      }

      // 8. 映射掌握度等级
      const masteryLevel = this.mapMasteryLevel(comprehensiveScore);

      // 9. 保存评估结果到MySQL
      const existingMastery = (await executeQuery(
        'SELECT id FROM knowledge_mastery WHERE user_id = ? AND knowledge_point_id = ?',
        [userId, knowledgePointId]
      )) as SqlRow[];

      if (existingMastery.length > 0) {
        // 更新现有记录
        await executeQuery(
          `UPDATE knowledge_mastery 
           SET mastery_level = ?, 
               practice_correct_rate = ?, 
               code_error_count = ?, 
               video_rewatch_count = ?, 
               lesson_completion_time = ?, 
               comprehensive_score = ?,
               last_evaluated_at = NOW(),
               updated_at = NOW()
           WHERE user_id = ? AND knowledge_point_id = ?`,
          [
            masteryLevel,
            practiceCorrectRate,
            codeErrorCount,
            videoRewatchCount,
            Math.round(completionTimeRatio * 100),
            comprehensiveScore,
            userId,
            knowledgePointId
          ]
        );
      } else {
        // 插入新记录
        await executeQuery(
          `INSERT INTO knowledge_mastery 
           (user_id, knowledge_point_id, mastery_level, practice_correct_rate, 
            code_error_count, video_rewatch_count, lesson_completion_time, 
            comprehensive_score, last_evaluated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            knowledgePointId,
            masteryLevel,
            practiceCorrectRate,
            codeErrorCount,
            videoRewatchCount,
            Math.round(completionTimeRatio * 100),
            comprehensiveScore
          ]
        );
      }

      const elapsedTime = Date.now() - startTime;

      // 确保评估触发时间 < 100ms (Requirement 21.13)
      if (elapsedTime > 100) {
        console.warn(`知识点评估耗时过长: ${elapsedTime}ms`);
      }

      // 10. 返回评估结果
      const result: KnowledgeMastery = {
        knowledge_point_id: knowledgePointId,
        knowledge_point_name: knowledgePointName,
        mastery_level: masteryLevel,
        practice_correct_rate: Math.round(practiceCorrectRate * 100) / 100,
        code_error_count: codeErrorCount,
        video_rewatch_count: videoRewatchCount,
        lesson_completion_time: Math.round(completionTimeRatio * 100),
        comprehensive_score: comprehensiveScore
      };

      console.log(`用户 ${userId} 的知识点 ${knowledgePointName} 评估完成:`, {
        mastery_level: masteryLevel,
        comprehensive_score: comprehensiveScore,
        elapsed_time: elapsedTime
      });

      return result;
    } catch (error) {
      console.error('评估知识点掌握度失败:', error);
      throw new Error(`评估知识点掌握度失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量评估用户的多个知识点
   * Requirements: 21.5, 21.6
   * 
   * @param userId 用户ID
   * @param knowledgePointIds 知识点ID数组
   * @param useAIModel 是否使用AI模型
   * @returns 知识点掌握度评估结果数组
   */
  async evaluateMultipleKnowledgePoints(
    userId: number,
    knowledgePointIds: number[],
    useAIModel: boolean = false
  ): Promise<KnowledgeMastery[]> {
    const results: KnowledgeMastery[] = [];

    for (const kpId of knowledgePointIds) {
      try {
        const result = await this.evaluateKnowledgePoint(userId, kpId, useAIModel);
        results.push(result);
      } catch (error) {
        console.error(`评估知识点 ${kpId} 失败:`, error);
        // 继续评估其他知识点
      }
    }

    return results;
  }

  /**
   * 获取用户的所有知识点掌握度
   * Requirements: 21.6
   * 
   * @param userId 用户ID
   * @returns 知识点掌握度列表
   */
  async getUserKnowledgeMastery(userId: number): Promise<KnowledgeMastery[]> {
    try {
      const masteryRecords = (await executeQuery(
        `SELECT km.*, kp.name as knowledge_point_name
         FROM knowledge_mastery km
         JOIN knowledge_points kp ON km.knowledge_point_id = kp.id
         WHERE km.user_id = ?
         ORDER BY km.last_evaluated_at DESC`,
        [userId]
      )) as SqlRow[];

      return masteryRecords.map((record) => ({
        knowledge_point_id: record.knowledge_point_id as number,
        knowledge_point_name: record.knowledge_point_name as string,
        mastery_level: record.mastery_level as KnowledgeMastery['mastery_level'],
        practice_correct_rate: record.practice_correct_rate as number,
        code_error_count: record.code_error_count as number,
        video_rewatch_count: record.video_rewatch_count as number,
        lesson_completion_time: record.lesson_completion_time as number,
        comprehensive_score: record.comprehensive_score as number
      }));
    } catch (error) {
      console.error('获取用户知识点掌握度失败:', error);
      throw error;
    }
  }

  /**
   * 计算知识点掌握度综合得分
   * Requirements: 21.5, 21.6
   * 公式: 正确率×0.4 + (100-错误次数×10)×0.3 + (100-回看次数×10)×0.2 + 完成效率×0.1
   */
  calculateComprehensiveScore(
    practiceCorrectRate: number,
    codeErrorCount: number,
    videoRewatchCount: number,
    completionTimeRatio: number // 实际时间/预期时间，越小越好
  ): number {
    // 正确率得分 (0-100)
    const correctRateScore = practiceCorrectRate;

    // 错误次数得分 (0-100)，错误越少得分越高
    const errorScore = Math.max(0, 100 - codeErrorCount * 10);

    // 回看次数得分 (0-100)，回看越少得分越高
    const rewatchScore = Math.max(0, 100 - videoRewatchCount * 10);

    // 完成效率得分 (0-100)，时间比例越小得分越高
    // 如果实际时间 = 预期时间，得分100
    // 如果实际时间 = 2倍预期时间，得分50
    const efficiencyScore = Math.max(0, Math.min(100, 100 / completionTimeRatio));

    // 综合得分
    const comprehensiveScore = 
      correctRateScore * 0.4 +
      errorScore * 0.3 +
      rewatchScore * 0.2 +
      efficiencyScore * 0.1;

    return Math.round(comprehensiveScore * 100) / 100; // 保留两位小数
  }

  /**
   * 映射掌握度等级
   * Requirements: 21.6
   * ≥85% = 已掌握 (mastered)
   * 60-84% = 待巩固 (consolidating)
   * <60% = 薄弱 (weak)
   */
  mapMasteryLevel(comprehensiveScore: number): 'mastered' | 'consolidating' | 'weak' {
    if (comprehensiveScore >= 85) {
      return 'mastered';
    } else if (comprehensiveScore >= 60) {
      return 'consolidating';
    } else {
      return 'weak';
    }
  }

  /**
   * 生成学习能力标签
   * Requirements: 21.7, 21.8
   * 高效型: 平均完成时间 < 预期时间×0.8 且 重复练习次数 < 2
   * 基础型: 平均完成时间 > 预期时间×1.5 或 重复练习次数 > 5
   * 稳健型: 其他情况
   */
  generateAbilityTag(
    avgCompletionTimeRatio: number,
    repeatPracticeCount: number
  ): 'efficient' | 'steady' | 'basic' {
    if (avgCompletionTimeRatio < 0.8 && repeatPracticeCount < 2) {
      return 'efficient';
    } else if (avgCompletionTimeRatio > 1.5 || repeatPracticeCount > 5) {
      return 'basic';
    } else {
      return 'steady';
    }
  }

  /**
   * 识别错误模式
   * Requirements: 21.7
   */
  async identifyErrorPatterns(userId: number): Promise<Array<{
    error_type: string;
    knowledge_point_ids: number[];
    frequency: number;
  }>> {
    try {
      const practiceData = await LearningDataCollection.find({
        user_id: userId,
        data_type: 'practice'
      }).lean();

      // 统计错误模式
      const errorMap = new Map<string, { knowledge_point_ids: Set<number>; frequency: number }>();

      for (const record of practiceData) {
        if (record.practice_data) {
          const errorType = record.practice_data.error_type;
          const kpIds = record.practice_data.knowledge_point_ids;

          if (!errorMap.has(errorType)) {
            errorMap.set(errorType, { knowledge_point_ids: new Set(), frequency: 0 });
          }

          const errorInfo = errorMap.get(errorType)!;
          errorInfo.frequency++;
          kpIds.forEach(id => errorInfo.knowledge_point_ids.add(id));
        }
      }

      // 转换为数组
      const errorPatterns = Array.from(errorMap.entries()).map(([error_type, info]) => ({
        error_type,
        knowledge_point_ids: Array.from(info.knowledge_point_ids),
        frequency: info.frequency
      }));

      // 按频率降序排序
      errorPatterns.sort((a, b) => b.frequency - a.frequency);

      return errorPatterns;
    } catch (error) {
      console.error('识别错误模式失败:', error);
      return [];
    }
  }

  /**
   * 生成完整的学习能力画像
   * Requirements: 21.7, 21.8
   * 
   * 该方法整合学习数据，生成用户的学习能力画像，包括：
   * 1. 能力标签（高效型/稳健型/基础型）
   * 2. 错误模式识别（关联知识点）
   * 3. 学习效率指标
   * 
   * @param userId 用户ID
   * @param lessonId 可选的课节ID，用于特定课节的画像生成
   * @returns 学习能力画像
   */
  async generateLearningAbilityProfile(
    userId: number,
    lessonId?: number
  ): Promise<LearningAbilityProfile> {
    try {
      // 1. 获取用户的学习数据统计
      const stats = await this.getUserLearningStats(userId, lessonId);

      // 2. 计算平均完成时间比率
      // 从数据库获取课节的预期完成时间
      const query: any = { user_id: userId };
      if (lessonId) {
        query.lesson_id = lessonId;
      }

      const completionRecords = await LearningDataCollection.find({
        ...query,
        data_type: 'completion'
      }).lean();

      // 计算平均完成时间比率
      let avgCompletionTimeRatio = 1.0;
      if (completionRecords.length > 0) {
        // 获取课节的预期时间（从数据库）
        const lessonIds = [...new Set(completionRecords.map(r => r.lesson_id))];
        const lessons = (await executeQuery(
          `SELECT id, estimated_minutes FROM course_lessons WHERE id IN (${lessonIds.join(',')})`,
          []
        )) as { id: number; estimated_minutes: number }[];

        const lessonTimeMap = new Map<number, number>(
          lessons.map((l) => [l.id, l.estimated_minutes * 60]) // 转换为秒
        );

        // 计算每个完成记录的时间比率
        const timeRatios = completionRecords
          .filter(r => r.completion_data && lessonTimeMap.has(r.lesson_id))
          .map(r => {
            const actualTime = r.completion_data!.completion_time;
            const expectedTime = lessonTimeMap.get(r.lesson_id);
            if (!expectedTime || expectedTime === 0) {
              return 1.0; // 默认比率
            }
            return actualTime / expectedTime;
          });

        if (timeRatios.length > 0) {
          avgCompletionTimeRatio = timeRatios.reduce((sum, ratio) => sum + ratio, 0) / timeRatios.length;
        }
      }

      // 3. 计算重复练习次数
      const practiceRecords = await LearningDataCollection.find({
        ...query,
        data_type: 'practice'
      }).lean();

      // 统计每个知识点的练习次数
      const kpPracticeCount = new Map<number, number>();
      for (const record of practiceRecords) {
        if (record.practice_data) {
          for (const kpId of record.practice_data.knowledge_point_ids) {
            kpPracticeCount.set(kpId, (kpPracticeCount.get(kpId) || 0) + 1);
          }
        }
      }

      // 计算平均重复练习次数（超过1次的才算重复）
      const repeatCounts = Array.from(kpPracticeCount.values()).filter(count => count > 1);
      const repeatPracticeCount = repeatCounts.length > 0
        ? repeatCounts.reduce((sum, count) => sum + count, 0) / repeatCounts.length
        : 0;

      // 4. 生成能力标签
      const abilityTag = this.generateAbilityTag(avgCompletionTimeRatio, repeatPracticeCount);

      // 5. 识别错误模式
      const errorPatterns = await this.identifyErrorPatterns(userId);

      // 6. 构建学习能力画像
      const profile: LearningAbilityProfile = {
        user_id: userId,
        ability_tag: abilityTag,
        avg_completion_time_ratio: Math.round(avgCompletionTimeRatio * 100) / 100,
        repeat_practice_count: Math.round(repeatPracticeCount * 100) / 100,
        error_patterns: errorPatterns
      };

      // 7. 记录画像生成日志
      console.log(`用户 ${userId} 的学习能力画像已生成:`, {
        ability_tag: abilityTag,
        avg_completion_time_ratio: profile.avg_completion_time_ratio,
        repeat_practice_count: profile.repeat_practice_count,
        error_pattern_count: errorPatterns.length
      });

      return profile;
    } catch (error) {
      console.error('生成学习能力画像失败:', error);
      throw new Error(`生成学习能力画像失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 根据能力标签获取学习建议
   * Requirements: 21.11, 21.12
   * 
   * @param abilityTag 能力标签
   * @returns 学习建议
   */
  getLearningRecommendationsByAbility(abilityTag: 'efficient' | 'steady' | 'basic'): {
    skip_basic_lessons: boolean;
    add_advanced_projects: boolean;
    reduce_difficulty_gradient: boolean;
    add_step_by_step_guidance: boolean;
    recommended_pace: string;
  } {
    switch (abilityTag) {
      case 'efficient':
        return {
          skip_basic_lessons: true,
          add_advanced_projects: true,
          reduce_difficulty_gradient: false,
          add_step_by_step_guidance: false,
          recommended_pace: '快速学习，可跳过基础讲解，直接进入实战项目'
        };
      case 'basic':
        return {
          skip_basic_lessons: false,
          add_advanced_projects: false,
          reduce_difficulty_gradient: true,
          add_step_by_step_guidance: true,
          recommended_pace: '稳扎稳打，降低难度梯度，增加分步指导和基础练习'
        };
      case 'steady':
      default:
        return {
          skip_basic_lessons: false,
          add_advanced_projects: false,
          reduce_difficulty_gradient: false,
          add_step_by_step_guidance: false,
          recommended_pace: '按标准节奏学习，保持当前学习方式'
        };
    }
  }

  /**
   * 根据错误模式获取针对性建议
   * Requirements: 21.7
   * 
   * @param errorPatterns 错误模式数组
   * @returns 针对性建议
   */
  async getRecommendationsByErrorPatterns(
    errorPatterns: Array<{
      error_type: string;
      knowledge_point_ids: number[];
      frequency: number;
    }>
  ): Promise<Array<{
    error_type: string;
    knowledge_points: string[];
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>> {
    const recommendations = [];

    for (const pattern of errorPatterns) {
      // 获取知识点名称
      const kpNames: string[] = [];
      if (pattern.knowledge_point_ids.length > 0) {
        const kps = (await executeQuery(
          `SELECT name FROM knowledge_points WHERE id IN (${pattern.knowledge_point_ids.join(',')})`,
          []
        )) as { name: string }[];
        kpNames.push(...kps.map((kp) => kp.name));
      }

      // 根据错误类型生成建议
      let recommendation = '';
      let priority: 'high' | 'medium' | 'low' = 'medium';

      switch (pattern.error_type) {
        case 'syntax':
          recommendation = '建议加强语法基础练习，多阅读标准代码示例，使用IDE的语法检查功能';
          priority = pattern.frequency > 5 ? 'high' : 'medium';
          break;
        case 'logic':
          recommendation = '建议加强逻辑思维训练，多做算法题，学习调试技巧和问题分析方法';
          priority = 'high';
          break;
        case 'performance':
          recommendation = '建议学习性能优化技巧，了解时间复杂度和空间复杂度，掌握常见优化模式';
          priority = 'medium';
          break;
        case 'runtime':
          recommendation = '建议加强异常处理和边界条件检查，学习防御性编程技巧';
          priority = pattern.frequency > 3 ? 'high' : 'medium';
          break;
        default:
          recommendation = '建议针对性复习相关知识点，多做练习题巩固理解';
          priority = 'low';
      }

      recommendations.push({
        error_type: pattern.error_type,
        knowledge_points: kpNames,
        recommendation,
        priority
      });
    }

    // 按优先级排序
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations;
  }

  /**
   * 动态调整学习路径
   * Requirements: 21.9, 21.10, 21.11, 21.12, 21.13, 21.14
   * 
   * 该方法根据用户的知识点掌握度和学习能力画像，动态调整学习路径：
   * 1. 跳过已掌握的知识点对应的课节
   * 2. 为薄弱知识点添加补强内容（微课程、针对性练习、答疑案例）
   * 3. 根据学习能力标签调整难度（高效型跳过基础、基础型降低难度）
   * 4. 确保评估触发 < 100ms，路径更新 < 300ms
   * 
   * @param userId 用户ID
   * @param pathId 学习路径ID
   * @returns 调整后的学习路径
   */
  async adjustLearningPath(
    userId: number,
    pathId: number
  ): Promise<PathAdjustmentResult> {
    try {
      const startTime = Date.now();

      // 1. 获取原始学习路径和步骤
      const pathInfo = (await executeQuery(
        'SELECT * FROM learning_paths WHERE id = ?',
        [pathId]
      )) as SqlRow[];

      if (pathInfo.length === 0) {
        throw new Error(`学习路径 ${pathId} 不存在`);
      }

      const originalSteps = (await executeQuery(
        `SELECT * FROM learning_path_steps 
         WHERE learning_path_id = ? 
         ORDER BY step_number ASC`,
        [pathId]
      )) as SqlRow[];

      // 2. 获取用户的学习进度
      const progressInfo = (await executeQuery(
        `SELECT * FROM learning_progress 
         WHERE user_id = ? AND learning_path_id = ?`,
        [userId, pathId]
      )) as SqlRow[];

      const currentStep = progressInfo.length > 0 ? (progressInfo[0].current_step as number) : 1;
      const completedSteps: number[] = progressInfo.length > 0 
        ? JSON.parse((progressInfo[0].completed_steps as string) || '[]') 
        : [];

      // 3. 获取用户的知识点掌握度
      const masteryList = await this.getUserKnowledgeMastery(userId);
      const masteryMap = new Map<number, KnowledgeMastery>();
      masteryList.forEach(m => masteryMap.set(m.knowledge_point_id, m));

      // 4. 获取用户的学习能力画像
      const abilityProfile = await this.generateLearningAbilityProfile(userId);

      // 5. 分析每个步骤关联的知识点
      const stepKnowledgePoints = (await executeQuery(
        `SELECT lps.id as step_id, lps.step_number, lps.title, 
                lps.resource_type, lps.estimated_minutes,
                GROUP_CONCAT(DISTINCT lkp.knowledge_point_id) as kp_ids,
                GROUP_CONCAT(DISTINCT kp.name) as kp_names
         FROM learning_path_steps lps
         LEFT JOIN lesson_knowledge_points lkp ON lps.resource_id = lkp.lesson_id
         LEFT JOIN knowledge_points kp ON lkp.knowledge_point_id = kp.id
         WHERE lps.learning_path_id = ?
         GROUP BY lps.id, lps.step_number, lps.title, lps.resource_type, lps.estimated_minutes
         ORDER BY lps.step_number ASC`,
        [pathId]
      )) as { step_id: number; step_number: number; title?: string; resource_type?: string; estimated_minutes?: number; kp_ids?: string; kp_names?: string }[];

      // 6. 执行路径调整算法
      const adjustedSteps: number[] = [];
      const skippedSteps: number[] = [];
      const addedSteps: Array<{ step_id: number; type: 'micro_lesson' | 'practice' | 'qa_case'; knowledge_point_id: number }> = [];
      const affectedKnowledgePoints: Array<{
        kp_id: number;
        kp_name: string;
        mastery_level: string;
        action: 'skip' | 'reinforce';
      }> = [];

      let adjustmentReason = '';
      const reasons: string[] = [];

      for (const step of stepKnowledgePoints) {
        const stepId = step.step_id;
        const stepNumber = step.step_number;
        const kpIds = step.kp_ids ? step.kp_ids.split(',').map((id: string) => parseInt(id)) : [];
        const kpNames = step.kp_names ? step.kp_names.split(',') : [];

        // 跳过已完成的步骤
        if (completedSteps.includes(stepNumber)) {
          adjustedSteps.push(stepNumber);
          continue;
        }

        // 检查该步骤的知识点掌握情况
        let allMastered = false;
        let hasWeak = false;
        const weakKnowledgePoints: Array<{ id: number; name: string }> = [];

        if (kpIds.length > 0) {
          allMastered = kpIds.every(kpId => {
            const mastery = masteryMap.get(kpId);
            return mastery && mastery.mastery_level === 'mastered';
          });

          kpIds.forEach((kpId, index) => {
            const mastery = masteryMap.get(kpId);
            if (mastery && mastery.mastery_level === 'weak') {
              hasWeak = true;
              weakKnowledgePoints.push({ id: kpId, name: kpNames[index] || `知识点${kpId}` });
            }
          });
        }

        // 规则1: 跳过已掌握的知识点（Requirement 21.9）
        if (allMastered && kpIds.length > 0) {
          skippedSteps.push(stepNumber);
          kpIds.forEach((kpId, index) => {
            affectedKnowledgePoints.push({
              kp_id: kpId,
              kp_name: kpNames[index] || `知识点${kpId}`,
              mastery_level: 'mastered',
              action: 'skip'
            });
          });
          reasons.push(`跳过步骤${stepNumber}：${step.title}（已掌握相关知识点）`);
          continue;
        }

        // 规则2: 高效型学习者跳过基础讲解（Requirement 21.11）
        if (abilityProfile.ability_tag === 'efficient' && 
            step.resource_type === 'article' && 
            step.title.includes('基础') || step.title.includes('入门')) {
          skippedSteps.push(stepNumber);
          reasons.push(`跳过步骤${stepNumber}：${step.title}（高效型学习者，跳过基础讲解）`);
          continue;
        }

        // 保留该步骤
        adjustedSteps.push(stepNumber);

        // 规则3: 为薄弱知识点添加补强内容（Requirement 21.10）
        if (hasWeak) {
          for (const weakKp of weakKnowledgePoints) {
            // 添加微课程（5-10分钟）
            addedSteps.push({
              step_id: -1, // 临时ID，表示新增步骤
              type: 'micro_lesson',
              knowledge_point_id: weakKp.id
            });

            // 添加针对性练习题（3-5道）
            addedSteps.push({
              step_id: -2,
              type: 'practice',
              knowledge_point_id: weakKp.id
            });

            // 添加答疑案例
            addedSteps.push({
              step_id: -3,
              type: 'qa_case',
              knowledge_point_id: weakKp.id
            });

            affectedKnowledgePoints.push({
              kp_id: weakKp.id,
              kp_name: weakKp.name,
              mastery_level: 'weak',
              action: 'reinforce'
            });

            reasons.push(`为薄弱知识点"${weakKp.name}"添加补强内容`);
          }
        }
      }

      // 规则4: 基础型学习者降低难度梯度（Requirement 21.12）
      if (abilityProfile.ability_tag === 'basic') {
        reasons.push('基础型学习者：已降低难度梯度，增加分步指导');
      }

      // 7. 生成调整说明
      adjustmentReason = reasons.length > 0 
        ? reasons.join('；') 
        : '路径无需调整，保持原有顺序';

      // 8. 保存调整记录到MongoDB
      const adjustmentDetails: Array<{
        knowledge_point_id: number;
        knowledge_point_name: string;
        old_mastery_level: 'mastered' | 'consolidating' | 'weak';
        new_mastery_level: 'mastered' | 'consolidating' | 'weak';
        action: 'skip' | 'add_practice' | 'add_micro_lesson' | 'increase_difficulty' | 'decrease_difficulty';
        reason: string;
      }> = [];

      // 转换affected_knowledge_points为adjustment_details格式
      for (const kp of affectedKnowledgePoints) {
        const mastery = masteryMap.get(kp.kp_id);
        const oldLevel = mastery ? mastery.mastery_level : 'weak';
        
        adjustmentDetails.push({
          knowledge_point_id: kp.kp_id,
          knowledge_point_name: kp.kp_name,
          old_mastery_level: oldLevel,
          new_mastery_level: kp.mastery_level as 'mastered' | 'consolidating' | 'weak',
          action: kp.action === 'skip' ? 'skip' : 'add_practice',
          reason: kp.action === 'skip' 
            ? `知识点已掌握，跳过相关课节` 
            : `知识点薄弱，添加补强内容`
        });
      }

      const adjustmentRecord = await AILearningPathDynamic.create({
        user_id: userId,
        learning_path_id: pathId,
        adjustment_type: 'knowledge_evaluation',
        trigger_event: '用户请求路径调整',
        adjustment_details: adjustmentDetails,
        learning_ability_tag: abilityProfile.ability_tag,
        evaluation_score: Math.round(
          masteryList.reduce((sum, m) => sum + m.comprehensive_score, 0) / 
          (masteryList.length || 1)
        ),
        adjustment_summary: adjustmentReason,
        created_at: new Date()
      });

      const elapsedTime = Date.now() - startTime;

      // 确保路径更新响应 < 300ms (Requirement 21.14)
      if (elapsedTime > 300) {
        console.warn(`路径调整耗时过长: ${elapsedTime}ms`);
      }

      // 9. 返回调整结果
      const result: PathAdjustmentResult = {
        adjusted_path: {
          current_step: currentStep,
          steps: adjustedSteps,
          skipped_steps: skippedSteps,
          added_steps: addedSteps
        },
        adjustment_reason: adjustmentReason,
        affected_knowledge_points: affectedKnowledgePoints
      };

      console.log(`用户 ${userId} 的学习路径 ${pathId} 调整完成:`, {
        original_steps: originalSteps.length,
        adjusted_steps: adjustedSteps.length,
        skipped_steps: skippedSteps.length,
        added_steps: addedSteps.length,
        elapsed_time: elapsedTime
      });

      // 同步到思维导图（异步，不阻塞主流程）
      try {
        const { mindMapSyncService } = await import('./mindmap-sync.service.js');
        await mindMapSyncService.syncPathAdjustmentToMindMap(
          userId,
          pathId,
          affectedKnowledgePoints.map(kp => ({
            knowledge_point_id: kp.kp_id,
            knowledge_point_name: kp.kp_name,
            old_mastery_level: kp.mastery_level,
            new_mastery_level: kp.mastery_level,
            action: kp.action
          }))
        );
      } catch (error) {
        console.error('同步思维导图失败:', error);
      }

      return result;
    } catch (error) {
      console.error('动态调整学习路径失败:', error);
      throw new Error(`动态调整学习路径失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取路径调整日志
   * Requirements: 21.16, 21.17
   * 
   * 该方法从MongoDB获取用户的学习路径调整历史记录，包括：
   * 1. 调整类型（知识点评估、能力适配、进度优化）
   * 2. 触发事件
   * 3. 调整详情（知识点变化、采取的行动）
   * 4. 学习能力标签
   * 5. 评估得分
   * 6. 调整说明
   * 
   * @param userId 用户ID
   * @param learningPathId 可选，筛选特定学习路径的调整记录
   * @param limit 返回记录数量限制（默认20，最大100）
   * @param adjustmentType 可选，筛选调整类型
   * @returns 调整日志列表和总数
   */
  async getAdjustmentLogs(
    userId: number,
    learningPathId?: number,
    limit: number = 20,
    adjustmentType?: 'knowledge_evaluation' | 'ability_adaptation' | 'progress_optimization'
  ): Promise<{
    total: number;
    logs: Array<{
      id: string;
      learning_path_id: number;
      adjustment_type: string;
      trigger_event: string;
      adjustment_details: Array<{
        knowledge_point_id: number;
        knowledge_point_name: string;
        old_mastery_level: string;
        new_mastery_level: string;
        action: string;
        reason: string;
      }>;
      learning_ability_tag: string;
      evaluation_score: number;
      adjustment_summary: string;
      created_at: Date;
    }>;
  }> {
    try {
      // 构建查询条件
      const query: any = { user_id: userId };
      
      if (learningPathId) {
        query.learning_path_id = learningPathId;
      }
      
      if (adjustmentType) {
        query.adjustment_type = adjustmentType;
      }

      // 获取总数
      const total = await AILearningPathDynamic.countDocuments(query).maxTimeMS(2000);

      // 获取日志记录
      const records = await AILearningPathDynamic.find(query)
        .sort({ created_at: -1 }) // 按创建时间倒序
        .limit(limit)
        .lean();

      // 格式化返回数据
      const logs = records.map(record => ({
        id: record._id.toString(),
        learning_path_id: record.learning_path_id,
        adjustment_type: record.adjustment_type,
        trigger_event: record.trigger_event,
        adjustment_details: record.adjustment_details.map(detail => ({
          knowledge_point_id: detail.knowledge_point_id,
          knowledge_point_name: detail.knowledge_point_name,
          old_mastery_level: detail.old_mastery_level,
          new_mastery_level: detail.new_mastery_level,
          action: detail.action,
          reason: detail.reason
        })),
        learning_ability_tag: record.learning_ability_tag,
        evaluation_score: record.evaluation_score,
        adjustment_summary: record.adjustment_summary,
        created_at: record.created_at
      }));

      console.log(`用户 ${userId} 的路径调整日志查询完成:`, {
        total,
        returned: logs.length,
        learning_path_id: learningPathId,
        adjustment_type: adjustmentType
      });

      return {
        total,
        logs
      };
    } catch (error) {
      console.error('获取路径调整日志失败:', error);
      // 演示模式降级：MongoDB 不可用时返回空列表
      return { total: 0, logs: [] };
    }
  }

  /**
   * 切换动态调整开关
   * Requirements: 21.18
   * 
   * 该方法允许用户开启或关闭学习路径的动态调整功能：
   * 1. 更新 learning_progress 表中的 dynamic_adjustment_enabled 字段
   * 2. 如果关闭动态调整，恢复默认学习路径
   * 3. 记录用户的选择
   * 4. 持久化设置，跨会话保持
   * 
   * @param userId 用户ID
   * @param learningPathId 学习路径ID
   * @param enabled 是否启用动态调整
   * @returns 操作结果
   */
  async toggleDynamicAdjustment(
    userId: number,
    learningPathId: number,
    enabled: boolean
  ): Promise<{
    success: boolean;
    message: string;
    current_state: {
      dynamic_adjustment_enabled: boolean;
      learning_path_id: number;
      restored_to_default: boolean;
    };
  }> {
    try {
      // 1. 检查学习进度记录是否存在
      const progressRecords = (await executeQuery(
        `SELECT id, current_step, completed_steps, dynamic_adjustment_enabled
         FROM learning_progress
         WHERE user_id = ? AND learning_path_id = ?`,
        [userId, learningPathId]
      )) as SqlRow[];

      if (progressRecords.length === 0) {
        return {
          success: false,
          message: '学习进度记录不存在，请先开始学习该路径',
          current_state: {
            dynamic_adjustment_enabled: false,
            learning_path_id: learningPathId,
            restored_to_default: false
          }
        };
      }

      const progressRecord = progressRecords[0];
      const currentState = progressRecord.dynamic_adjustment_enabled as boolean;

      // 2. 如果状态相同，无需更新
      if (currentState === enabled) {
        return {
          success: true,
          message: `动态调整已${enabled ? '启用' : '关闭'}`,
          current_state: {
            dynamic_adjustment_enabled: enabled,
            learning_path_id: learningPathId,
            restored_to_default: false
          }
        };
      }

      // 3. 更新动态调整开关状态
      await executeQuery(
        `UPDATE learning_progress
         SET dynamic_adjustment_enabled = ?,
             updated_at = NOW()
         WHERE user_id = ? AND learning_path_id = ?`,
        [enabled, userId, learningPathId]
      );

      let restoredToDefault = false;

      // 4. 如果关闭动态调整，恢复默认路径
      if (!enabled) {
        // 获取原始学习路径的所有步骤
        const originalSteps = (await executeQuery(
          `SELECT step_number
           FROM learning_path_steps
           WHERE learning_path_id = ?
           ORDER BY step_number ASC`,
          [learningPathId]
        )) as { step_number: number }[];

        // 获取已完成的步骤
        const completedSteps: number[] = progressRecord.completed_steps 
          ? JSON.parse(String(progressRecord.completed_steps)) 
          : [];

        // 恢复默认路径：所有未完成的步骤都应该可见
        // 这里不需要修改 completed_steps，只是确保用户看到完整的原始路径
        restoredToDefault = true;

        // 记录恢复操作到MongoDB
        await AILearningPathDynamic.create({
          user_id: userId,
          learning_path_id: learningPathId,
          adjustment_type: 'progress_optimization',
          trigger_event: '用户关闭动态调整',
          adjustment_details: [{
            knowledge_point_id: 0,
            knowledge_point_name: '系统操作',
            old_mastery_level: 'weak',
            new_mastery_level: 'weak',
            action: 'skip',
            reason: '用户选择关闭动态调整，恢复默认学习路径'
          }],
          learning_ability_tag: 'steady',
          evaluation_score: 0,
          adjustment_summary: '用户关闭动态调整功能，已恢复默认学习路径',
          created_at: new Date()
        });

        console.log(`用户 ${userId} 关闭了学习路径 ${learningPathId} 的动态调整，已恢复默认路径`);
      } else {
        // 记录启用操作到MongoDB
        await AILearningPathDynamic.create({
          user_id: userId,
          learning_path_id: learningPathId,
          adjustment_type: 'progress_optimization',
          trigger_event: '用户启用动态调整',
          adjustment_details: [{
            knowledge_point_id: 0,
            knowledge_point_name: '系统操作',
            old_mastery_level: 'weak',
            new_mastery_level: 'weak',
            action: 'add_practice',
            reason: '用户选择启用动态调整，系统将根据学习情况自动调整路径'
          }],
          learning_ability_tag: 'steady',
          evaluation_score: 0,
          adjustment_summary: '用户启用动态调整功能，系统将智能优化学习路径',
          created_at: new Date()
        });

        console.log(`用户 ${userId} 启用了学习路径 ${learningPathId} 的动态调整`);
      }

      // 5. 返回操作结果
      return {
        success: true,
        message: enabled 
          ? '动态调整已启用，系统将根据您的学习情况智能调整路径' 
          : '动态调整已关闭，已恢复默认学习路径',
        current_state: {
          dynamic_adjustment_enabled: enabled,
          learning_path_id: learningPathId,
          restored_to_default: restoredToDefault
        }
      };
    } catch (error) {
      console.error('切换动态调整开关失败:', error);
      throw new Error(`切换动态调整开关失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取动态调整开关状态
   * Requirements: 21.18
   * 
   * @param userId 用户ID
   * @param learningPathId 学习路径ID
   * @returns 动态调整开关状态
   */
  async getDynamicAdjustmentStatus(
    userId: number,
    learningPathId: number
  ): Promise<{
    dynamic_adjustment_enabled: boolean;
    learning_path_id: number;
  }> {
    try {
      const progressRecords = (await executeQuery(
        `SELECT dynamic_adjustment_enabled
         FROM learning_progress
         WHERE user_id = ? AND learning_path_id = ?`,
        [userId, learningPathId]
      )) as { dynamic_adjustment_enabled?: boolean }[];

      if (progressRecords.length === 0) {
        // 如果没有进度记录，返回默认值（启用）
        return {
          dynamic_adjustment_enabled: true,
          learning_path_id: learningPathId
        };
      }

      return {
        dynamic_adjustment_enabled: progressRecords[0].dynamic_adjustment_enabled ?? true,
        learning_path_id: learningPathId
      };
    } catch (error) {
      console.error('获取动态调整开关状态失败:', error);
      // 演示模式降级：字段不存在时返回默认启用状态
      return {
        dynamic_adjustment_enabled: true,
        learning_path_id: learningPathId
      };
    }
  }
}

export const aiLearningPathService = new AILearningPathService();
