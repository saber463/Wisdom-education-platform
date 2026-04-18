/**
 * 路线图控制器
 * 处理开发者路线图和学习路径生成
 */

import xunfeiService from '../services/xunfeiService.js';

class RoadmapController {
  /**
   * 获取所有可用路线图列表
   */
  async getRoadmapList(req, res) {
    try {
      const roadmaps = [
        { id: 'frontend', name: '前端工程师', icon: 'fa-html5', color: '#E44D26' },
        { id: 'backend', name: '后端工程师', icon: 'fa-code', color: '#68A063' },
        { id: 'devops', name: 'DevOps工程师', icon: 'fa-server', color: '#0F4C81' },
        { id: 'python', name: 'Python工程师', icon: 'fa-python', color: '#3776AB' },
        { id: 'java', name: 'Java工程师', icon: 'fa-coffee', color: '#007396' },
        { id: 'react', name: 'React专家', icon: 'fa-react', color: '#61DAFB' },
        { id: 'vue', name: 'Vue专家', icon: 'fa-vuejs', color: '#4FC08D' },
        { id: 'android', name: 'Android工程师', icon: 'fa-android', color: '#3DDC84' },
      ];

      res.json({
        success: true,
        data: roadmaps,
      });
    } catch (error) {
      console.error('获取路线图列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取路线图列表失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取指定路线图的详细信息
   */
  async getRoadmapDetail(req, res) {
    try {
      const { id } = req.params;
      const roadmap = await xunfeiService.getRoadmapData(id);

      res.json({
        success: true,
        data: roadmap,
      });
    } catch (error) {
      console.error('获取路线图详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取路线图详情失败',
        error: error.message,
      });
    }
  }

  /**
   * AI生成个性化学习路径（使用讯飞API）
   */
  async generateAILearningPath(req, res) {
    try {
      const { goal, days, intensity, includeRoadmap } = req.body;

      if (!goal) {
        return res.status(400).json({
          success: false,
          message: '请提供学习目标',
        });
      }

      console.log(`🤖 AI生成学习路径: goal=${goal}, days=${days}, intensity=${intensity}`);

      // 调用讯飞AI生成
      const learningPath = await xunfeiService.generateLearningPath(
        goal,
        days || 7,
        intensity || 'medium'
      );

      // 如果需要包含路线图数据
      if (includeRoadmap) {
        const roadmap = await xunfeiService.getRoadmapData(goal);
        learningPath.relatedRoadmap = roadmap;
      }

      res.json({
        success: true,
        data: learningPath,
      });
    } catch (error) {
      console.error('AI生成学习路径失败:', error);
      res.status(500).json({
        success: false,
        message: 'AI生成失败，请稍后重试',
        error: error.message,
      });
    }
  }

  /**
   * 获取路线图对比数据
   */
  async compareRoadmaps(req, res) {
    try {
      const { ids } = req.query;
      const roadmapIds = ids ? ids.split(',') : ['frontend', 'backend'];

      const comparisons = await Promise.all(roadmapIds.map(id => xunfeiService.getRoadmapData(id)));

      res.json({
        success: true,
        data: comparisons,
      });
    } catch (error) {
      console.error('路线图对比失败:', error);
      res.status(500).json({
        success: false,
        message: '路线图对比失败',
        error: error.message,
      });
    }
  }
}

export default new RoadmapController();
