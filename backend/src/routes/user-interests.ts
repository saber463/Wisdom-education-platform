/**
 * 用户兴趣调查路由模块
 * 实现用户兴趣问卷提交、查询和基于兴趣的推荐
 * Requirements: 20.9, 20.10, 20.14, 20.15
 */

import { Router, Request, Response } from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 用户兴趣接口定义
interface UserInterest {
  id: number;
  user_id: number;
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project';
  interested_languages: string[];
  interested_directions: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20';
  learning_style: string[];
  survey_completed: boolean;
  survey_completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// 问卷提交请求
interface SurveySubmitRequest {
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project';
  interested_languages: string[];
  interested_directions: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20';
  learning_style: string[];
}

// 课程推荐接口
interface CourseRecommendation {
  id: number;
  language_name: string;
  display_name: string;
  description: string;
  difficulty: string;
  match_score: number;
  match_reason: string;
}

// 学习路径推荐接口
interface PathRecommendation {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  match_score: number;
  match_reason: string;
}

/**
 * POST /api/user-interests
 * 提交用户兴趣问卷
 * Requirements: 20.9, 20.10
 * 
 * 请求体：
 * {
 *   "learning_goal": "employment" | "hobby" | "exam" | "project",
 *   "interested_languages": ["Python", "JavaScript", ...],
 *   "interested_directions": ["frontend", "backend", ...],
 *   "skill_level": "beginner" | "intermediate" | "advanced" | "expert",
 *   "weekly_hours": "less_5" | "hours_5_10" | "hours_10_20" | "more_20",
 *   "learning_style": ["video", "document", "project", "interactive"]
 * }
 * 
 * 响应：
 * {
 *   "success": true,
 *   "message": "问卷提交成功",
 *   "data": { ...用户兴趣数据 }
 * }
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const {
      learning_goal,
      interested_languages,
      interested_directions,
      skill_level,
      weekly_hours,
      learning_style
    } = req.body as SurveySubmitRequest;

    // 验证所有必填项
    if (!learning_goal || !interested_languages || !interested_directions || 
        !skill_level || !weekly_hours || !learning_style) {
      res.status(400).json({
        success: false,
        message: '所有字段都是必填项'
      });
      return;
    }

    // 验证数组不为空
    if (interested_languages.length === 0 || interested_directions.length === 0 || 
        learning_style.length === 0) {
      res.status(400).json({
        success: false,
        message: '编程语言、技术方向和学习方式至少选择一项'
      });
      return;
    }

    // 检查用户是否已提交过问卷
    const existingInterests = await executeQuery<UserInterest[]>(
      'SELECT * FROM user_interests WHERE user_id = ?',
      [userId]
    );

    const now = new Date();
    const languagesJson = JSON.stringify(interested_languages);
    const directionsJson = JSON.stringify(interested_directions);
    const styleJson = JSON.stringify(learning_style);

    if (existingInterests.length > 0) {
      // 更新现有记录
      await executeQuery(
        `UPDATE user_interests 
         SET learning_goal = ?, 
             interested_languages = ?, 
             interested_directions = ?, 
             skill_level = ?, 
             weekly_hours = ?, 
             learning_style = ?,
             survey_completed = TRUE,
             survey_completed_at = ?,
             updated_at = ?
         WHERE user_id = ?`,
        [learning_goal, languagesJson, directionsJson, skill_level, weekly_hours, 
         styleJson, now, now, userId]
      );
    } else {
      // 插入新记录
      await executeQuery(
        `INSERT INTO user_interests 
         (user_id, learning_goal, interested_languages, interested_directions, 
          skill_level, weekly_hours, learning_style, survey_completed, 
          survey_completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)`,
        [userId, learning_goal, languagesJson, directionsJson, skill_level, 
         weekly_hours, styleJson, now, now, now]
      );
    }

    // 获取更新后的数据
    const updatedInterests = await executeQuery<UserInterest[]>(
      'SELECT * FROM user_interests WHERE user_id = ?',
      [userId]
    );

    const interest = updatedInterests[0];

    res.status(200).json({
      success: true,
      message: '问卷提交成功',
      data: {
        id: interest.id,
        user_id: interest.user_id,
        learning_goal: interest.learning_goal,
        interested_languages: JSON.parse(interest.interested_languages as any),
        interested_directions: JSON.parse(interest.interested_directions as any),
        skill_level: interest.skill_level,
        weekly_hours: interest.weekly_hours,
        learning_style: JSON.parse(interest.learning_style as any),
        survey_completed: interest.survey_completed,
        survey_completed_at: interest.survey_completed_at,
        created_at: interest.created_at,
        updated_at: interest.updated_at
      }
    });

  } catch (error) {
    console.error('问卷提交失败:', error);
    res.status(500).json({
      success: false,
      message: '问卷提交失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * GET /api/user-interests/status
 * 检查用户问卷完成状态
 * Requirements: 20.10
 * 
 * 响应：
 * {
 *   "success": true,
 *   "completed": true/false,
 *   "data": { ...用户兴趣数据 } // 如果已完成
 * }
 */
router.get('/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const interests = await executeQuery<UserInterest[]>(
      'SELECT * FROM user_interests WHERE user_id = ?',
      [userId]
    );

