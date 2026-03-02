/**
 * 思维导图同步服务
 * 实现路径调整后思维导图自动更新
 * Requirements: 21.9, 21.19
 * Task: 18.3
 */

import { connectMongoDB } from '../config/mongodb.js';
import { MindMapData } from '../models/mongodb/mindmap-data.model.js';
import { executeQuery } from '../config/database.js';

export class MindMapSyncService {
  /**
   * 同步路径调整到思维导图
   * Requirements: 21.9, 21.19
   */
  async syncPathAdjustmentToMindMap(
    userId: number,
    learningPathId: number,
    adjustmentDetails: Array<{
      knowledge_point_id: number;
      knowledge_point_name: string;
      old_mastery_level: string;
      new_mastery_level: string;
      action: string;
    }>
  ): Promise<void> {
    const startTime = Date.now();
    try {
      await connectMongoDB();

      // 获取或创建思维导图数据
      let mindMapData = await MindMapData.findOne({
        user_id: userId,
        learning_path_id: learningPathId
      });

      if (!mindMapData) {
        // 如果不存在，创建初始思维导图
        mindMapData = await this.createInitialMindMap(userId, learningPathId);
      }

      // 更新节点状态
      for (const detail of adjustmentDetails) {
        // 查找包含该知识点的节点
        let targetNode = null;
        for (const node of mindMapData.nodes) {
          if (node.step_id && await this.isKnowledgePointInStep(node.step_id, detail.knowledge_point_id)) {
            targetNode = node;
            break;
          }
        }

        const node = targetNode;

        if (node) {
          // 根据掌握度更新节点状态和样式
          switch (detail.action) {
            case 'skip':
              // 已掌握：标记为completed，灰色
              node.status = 'completed';
              node.style.color = '#909399'; // 灰色
              break;
            case 'add_practice':
            case 'add_micro_lesson':
              // 薄弱：标记为current，红色
              if (detail.new_mastery_level === 'weak') {
                node.status = 'current';
                node.style.color = '#f56c6c'; // 红色
              } else if (detail.new_mastery_level === 'consolidating') {
                node.status = 'current';
                node.style.color = '#e6a23c'; // 橙色
              }
              break;
            case 'decrease_difficulty':
              // 降低难度：标记为current
              node.status = 'current';
              node.style.color = '#409eff'; // 蓝色
              break;
          }
        }
      }

      await mindMapData.save();

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 1000) {
        console.warn(`思维导图同步延迟${elapsedTime}ms超过1秒`);
      }

      console.log(`[思维导图] 路径调整已同步到思维导图: 用户${userId}, 路径${learningPathId}`);
    } catch (error) {
      console.error('同步思维导图失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 创建初始思维导图
   */
  private async createInitialMindMap(
    userId: number,
    learningPathId: number
  ): Promise<any> {
    // 获取学习路径步骤
    const steps = await executeQuery<any[]>(
      `SELECT * FROM learning_path_steps 
       WHERE learning_path_id = ? 
       ORDER BY step_number ASC`,
      [learningPathId]
    );

    const nodes = steps.map((step, index) => ({
      id: `step_${step.id}`,
      label: step.step_name || `步骤${step.step_number}`,
      type: index === 0 ? 'root' : 'branch',
      step_id: step.id,
      status: index === 0 ? 'current' : 'locked',
      position: {
        x: index * 200,
        y: 0
      },
      style: {
        color: index === 0 ? '#409eff' : '#909399'
      }
    }));

    const edges = steps.slice(1).map((step, index) => ({
      source: `step_${steps[index].id}`,
      target: `step_${step.id}`,
      type: 'required'
    }));

    const mindMapData = new MindMapData({
      user_id: userId,
      learning_path_id: learningPathId,
      nodes,
      edges,
      layout: 'tree'
    });

    return mindMapData;
  }

  /**
   * 检查知识点是否在步骤中
   */
  private async isKnowledgePointInStep(
    stepId: number,
    knowledgePointId: number
  ): Promise<boolean> {
    try {
      const associations = await executeQuery<any[]>(
        `SELECT id FROM learning_path_step_knowledge_points 
         WHERE step_id = ? AND knowledge_point_id = ?`,
        [stepId, knowledgePointId]
      );
      return associations.length > 0;
    } catch (error) {
      console.error('检查知识点关联失败:', error);
      return false;
    }
  }

  /**
   * 更新节点状态标记
   * Requirements: 21.19
   */
  async updateNodeStatus(
    userId: number,
    learningPathId: number,
    knowledgePointId: number,
    masteryLevel: 'mastered' | 'consolidating' | 'weak'
  ): Promise<void> {
    try {
      await connectMongoDB();

      const mindMapData = await MindMapData.findOne({
        user_id: userId,
        learning_path_id: learningPathId
      });

      if (!mindMapData) return;

      // 查找相关节点并更新状态
      for (const node of mindMapData.nodes) {
        if (!node.step_id) continue;
        
        const isRelated = await this.isKnowledgePointInStep(node.step_id, knowledgePointId);
        if (isRelated) {
          switch (masteryLevel) {
            case 'mastered':
              node.status = 'completed';
              node.style.color = '#67c23a'; // 绿色 - 已掌握
              break;
            case 'consolidating':
              node.status = 'current';
              node.style.color = '#e6a23c'; // 橙色 - 待巩固
              break;
            case 'weak':
              node.status = 'current';
              node.style.color = '#f56c6c'; // 红色 - 薄弱
              break;
          }
        }
      }

      await mindMapData.save();
    } catch (error) {
      console.error('更新节点状态失败:', error);
    }
  }
}

export const mindMapSyncService = new MindMapSyncService();

