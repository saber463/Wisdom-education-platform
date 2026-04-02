/**
 * 协作学习模块 - 学习小组路由
 * 实现小组创建、管理、打卡、互评功能
 * 需求：18.1, 18.2, 18.3, 18.5, 18.6, 18.8
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import crypto from 'crypto';

const router = Router();

// 所有小组路由都需要认证
router.use(authenticateToken);

/**
 * 生成6位邀请码
 */
function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ===== 固定路径路由必须在 /:id 之前注册 =====

// GET /my-teams - 获取当前用户的小组列表（必须在 /:id 之前）
router.get('/my-teams', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const teams = await executeQuery<any[]>(
      `SELECT DISTINCT t.id as team_id, t.name, t.description, t.creator_id, t.max_members, t.status, t.created_at,
              u.real_name as creator_name,
              COUNT(DISTINCT tm.user_id) as current_members
       FROM teams t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id IN (SELECT team_id FROM team_members WHERE user_id = ?)
       GROUP BY t.id, t.name, t.description, t.creator_id, t.max_members, t.status, t.created_at, u.real_name
       ORDER BY t.created_at DESC`,
      [userId]
    );
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await executeQuery<any[]>(
          `SELECT tm.user_id as student_id, u.real_name, u.avatar_url, tm.joined_at
           FROM team_members tm JOIN users u ON tm.user_id = u.id
           WHERE tm.team_id = ? ORDER BY tm.joined_at ASC`,
          [team.team_id]
        );
        return {
          team_id: team.team_id, name: team.name, goal: team.description,
          creator_id: team.creator_id, creator_name: team.creator_name,
          max_members: team.max_members, current_members: team.current_members,
          invite_code: null, created_at: team.created_at,
          members: members.map(m => ({ student_id: m.student_id, real_name: m.real_name, avatar_url: m.avatar_url, joined_at: m.joined_at, is_creator: m.student_id === team.creator_id })),
          is_creator: userId === team.creator_id, is_member: true
        };
      })
    );
    res.json({ success: true, data: teamsWithMembers });
  } catch (error) {
    console.error('获取用户小组列表失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// POST /join-by-code - 通过邀请码加入（必须在 /:id 之前）
// Note: invite_code feature removed, this route returns a stub
router.post('/join-by-code', async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(400).json({ success: false, message: '邀请码功能暂不可用' });
});

/**
 * POST /api/teams
 * 创建学习小组
 * 
 * 功能：
 * 1. 创建小组（设置名称、学习目标、成员上限）
 * 2. 生成邀请码
 * 3. 自动将创建者加入小组
 * 
 * 请求体：
 * {
 *   "name": "数学学习小组",
 *   "goal": "提升数学成绩",
 *   "max_members": 10
 * }
 * 
 * 需求：18.1
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, learning_goal, max_members = 10 } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以创建小组
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以创建学习小组'
      });
      return;
    }

    // 验证必填字段
    if (!name || !learning_goal) {
      res.status(400).json({
        success: false,
        message: '请提供小组名称和学习目标'
      });
      return;
    }

    // 验证成员上限
    const memberLimitNum = parseInt(member_limit);
    if (isNaN(memberLimitNum) || memberLimitNum < 2 || memberLimitNum > 10) {
      res.status(400).json({
        success: false,
        message: '成员上限必须在2-10人之间'
      });
      return;
    }

    // 生成唯一邀请码
    let inviteCode = generateInviteCode();
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      const existing = await executeQuery<any[]>(
        'SELECT id FROM teams WHERE 1=0 -- invite_code removed',
        [inviteCode]
      );
      if (existing.length === 0) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (codeExists) {
      res.status(500).json({
        success: false,
        message: '生成邀请码失败，请重试'
      });
      return;
    }

    // 创建小组
    const result = await executeQuery<any>(
      `INSERT INTO teams (name, learning_goal, creator_id, member_limit, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, learning_goal, userId, memberLimitNum]
    );

    const teamId = result.insertId;

    // 自动将创建者加入小组
    await executeQuery(
      `INSERT INTO team_members (team_id, user_id)
       VALUES (?, ?, NOW())`,
      [teamId, userId]
    );

    // 获取创建者信息
    const userInfo = await executeQuery<any[]>(
      'SELECT real_name FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: '学习小组创建成功',
      data: {
        team_id: teamId,
        name,
        goal: learning_goal,
        creator_id: userId,
        creator_name: userInfo[0]?.real_name || '',
        max_members: memberLimitNum,
        current_members: 1,
                created_at: new Date()
      }
    });

  } catch (error) {
    console.error('创建学习小组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/teams/:id
 * 查询小组详情
 * 
 * 功能：
 * 1. 返回小组基本信息
 * 2. 返回成员列表
 * 3. 返回小组统计数据
 * 
 * 需求：18.1
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // 查询小组信息
    const teamInfo = await executeQuery<any[]>(
      `SELECT t.id, t.name, t.description, t.creator_id, t.max_members, t.created_at,
              u.real_name as creator_name
       FROM teams t
       JOIN users u ON t.creator_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 查询成员列表
    const members = await executeQuery<any[]>(
      `SELECT tm.user_id, u.real_name, u.avatar_url, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.joined_at ASC`,
      [id]
    );

    // 查询打卡统计
    const checkInStats = await executeQuery<any[]>(
      `SELECT COUNT(*) as total_check_ins,
              COUNT(DISTINCT user_id) as active_members
       FROM check_ins
       WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAYS)`,
      [id]
    );

    // 检查当前用户是否是成员
    const isMember = members.some(m => m.user_id === userId);

    res.json({
      success: true,
      data: {
        team_id: team.id,
        name: team.name,
        goal: team.description,
        creator_id: team.creator_id,
        creator_name: team.creator_name,
        max_members: team.max_members,
        current_members: members.length,
        invite_code: isMember ? null : null, // 只有成员可以看到邀请码
        created_at: team.created_at,
        members: members.map(m => ({
          student_id: m.user_id,
          real_name: m.real_name,
          avatar_url: m.avatar_url,
          joined_at: m.joined_at,
          is_creator: m.user_id === team.creator_id
        })),
        statistics: {
          total_check_ins_last_7_days: checkInStats[0]?.total_check_ins || 0,
          active_members_last_7_days: checkInStats[0]?.active_members || 0
        },
        is_member: isMember,
        is_creator: userId === team.creator_id
      }
    });

  } catch (error) {
    console.error('查询小组详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * PUT /api/teams/:id
 * 更新小组信息
 * 
 * 功能：
 * 1. 更新小组名称、学习目标
 * 2. 只有创建者可以更新
 * 
 * 请求体：
 * {
 *   "name": "新的小组名称",
 *   "goal": "新的学习目标"
 * }
 * 
 * 需求：18.1
 */
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, goal } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以更新小组
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以更新学习小组'
      });
      return;
    }

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT creator_id FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    // 只有创建者可以更新小组信息
    if (teamInfo[0].creator_id !== userId) {
      res.status(403).json({
        success: false,
        message: '只有小组创建者可以更新小组信息'
      });
      return;
    }

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined && name.trim() !== '') {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (goal !== undefined && goal.trim() !== '') {
      updates.push('description = ?');
      params.push(goal.trim());
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供要更新的字段'
      });
      return;
    }

    params.push(id);

    await executeQuery(
      `UPDATE teams SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    // 获取更新后的小组信息
    const updatedTeam = await executeQuery<any[]>(
      `SELECT id, name, learning_goal, creator_id, member_limit, invite_code, created_at, updated_at
       FROM teams WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '小组信息更新成功',
      data: updatedTeam[0]
    });

  } catch (error) {
    console.error('更新小组信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * DELETE /api/teams/:id
 * 解散小组
 * 
 * 功能：
 * 1. 删除小组
 * 2. 保留所有学习记录和互评数据
 * 3. 只有创建者可以解散
 * 
 * 需求：18.8
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以解散小组
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以解散学习小组'
      });
      return;
    }

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT creator_id, name FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    // 只有创建者可以解散小组
    if (teamInfo[0].creator_id !== userId) {
      res.status(403).json({
        success: false,
        message: '只有小组创建者可以解散小组'
      });
      return;
    }

    // 获取成员数量
    const memberCount = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [id]
    );

    // 删除小组（级联删除会自动删除team_members）
    // 但check_ins和peer_reviews会保留（需求18.8）
    await executeQuery(
      'DELETE FROM teams WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '小组已解散，所有学习记录和互评数据已保留',
      data: {
        team_id: parseInt(id),
        team_name: teamInfo[0].name,
        member_count: memberCount[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('解散小组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/teams/my-teams
 * 获取当前用户的小组列表
 * 
 * 功能：
 * 1. 返回用户创建的小组
 * 2. 返回用户加入的小组
 * 3. 返回小组成员列表
 * 
 * 需求：18.1
 */
router.get('/my-teams', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 查询用户所在的所有小组
    const teams = await executeQuery<any[]>(
      `SELECT DISTINCT t.id as team_id, t.name, t.description as learning_goal, t.creator_id, t.max_members as member_limit, t.status, t.created_at,
              u.real_name as creator_name,
              COUNT(DISTINCT tm.user_id) as current_members,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND user_id = ?) as is_member
       FROM teams t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id IN (
         SELECT team_id FROM team_members WHERE user_id = ?
       )
       GROUP BY t.id, t.name, t.description, t.creator_id, t.max_members, t.status, t.created_at, u.real_name
       ORDER BY t.created_at DESC`,
      [userId, userId]
    );

    // 为每个小组获取成员列表
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await executeQuery<any[]>(
          `SELECT tm.user_id as student_id, u.real_name, u.avatar_url, tm.joined_at
           FROM team_members tm
           JOIN users u ON tm.user_id = u.id
           WHERE tm.team_id = ?
           ORDER BY tm.joined_at ASC`,
          [team.team_id]
        );

        return {
          team_id: team.team_id,
          name: team.name,
          goal: team.description,
          creator_id: team.creator_id,
          creator_name: team.creator_name,
          max_members: team.max_members,
          current_members: team.current_members,
          invite_code: null,
          created_at: team.created_at,
          members: members.map(m => ({
            student_id: m.student_id,
            real_name: m.real_name,
            avatar_url: m.avatar_url,
            joined_at: m.joined_at,
            is_creator: m.student_id === team.creator_id
          })),
          is_creator: userId === team.creator_id,
          is_member: true
        };
      })
    );

    res.json({
      success: true,
      data: teamsWithMembers
    });

  } catch (error) {
    console.error('获取用户小组列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/teams/join-by-code
 * 通过邀请码加入小组
 * 
 * 功能：
 * 1. 验证邀请码
 * 2. 查找对应小组
 * 3. 加入小组
 * 
 * 请求体：
 * {
 *   "invite_code": "ABC123"
 * }
 * 
 * 需求：18.2
 */
router.post('/join-by-code', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invite_code } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以加入小组
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以加入学习小组'
      });
      return;
    }

    // 验证邀请码
    if (!invite_code) {
      res.status(400).json({
        success: false,
        message: '请提供邀请码'
      });
      return;
    }

    // 查询小组信息
    const teamInfo = await executeQuery<any[]>(
      `SELECT id, name, learning_goal, creator_id, member_limit, invite_code
       FROM teams WHERE 1=0 -- invite_code removed`,
      [invite_code.toUpperCase()]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '邀请码无效'
      });
      return;
    }

    const team = teamInfo[0];

    // 检查是否已经是成员
    const existingMember = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [team.id, userId]
    );

    if (existingMember && existingMember.length > 0) {
      res.status(400).json({
        success: false,
        message: '您已经是该小组成员'
      });
      return;
    }

    // 检查小组是否已满
    const memberCount = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [team.id]
    );

    if (memberCount[0].count >= team.max_members) {
      res.status(400).json({
        success: false,
        message: '小组人数已满'
      });
      return;
    }

    // 加入小组
    await executeQuery(
      `INSERT INTO team_members (team_id, user_id)
       VALUES (?, ?, NOW())`,
      [team.id, userId]
    );

    // 获取用户信息
    const userInfo = await executeQuery<any[]>(
      'SELECT real_name FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: '成功加入学习小组',
      data: {
        team_id: team.id,
        team_name: team.name,
        student_id: userId,
        student_name: userInfo[0]?.real_name || '',
        joined_at: new Date(),
        current_members: memberCount[0].count + 1,
        max_members: team.max_members
      }
    });

  } catch (error) {
    console.error('通过邀请码加入小组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});
/**
 * POST /api/teams/:id/join
 * 加入学习小组
 * 
 * 功能：
 * 1. 验证邀请码
 * 2. 检查小组是否已满
 * 3. 加入小组
 * 
 * 请求体：
 * {
 *   "invite_code": "ABC123"
 * }
 * 
 * 需求：18.2
 */
router.post('/:id/join', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { invite_code } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以加入小组
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以加入学习小组'
      });
      return;
    }

    // 验证邀请码
    if (!invite_code) {
      res.status(400).json({
        success: false,
        message: '请提供邀请码'
      });
      return;
    }

    // 查询小组信息
    const teamInfo = await executeQuery<any[]>(
      `SELECT id, name, learning_goal, creator_id, member_limit, invite_code
       FROM teams WHERE id = ?`,
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 验证邀请码是否正确
    if (null !== invite_code.toUpperCase()) {
      res.status(400).json({
        success: false,
        message: '邀请码错误'
      });
      return;
    }

    // 检查是否已经是成员
    const existingMember = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingMember && existingMember.length > 0) {
      res.status(400).json({
        success: false,
        message: '您已经是该小组成员'
      });
      return;
    }

    // 检查小组是否已满
    const memberCount = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [id]
    );

    if (memberCount[0].count >= team.max_members) {
      res.status(400).json({
        success: false,
        message: '小组人数已满'
      });
      return;
    }

    // 加入小组
    await executeQuery(
      `INSERT INTO team_members (team_id, user_id)
       VALUES (?, ?, NOW())`,
      [id, userId]
    );

    // 获取用户信息
    const userInfo = await executeQuery<any[]>(
      'SELECT real_name FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: '成功加入学习小组',
      data: {
        team_id: parseInt(id),
        team_name: team.name,
        student_id: userId,
        student_name: userInfo[0]?.real_name || '',
        joined_at: new Date(),
        current_members: memberCount[0].count + 1,
        max_members: team.max_members
      }
    });

  } catch (error) {
    console.error('加入小组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * DELETE /api/teams/:id/leave
 * 退出学习小组
 * 
 * 功能：
 * 1. 退出小组
 * 2. 创建者不能退出（需要先转让或解散）
 * 3. 保留所有学习记录
 * 
 * 需求：18.2
 */
router.delete('/:id/leave', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以退出小组
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以退出学习小组'
      });
      return;
    }

    // 查询小组信息
    const teamInfo = await executeQuery<any[]>(
      'SELECT id, name, creator_id FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 创建者不能退出小组
    if (team.creator_id === userId) {
      res.status(400).json({
        success: false,
        message: '小组创建者不能退出，请先解散小组或转让创建者权限'
      });
      return;
    }

    // 检查是否是成员
    const memberInfo = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!memberInfo || memberInfo.length === 0) {
      res.status(400).json({
        success: false,
        message: '您不是该小组成员'
      });
      return;
    }

    // 退出小组
    await executeQuery(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, userId]
    );

    // 获取剩余成员数量
    const remainingMembers = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '已退出学习小组',
      data: {
        team_id: parseInt(id),
        team_name: team.name,
        student_id: userId,
        remaining_members: remainingMembers[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('退出小组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/teams/:id/members
 * 查询小组成员列表
 * 
 * 功能：
 * 1. 返回所有成员信息
 * 2. 包含成员的学习统计
 * 
 * 需求：18.2
 */
router.get('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT id, name, creator_id FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 查询成员列表及其统计数据
    const members = await executeQuery<any[]>(
      `SELECT 
        tm.user_id,
        u.real_name,
        u.avatar_url,
        tm.joined_at,
        COUNT(DISTINCT ci.id) as check_in_count,
        COUNT(DISTINCT pr.id) as peer_review_count
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN check_ins ci ON ci.team_id = tm.team_id AND ci.user_id = tm.user_id
       LEFT JOIN peer_reviews pr ON pr.team_id = tm.team_id AND pr.reviewer_id = tm.user_id
       WHERE tm.team_id = ?
       GROUP BY tm.user_id, u.real_name, u.avatar_url, tm.joined_at
       ORDER BY tm.joined_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        team_id: parseInt(id),
        team_name: team.name,
        total_members: members.length,
        members: members.map(m => ({
          student_id: m.user_id,
          real_name: m.real_name,
          avatar_url: m.avatar_url,
          joined_at: m.joined_at,
          is_creator: m.user_id === team.creator_id,
          statistics: {
            check_in_count: m.check_in_count || 0,
            peer_review_count: m.peer_review_count || 0
          }
        }))
      }
    });

  } catch (error) {
    console.error('查询小组成员失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/teams/:id/check-in
 * 每日打卡
 * 
 * 功能：
 * 1. 记录打卡时间和学习时长
 * 2. 推送通知到小组成员
 * 3. 每天只能打卡一次
 * 
 * 请求体：
 * {
 *   "study_duration": 120,  // 学习时长（分钟）
 *   "completed_tasks": 3     // 完成任务数
 * }
 * 
 * 需求：18.3
 */
router.post('/:id/check-in', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { study_duration = 0, completed_tasks = 0 } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以打卡
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以打卡'
      });
      return;
    }

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT id, name FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 检查是否是成员
    const memberInfo = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!memberInfo || memberInfo.length === 0) {
      res.status(403).json({
        success: false,
        message: '您不是该小组成员'
      });
      return;
    }

    // 检查今天是否已经打卡
    const todayCheckIn = await executeQuery<any[]>(
      `SELECT id FROM check_ins 
       WHERE team_id = ? AND user_id = ? AND check_in_date = CURDATE()`,
      [id, userId]
    );

    if (todayCheckIn && todayCheckIn.length > 0) {
      res.status(400).json({
        success: false,
        message: '今天已经打卡过了'
      });
      return;
    }

    // 记录打卡
    const result = await executeQuery<any>(
      `INSERT INTO check_ins (team_id, user_id, check_in_date, study_duration, completed_tasks)
       VALUES (?, ?, CURDATE(), ?, ?)`,
      [id, userId, study_duration, completed_tasks]
    );

    // 获取用户信息
    const userInfo = await executeQuery<any[]>(
      'SELECT real_name FROM users WHERE id = ?',
      [userId]
    );

    const userName = userInfo[0]?.real_name || '某位同学';

    // 推送通知到小组其他成员
    const otherMembers = await executeQuery<any[]>(
      `SELECT user_id FROM team_members 
       WHERE team_id = ? AND user_id != ?`,
      [id, userId]
    );

    if (otherMembers && otherMembers.length > 0) {
      const notificationPromises = otherMembers.map(member =>
        executeQuery(
          `INSERT INTO notifications (user_id, type, title, content, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [
            member.user_id,
            'system',
            '小组成员打卡提醒',
            `${userName}在小组"${team.name}"完成了今日打卡，学习时长${study_duration}分钟，完成任务${completed_tasks}个`
          ]
        )
      );

      try {
        await Promise.all(notificationPromises);
      } catch (notifError) {
        console.warn('推送通知失败:', notifError);
        // 通知失败不影响打卡成功
      }
    }

    // 获取打卡统计
    const checkInStats = await executeQuery<any[]>(
      `SELECT 
        COUNT(*) as total_check_ins,
        SUM(study_duration) as total_study_duration,
        SUM(completed_tasks) as total_completed_tasks
       FROM check_ins
       WHERE team_id = ? AND user_id = ?`,
      [id, userId]
    );

    res.status(201).json({
      success: true,
      message: '打卡成功',
      data: {
        check_in_id: result.insertId,
        team_id: parseInt(id),
        team_name: team.name,
        student_id: userId,
        student_name: userName,
        check_in_time: new Date(),
        study_duration,
        completed_tasks,
        statistics: {
          total_check_ins: checkInStats[0]?.total_check_ins || 0,
          total_study_duration: checkInStats[0]?.total_study_duration || 0,
          total_completed_tasks: checkInStats[0]?.total_completed_tasks || 0
        },
        notifications_sent: otherMembers?.length || 0
      }
    });

  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/teams/:id/check-ins
 * 查询打卡记录
 * 
 * 功能：
 * 1. 返回小组所有成员的打卡记录
 * 2. 支持时间范围筛选
 * 3. 返回打卡统计
 * 
 * 查询参数：
 * - days: 查询最近N天的记录（默认7天）
 * - student_id: 筛选特定学生的记录（可选）
 * 
 * 需求：18.3
 */
router.get('/:id/check-ins', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { days = '7', student_id } = req.query;

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT id, name FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];
    const daysNum = parseInt(days as string) || 7;

    // 构建查询条件
    let whereClause = 'WHERE ci.team_id = ? AND ci.check_in_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    const params: any[] = [id, daysNum];

    if (student_id) {
      whereClause += ' AND ci.user_id = ?';
      params.push(student_id);
    }

    // 查询打卡记录
    const checkIns = await executeQuery<any[]>(
      `SELECT 
        ci.id,
        ci.user_id,
        u.real_name,
        ci.check_in_date,
        ci.study_duration,
        ci.completed_tasks
       FROM check_ins ci
       JOIN users u ON ci.user_id = u.id
       ${whereClause}
       ORDER BY ci.check_in_date DESC`,
      params
    );

    // 查询统计数据
    const statsParams: any[] = [id, daysNum];
    let statsWhereClause = 'WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    
    if (student_id) {
      statsWhereClause += ' AND user_id = ?';
      statsParams.push(student_id);
    }

    const statistics = await executeQuery<any[]>(
      `SELECT 
        COUNT(*) as total_check_ins,
        COUNT(DISTINCT user_id) as active_members,
        SUM(study_duration) as total_study_duration,
        SUM(completed_tasks) as total_completed_tasks,
        AVG(study_duration) as avg_study_duration
       FROM check_ins
       ${statsWhereClause}`,
      statsParams
    );

    // 计算打卡率
    const totalMembers = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [id]
    );

    const checkInRate = totalMembers[0].count > 0
      ? ((statistics[0]?.active_members || 0) / totalMembers[0].count) * 100
      : 0;

    res.json({
      success: true,
      data: {
        team_id: parseInt(id),
        team_name: team.name,
        query_days: daysNum,
        check_ins: checkIns.map(ci => ({
          id: ci.id,
          student_id: ci.user_id,
          student_name: ci.real_name,
          check_in_time: ci.check_in_date,
          study_duration: ci.study_duration,
          completed_tasks: ci.completed_tasks
        })),
        statistics: {
          total_check_ins: statistics[0]?.total_check_ins || 0,
          active_members: statistics[0]?.active_members || 0,
          total_members: totalMembers[0]?.count || 0,
          check_in_rate: Math.round(checkInRate * 100) / 100,
          total_study_duration: statistics[0]?.total_study_duration || 0,
          total_completed_tasks: statistics[0]?.total_completed_tasks || 0,
          avg_study_duration: Math.round((statistics[0]?.avg_study_duration || 0) * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('查询打卡记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/teams/:id/peer-review
 * 提交互评
 * 
 * 功能：
 * 1. 小组成员间互评作业
 * 2. 互评结果不影响最终成绩
 * 3. 记录评分和评语
 * 
 * 请求体：
 * {
 *   "reviewee_id": 123,        // 被评价人ID
 *   "assignment_id": 456,      // 作业ID
 *   "score": 85,               // 评分（0-100）
 *   "comment": "完成得很好"    // 评语
 * }
 * 
 * 需求：18.5
 */
router.post('/:id/peer-review', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewee_id, assignment_id, score, comment } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 只有学生可以互评
    if (userRole !== 'student') {
      res.status(403).json({
        success: false,
        message: '只有学生可以进行互评'
      });
      return;
    }

    // 验证必填字段
    if (!reviewee_id || !assignment_id || score === undefined) {
      res.status(400).json({
        success: false,
        message: '请提供被评价人、作业ID和评分'
      });
      return;
    }

    // 验证评分范围
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      res.status(400).json({
        success: false,
        message: '评分必须在0-100之间'
      });
      return;
    }

    // 不能自评
    if (parseInt(reviewee_id) === userId) {
      res.status(400).json({
        success: false,
        message: '不能评价自己的作业'
      });
      return;
    }

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT id, name FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 检查评价人和被评价人都是小组成员
    const reviewerMember = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, userId]
    );

    const revieweeMember = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, reviewee_id]
    );

    if (!reviewerMember || reviewerMember.length === 0) {
      res.status(403).json({
        success: false,
        message: '您不是该小组成员'
      });
      return;
    }

    if (!revieweeMember || revieweeMember.length === 0) {
      res.status(400).json({
        success: false,
        message: '被评价人不是该小组成员'
      });
      return;
    }

    // 验证作业存在
    const assignmentInfo = await executeQuery<any[]>(
      'SELECT id, title FROM assignments WHERE id = ?',
      [assignment_id]
    );

    if (!assignmentInfo || assignmentInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '作业不存在'
      });
      return;
    }

    // 验证被评价人已提交该作业
    const submission = await executeQuery<any[]>(
      `SELECT id FROM submissions 
       WHERE assignment_id = ? AND student_id = ? AND status IN ('graded', 'reviewed')`,
      [assignment_id, reviewee_id]
    );

    if (!submission || submission.length === 0) {
      res.status(400).json({
        success: false,
        message: '被评价人尚未完成该作业或作业未批改'
      });
      return;
    }

    // 检查是否已经评价过
    const existingReview = await executeQuery<any[]>(
      `SELECT id FROM peer_reviews 
       WHERE team_id = ? AND reviewer_id = ? AND reviewee_id = ? AND assignment_id = ?`,
      [id, userId, reviewee_id, assignment_id]
    );

    if (existingReview && existingReview.length > 0) {
      // 更新已有评价
      await executeQuery(
        `UPDATE peer_reviews 
         SET score = ?, comment = ?, created_at = NOW()
         WHERE id = ?`,
        [scoreNum, comment || '', existingReview[0].id]
      );

      res.json({
        success: true,
        message: '互评更新成功',
        data: {
          review_id: existingReview[0].id,
          team_id: parseInt(id),
          team_name: team.name,
          reviewer_id: userId,
          reviewee_id: parseInt(reviewee_id),
          assignment_id: parseInt(assignment_id),
          assignment_title: assignmentInfo[0].title,
          score: scoreNum,
          comment: comment || '',
          created_at: new Date(),
          is_update: true
        }
      });
      return;
    }

    // 创建新评价
    const result = await executeQuery<any>(
      `INSERT INTO peer_reviews (team_id, reviewer_id, reviewee_id, assignment_id, score, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, userId, reviewee_id, assignment_id, scoreNum, comment || '']
    );

    // 获取用户信息
    const reviewerInfo = await executeQuery<any[]>(
      'SELECT real_name FROM users WHERE id = ?',
      [userId]
    );

    const revieweeName = await executeQuery<any[]>(
      'SELECT real_name FROM users WHERE id = ?',
      [reviewee_id]
    );

    // 推送通知给被评价人
    try {
      await executeQuery(
        `INSERT INTO notifications (user_id, type, title, content, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          reviewee_id,
          'system',
          '收到小组互评',
          `${reviewerInfo[0]?.real_name || '某位同学'}在小组"${team.name}"对您的作业"${assignmentInfo[0].title}"进行了互评，评分：${scoreNum}分`
        ]
      );
    } catch (notifError) {
      console.warn('推送通知失败:', notifError);
    }

    res.status(201).json({
      success: true,
      message: '互评提交成功（不影响最终成绩）',
      data: {
        review_id: result.insertId,
        team_id: parseInt(id),
        team_name: team.name,
        reviewer_id: userId,
        reviewer_name: reviewerInfo[0]?.real_name || '',
        reviewee_id: parseInt(reviewee_id),
        reviewee_name: revieweeName[0]?.real_name || '',
        assignment_id: parseInt(assignment_id),
        assignment_title: assignmentInfo[0].title,
        score: scoreNum,
        comment: comment || '',
        created_at: new Date(),
        is_update: false
      }
    });

  } catch (error) {
    console.error('提交互评失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/teams/:id/peer-reviews
 * 查询互评记录
 * 
 * 功能：
 * 1. 返回小组的互评记录
 * 2. 支持按评价人或被评价人筛选
 * 3. 返回互评统计
 * 
 * 查询参数：
 * - reviewer_id: 筛选特定评价人的记录（可选）
 * - reviewee_id: 筛选特定被评价人的记录（可选）
 * - assignment_id: 筛选特定作业的记录（可选）
 * 
 * 需求：18.5
 */
router.get('/:id/peer-reviews', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewer_id, reviewee_id, assignment_id } = req.query;

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      'SELECT id, name FROM teams WHERE id = ?',
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 构建查询条件
    let whereClause = 'WHERE pr.team_id = ?';
    const params: any[] = [id];

    if (reviewer_id) {
      whereClause += ' AND pr.reviewer_id = ?';
      params.push(reviewer_id);
    }

    if (reviewee_id) {
      whereClause += ' AND pr.reviewee_id = ?';
      params.push(reviewee_id);
    }

    if (assignment_id) {
      whereClause += ' AND pr.assignment_id = ?';
      params.push(assignment_id);
    }

    // 查询互评记录
    const reviews = await executeQuery<any[]>(
      `SELECT 
        pr.id,
        pr.reviewer_id,
        u1.real_name as reviewer_name,
        pr.reviewee_id,
        u2.real_name as reviewee_name,
        pr.assignment_id,
        a.title as assignment_title,
        pr.score,
        pr.comment,
        pr.created_at
       FROM peer_reviews pr
       JOIN users u1 ON pr.reviewer_id = u1.id
       JOIN users u2 ON pr.reviewee_id = u2.id
       JOIN assignments a ON pr.assignment_id = a.id
       ${whereClause}
       ORDER BY pr.created_at DESC`,
      params
    );

    // 查询统计数据
    const statistics = await executeQuery<any[]>(
      `SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT reviewer_id) as active_reviewers,
        COUNT(DISTINCT reviewee_id) as reviewed_members,
        AVG(score) as avg_score
       FROM peer_reviews
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        team_id: parseInt(id),
        team_name: team.name,
        peer_reviews: reviews.map(r => ({
          id: r.id,
          reviewer_id: r.reviewer_id,
          reviewer_name: r.reviewer_name,
          reviewee_id: r.reviewee_id,
          reviewee_name: r.reviewee_name,
          assignment_id: r.assignment_id,
          assignment_title: r.assignment_title,
          score: r.score,
          comment: r.comment,
          created_at: r.created_at,
          note: '互评结果不影响最终成绩'
        })),
        statistics: {
          total_reviews: statistics[0]?.total_reviews || 0,
          active_reviewers: statistics[0]?.active_reviewers || 0,
          reviewed_members: statistics[0]?.reviewed_members || 0,
          avg_score: Math.round((statistics[0]?.avg_score || 0) * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('查询互评记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/teams/:id/report
 * 生成小组学情报告
 * 
 * 功能：
 * 1. 展示小组进度排名
 * 2. 展示成员贡献度
 * 3. 展示打卡率
 * 4. 提供可视化数据
 * 
 * 需求：18.6
 */
router.get('/:id/report', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // 验证小组存在
    const teamInfo = await executeQuery<any[]>(
      `SELECT t.id, t.name, t.description, t.creator_id, t.max_members, t.created_at,
              u.real_name as creator_name
       FROM teams t
       JOIN users u ON t.creator_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (!teamInfo || teamInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '小组不存在'
      });
      return;
    }

    const team = teamInfo[0];

    // 检查当前用户是否是成员
    const memberCheck = await executeQuery<any[]>(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!memberCheck || memberCheck.length === 0) {
      res.status(403).json({
        success: false,
        message: '只有小组成员可以查看学情报告'
      });
      return;
    }

    // 1. 获取成员贡献度数据
    const memberContributions = await executeQuery<any[]>(
      `SELECT 
        tm.user_id,
        u.real_name,
        u.avatar_url,
        tm.joined_at,
        COUNT(DISTINCT ci.id) as check_in_count,
        COALESCE(SUM(ci.study_duration), 0) as total_study_duration,
        COALESCE(SUM(ci.completed_tasks), 0) as total_completed_tasks,
        COUNT(DISTINCT pr.id) as peer_review_count
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN check_ins ci ON ci.team_id = tm.team_id AND ci.user_id = tm.user_id
       LEFT JOIN peer_reviews pr ON pr.team_id = tm.team_id AND pr.reviewer_id = tm.user_id
       WHERE tm.team_id = ?
       GROUP BY tm.user_id, u.real_name, u.avatar_url, tm.joined_at
       ORDER BY (COUNT(DISTINCT ci.id) + COUNT(DISTINCT pr.id)) DESC`,
      [id]
    );

    // 计算贡献度评分（基于打卡次数、学习时长、互评次数）
    const maxCheckIns = Math.max(...memberContributions.map(m => m.check_in_count), 1);
    const maxStudyDuration = Math.max(...memberContributions.map(m => m.total_study_duration), 1);
    const maxPeerReviews = Math.max(...memberContributions.map(m => m.peer_review_count), 1);

    const membersWithContribution = memberContributions.map((member, index) => {
      // 贡献度评分：打卡40% + 学习时长30% + 互评30%
      const checkInScore = (member.check_in_count / maxCheckIns) * 40;
      const studyDurationScore = (member.total_study_duration / maxStudyDuration) * 30;
      const peerReviewScore = (member.peer_review_count / maxPeerReviews) * 30;
      const contributionScore = Math.round(checkInScore + studyDurationScore + peerReviewScore);

      return {
        student_id: member.student_id,
        real_name: member.real_name,
        avatar_url: member.avatar_url,
        is_creator: member.student_id === team.creator_id,
        joined_at: member.joined_at,
        check_in_count: member.check_in_count,
        total_study_duration: member.total_study_duration,
        total_completed_tasks: member.total_completed_tasks,
        peer_review_count: member.peer_review_count,
        contribution_score: contributionScore,
        rank: index + 1
      };
    });

    // 2. 计算打卡率（最近7天）
    const checkInStats = await executeQuery<any[]>(
      `SELECT 
        check_in_date,
        COUNT(DISTINCT user_id) as checked_in_members
       FROM check_ins
       WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAYS)
       GROUP BY check_in_date
       ORDER BY check_in_date ASC`,
      [id]
    );

    const totalMembers = memberContributions.length;
    const checkInRateData = checkInStats.map(stat => ({
      date: stat.check_in_date,
      checked_in_members: stat.checked_in_members,
      total_members: totalMembers,
      check_in_rate: totalMembers > 0 ? Math.round((stat.checked_in_members / totalMembers) * 100) : 0
    }));

    // 计算平均打卡率
    const avgCheckInRate = checkInRateData.length > 0
      ? Math.round(checkInRateData.reduce((sum, d) => sum + d.check_in_rate, 0) / checkInRateData.length)
      : 0;

    // 3. 获取小组进度排名（基于总学习时长）
    const teamProgress = await executeQuery<any[]>(
      `SELECT 
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT tm.user_id) as member_count,
        COALESCE(SUM(ci.study_duration), 0) as total_study_duration,
        COUNT(DISTINCT ci.id) as total_check_ins
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN check_ins ci ON t.id = ci.team_id
       GROUP BY t.id, t.name
       ORDER BY total_study_duration DESC`,
      []
    );

    // 找到当前小组的排名
    const currentTeamRank = teamProgress.findIndex(t => t.team_id === parseInt(id)) + 1;
    const totalTeams = teamProgress.length;
    const currentTeamProgress = teamProgress.find(t => t.team_id === parseInt(id));

    // 4. 获取最近7天的学习趋势
    const learningTrend = await executeQuery<any[]>(
      `SELECT 
        check_in_date as date,
        COUNT(DISTINCT user_id) as active_members,
        SUM(study_duration) as total_study_duration,
        SUM(completed_tasks) as total_completed_tasks
       FROM check_ins
       WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAYS)
       GROUP BY check_in_date
       ORDER BY date ASC`,
      [id]
    );

    // 5. 获取互评统计
    const peerReviewStats = await executeQuery<any[]>(
      `SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT reviewer_id) as active_reviewers,
        AVG(score) as avg_score
       FROM peer_reviews
       WHERE team_id = ?`,
      [id]
    );

    // 6. 计算小组活跃度（基于最近7天的活动）
    const recentActivity = await executeQuery<any[]>(
      `SELECT 
        (SELECT COUNT(*) FROM check_ins WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAYS)) as recent_check_ins,
        (SELECT COUNT(*) FROM peer_reviews WHERE team_id = ? AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAYS)) as recent_reviews`,
      [id, id]
    );

    const activityScore = Math.min(100, Math.round(
      (recentActivity[0].recent_check_ins * 2 + recentActivity[0].recent_reviews * 3) / totalMembers
    ));

    res.json({
      success: true,
      data: {
        // 小组基本信息
        team_info: {
          team_id: team.id,
          name: team.name,
          goal: team.description,
          creator_id: team.creator_id,
          creator_name: team.creator_name,
          max_members: team.max_members,
          current_members: totalMembers,
          created_at: team.created_at
        },

        // 小组进度排名
        progress_ranking: {
          current_rank: currentTeamRank,
          total_teams: totalTeams,
          total_study_duration: currentTeamProgress?.total_study_duration || 0,
          total_check_ins: currentTeamProgress?.total_check_ins || 0,
          percentile: totalTeams > 0 ? Math.round((1 - (currentTeamRank - 1) / totalTeams) * 100) : 0
        },

        // 成员贡献度排名
        member_contributions: membersWithContribution,

        // 打卡率统计
        check_in_statistics: {
          avg_check_in_rate: avgCheckInRate,
          last_7_days: checkInRateData,
          total_check_ins: memberContributions.reduce((sum, m) => sum + m.check_in_count, 0),
          total_study_duration: memberContributions.reduce((sum, m) => sum + m.total_study_duration, 0),
          total_completed_tasks: memberContributions.reduce((sum, m) => sum + m.total_completed_tasks, 0)
        },

        // 学习趋势（最近7天）
        learning_trend: learningTrend.map(trend => ({
          date: trend.date,
          active_members: trend.active_members,
          total_study_duration: trend.total_study_duration,
          total_completed_tasks: trend.total_completed_tasks,
          avg_study_duration_per_member: trend.active_members > 0 
            ? Math.round(trend.total_study_duration / trend.active_members) 
            : 0
        })),

        // 互评统计
        peer_review_statistics: {
          total_reviews: peerReviewStats[0]?.total_reviews || 0,
          active_reviewers: peerReviewStats[0]?.active_reviewers || 0,
          avg_score: Math.round((peerReviewStats[0]?.avg_score || 0) * 100) / 100,
          participation_rate: totalMembers > 0 
            ? Math.round((peerReviewStats[0]?.active_reviewers || 0) / totalMembers * 100) 
            : 0
        },

        // 小组活跃度评分
        activity_score: activityScore,

        // 报告生成时间
        generated_at: new Date()
      }
    });

  } catch (error) {
    console.error('生成小组学情报告失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