    if (interests.length === 0) {
      res.json({
        success: true,
        completed: false,
        data: null
      });
      return;
    }

    const interest = interests[0];

    res.json({
      success: true,
      completed: interest.survey_completed,
      data: interest.survey_completed ? {
        id: interest.id,
        user_id: interest.user_id,
        learning_goal: interest.learning_goal,
        interested_languages: JSON.parse(interest.interested_languages as any),
        interested_directions: JSON.parse(interest.interested_directions as any),
        skill_level: interest.skill_level,
        weekly_hours: interest.weekly_hours,
        learning_style: JSON.parse(interest.learning_style as any),
        survey_completed: interest.survey_completed,
        survey_completed_at: interest.survey_completed_at,
        created_at: interest.created_at,
        updated_at: interest.updated_at
      } : null
    });

  } catch (error) {
    console.error('获取问卷状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取问卷状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * GET /api/user-interests
 * 获取当前用户兴趣信息
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": { ...用户兴趣数据 }
 * }
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const interests = await executeQuery<UserInterest[]>(
      'SELECT * FROM user_interests WHERE user_id = ?',
      [userId]
    );

    if (interests.length === 0) {
      res.status(404).json({
        success: false,
        message: '未找到用户兴趣信息'
      });
      return;
    }

    const interest = interests[0];

    res.json({
      success: true,
      data: {
        id: interest.id,
        user_id: interest.user_id,
        learning_goal: interest.learning_goal,
        interested_languages: JSON.parse(interest.interested_languages as any),
        interested_directions: JSON.parse(interest.interested_directions as any),
        skill_level: interest.skill_level,
        weekly_hours: interest.weekly_hours,
        learning_style: JSON.parse(interest.learning_style as any),
        survey_completed: interest.survey_completed,
        survey_completed_at: interest.survey_completed_at,
        created_at: interest.created_at,
        updated_at: interest.updated_at
      }
    });

  } catch (error) {
    console.error('获取用户兴趣失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户兴趣失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * PUT /api/user-interests
 * 更新用户兴趣信息
 * 
 * 请求体：同 POST /api/user-interests
 * 
 * 响应：
 * {
 *   "success": true,
 *   "message": "兴趣信息更新成功",
 *   "data": { ...用户兴趣数据 }
 * }
 */
router.put('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const {
      learning_goal,
      interested_languages,
      interested_directions,
      skill_level,
      weekly_hours,
      learning_style
    } = req.body as SurveySubmitRequest;

    // 验证所有必填项
    if (!learning_goal || !interested_languages || !interested_directions || 
        !skill_level || !weekly_hours || !learning_style) {
      res.status(400).json({
        success: false,
        message: '所有字段都是必填项'
      });
      return;
    }

    // 验证数组不为空
    if (interested_languages.length === 0 || interested_directions.length === 0 || 
        learning_style.length === 0) {
      res.status(400).json({
        success: false,
        message: '编程语言、技术方向和学习方式至少选择一项'
      });
      return;
    }

    const now = new Date();
    const languagesJson = JSON.stringify(interested_languages);
    const directionsJson = JSON.stringify(interested_directions);
    const styleJson = JSON.stringify(learning_style);

    await executeQuery(
      `UPDATE user_interests 
       SET learning_goal = ?, 
           interested_languages = ?, 
           interested_directions = ?, 
           skill_level = ?, 
           weekly_hours = ?, 
           learning_style = ?,
           updated_at = ?
       WHERE user_id = ?`,
      [learning_goal, languagesJson, directionsJson, skill_level, weekly_hours, 
       styleJson, now, userId]
    );

    // 获取更新后的数据
    const updatedInterests = await executeQuery<UserInterest[]>(
      'SELECT * FROM user_interests WHERE user_id = ?',
      [userId]
    );

    if (updatedInterests.length === 0) {
      res.status(404).json({
        success: false,
        message: '未找到用户兴趣信息'
      });
      return;
    }

    const interest = updatedInterests[0];

    res.json({
      success: true,
      message: '兴趣信息更新成功',
      data: {
        id: interest.id,
        user_id: interest.user_id,
        learning_goal: interest.learning_goal,
        interested_languages: JSON.parse(interest.interested_languages as any),
        interested_directions: JSON.parse(interest.interested_directions as any),
        skill_level: interest.skill_level,
        weekly_hours: interest.weekly_hours,
        learning_style: JSON.parse(interest.learning_style as any),
        survey_completed: interest.survey_completed,
        survey_completed_at: interest.survey_completed_at,
        created_at: interest.created_at,
        updated_at: interest.updated_at
      }
    });

  } catch (error) {
    console.error('更新用户兴趣失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户兴趣失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;

/**
 * GET /api/user-interests/recommendations
 * 基于用户兴趣获取个性化推荐
 * Requirements: 20.14, 20.15
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "courses": [...课程推荐],
 *     "learning_paths": [...学习路径推荐]
 *   }
 * }
 */
router.get('/recommendations', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // 获取用户兴趣
    const interests = await executeQuery<UserInterest[]>(
      'SELECT * FROM user_interests WHERE user_id = ?',
      [userId]
    );

    if (interests.length === 0 || !interests[0].survey_completed) {
      res.status(404).json({
        success: false,
        message: '请先完成兴趣调查问卷'
      });
      return;
    }

    const interest = interests[0];
    const interestedLanguages = JSON.parse(interest.interested_languages as any) as string[];
    const interestedDirections = JSON.parse(interest.interested_directions as any) as string[];
    const skillLevel = interest.skill_level;
    const learningGoal = interest.learning_goal;

    // 课程匹配算法（语言+方向）
    const courseRecommendations: CourseRecommendation[] = [];
    
    // 查询匹配的课程
    for (const language of interestedLanguages) {
      const courses = await executeQuery<any[]>(
        `SELECT c.*, 
                COUNT(DISTINCT cb.id) as branch_count,
                AVG(cr.rating) as avg_rating
         FROM courses c
         LEFT JOIN course_branches cb ON c.id = cb.course_id
         LEFT JOIN course_reviews cr ON c.id = cr.course_id
         WHERE c.language_name LIKE ? 
           AND c.difficulty = ?
           AND (c.is_hot = TRUE OR c.total_students > 100)
         GROUP BY c.id
         ORDER BY c.is_hot DESC, c.total_students DESC, avg_rating DESC
         LIMIT 5`,
        [`%${language}%`, skillLevel]
      );

      for (const course of courses) {
        // 计算匹配分数
        let matchScore = 50; // 基础分数
        
        // 语言匹配 +30分
        matchScore += 30;
        
        // 热门课程 +10分
        if (course.is_hot) {
          matchScore += 10;
        }
        
        // 评分高 +10分
        if (course.avg_rating && course.avg_rating >= 4.5) {
          matchScore += 10;
        }

        // 生成匹配原因
        const reasons: string[] = [];
        reasons.push(`匹配您感兴趣的${language}语言`);
        reasons.push(`适合${skillLevel === 'beginner' ? '初学者' : skillLevel === 'intermediate' ? '中级' : skillLevel === 'advanced' ? '高级' : '专家'}水平`);
        
        if (course.is_hot) {
          reasons.push('热门课程');
        }
        
        if (course.avg_rating && course.avg_rating >= 4.5) {
          reasons.push(`高评分(${course.avg_rating.toFixed(1)}星)`);
        }

        courseRecommendations.push({
          id: course.id,
          language_name: course.language_name,
          display_name: course.display_name,
          description: course.description,
          difficulty: course.difficulty,
          match_score: matchScore,
          match_reason: reasons.join('，')
        });
      }
    }

    // 按匹配分数排序并去重
    const uniqueCourses = Array.from(
      new Map(courseRecommendations.map(c => [c.id, c])).values()
    ).sort((a, b) => b.match_score - a.match_score).slice(0, 10);

    // 学习路径匹配算法（技能水平+目标）
    const pathRecommendations: PathRecommendation[] = [];
    
    // 查询匹配的学习路径
    const paths = await executeQuery<any[]>(
      `SELECT lp.*,
              COUNT(DISTINCT lps.id) as step_count,
              COUNT(DISTINCT lprog.id) as enrollment_count
       FROM learning_paths lp
       LEFT JOIN learning_path_steps lps ON lp.id = lps.learning_path_id
       LEFT JOIN learning_progress lprog ON lp.id = lprog.learning_path_id
       WHERE lp.status = 'published'
         AND lp.is_public = TRUE
         AND lp.difficulty = ?
       GROUP BY lp.id
       ORDER BY enrollment_count DESC, lp.view_count DESC
       LIMIT 10`,
      [skillLevel]
    );

    for (const path of paths) {
      // 计算匹配分数
      let matchScore = 50; // 基础分数
      
      // 难度匹配 +30分
      matchScore += 30;
      
      // 热门路径 +10分
      if (path.enrollment_count > 50) {
        matchScore += 10;
      }
      
      // 浏览量高 +10分
      if (path.view_count > 100) {
        matchScore += 10;
      }

      // 生成匹配原因
      const reasons: string[] = [];
      reasons.push(`适合${skillLevel === 'beginner' ? '初学者' : skillLevel === 'intermediate' ? '中级' : skillLevel === 'advanced' ? '高级' : '专家'}水平`);
      
      if (learningGoal === 'employment') {
        reasons.push('适合就业导向学习');
      } else if (learningGoal === 'hobby') {
        reasons.push('适合兴趣爱好学习');
      } else if (learningGoal === 'exam') {
        reasons.push('适合考试备考');
      } else if (learningGoal === 'project') {
        reasons.push('适合项目实战');
      }
      
      if (path.enrollment_count > 50) {
        reasons.push(`${path.enrollment_count}人已选择`);
      }

      pathRecommendations.push({
        id: path.id,
        title: path.title,
        description: path.description,
        difficulty: path.difficulty,
        estimated_hours: path.estimated_hours,
        match_score: matchScore,
        match_reason: reasons.join('，')
      });
    }

    // 按匹配分数排序
    const sortedPaths = pathRecommendations.sort((a, b) => b.match_score - a.match_score);

    res.json({
      success: true,
      data: {
        courses: uniqueCourses,
        learning_paths: sortedPaths
      }
    });

  } catch (error) {
    console.error('获取推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});
