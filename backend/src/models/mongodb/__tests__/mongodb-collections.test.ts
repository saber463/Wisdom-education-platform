import { connectMongoDB, closeMongoConnection } from '../../../config/mongodb.js';
import {
  VideoProgress,
  UserBehavior,
  Recommendation,
  CommunityPost,
  MindMapData,
  AILearningPathDynamic,
  VirtualLearningPartner
} from '../index.js';

describe('MongoDB Collections Tests', () => {
  // 连接到测试数据库
  beforeAll(async () => {
    await connectMongoDB();
  });

  // 清理测试数据
  afterEach(async () => {
    await VideoProgress.deleteMany({});
    await UserBehavior.deleteMany({});
    await Recommendation.deleteMany({});
    await CommunityPost.deleteMany({});
    await MindMapData.deleteMany({});
    await AILearningPathDynamic.deleteMany({});
    await VirtualLearningPartner.deleteMany({});
  });

  // 关闭数据库连接
  afterAll(async () => {
    await closeMongoConnection();
  });

  describe('VideoProgress Collection', () => {
    it('应该成功插入视频进度记录', async () => {
      const videoProgress = new VideoProgress({
        user_id: 1,
        lesson_id: 101,
        video_url: 'https://example.com/video1.mp4',
        current_position: 120,
        duration: 600,
        progress_percentage: 20,
        watch_count: 1,
        total_watch_time: 120,
        playback_speed: 1.0,
        pause_positions: [
          { position: 60, pause_duration: 10, timestamp: new Date() }
        ],
        heat_map: [
          { start: 50, end: 70, count: 2 }
        ],
        is_completed: false
      });

      const saved = await videoProgress.save();
      expect(saved._id).toBeDefined();
      expect(saved.user_id).toBe(1);
      expect(saved.lesson_id).toBe(101);
      expect(saved.progress_percentage).toBe(20);
    });

    it('应该查询用户的视频进度', async () => {
      await VideoProgress.create({
        user_id: 1,
        lesson_id: 101,
        video_url: 'https://example.com/video1.mp4',
        current_position: 120,
        duration: 600,
        progress_percentage: 20,
        watch_count: 1,
        total_watch_time: 120,
        playback_speed: 1.0
      });

      const progress = await VideoProgress.findOne({ user_id: 1, lesson_id: 101 });
      expect(progress).toBeDefined();
      expect(progress?.user_id).toBe(1);
      expect(progress?.lesson_id).toBe(101);
    });

    it('应该验证唯一索引 (user_id + lesson_id)', async () => {
      await VideoProgress.create({
        user_id: 1,
        lesson_id: 101,
        video_url: 'https://example.com/video1.mp4',
        current_position: 120,
        duration: 600,
        progress_percentage: 20,
        watch_count: 1,
        total_watch_time: 120,
        playback_speed: 1.0
      });

      // 尝试插入重复记录
      await expect(
        VideoProgress.create({
          user_id: 1,
          lesson_id: 101,
          video_url: 'https://example.com/video2.mp4',
          current_position: 200,
          duration: 600,
          progress_percentage: 33,
          watch_count: 2,
          total_watch_time: 200,
          playback_speed: 1.0
        })
      ).rejects.toThrow();
    });
  });

  describe('UserBehavior Collection', () => {
    it('应该成功插入用户行为记录', async () => {
      const behavior = new UserBehavior({
        user_id: 1,
        behavior_type: 'view',
        target_type: 'course',
        target_id: 101,
        metadata: {
          course_id: 101,
          tags: ['python', 'beginner'],
          duration: 300,
          source: 'recommendation'
        },
        session_id: 'session-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0'
      });

      const saved = await behavior.save();
      expect(saved._id).toBeDefined();
      expect(saved.user_id).toBe(1);
      expect(saved.behavior_type).toBe('view');
      expect(saved.metadata.course_id).toBe(101);
    });

    it('应该查询用户的行为历史', async () => {
      await UserBehavior.create({
        user_id: 1,
        behavior_type: 'view',
        target_type: 'course',
        target_id: 101,
        metadata: {},
        session_id: 'session-123'
      });

      await UserBehavior.create({
        user_id: 1,
        behavior_type: 'click',
        target_type: 'lesson',
        target_id: 201,
        metadata: {},
        session_id: 'session-123'
      });

      const behaviors = await UserBehavior.find({ user_id: 1 }).sort({ timestamp: -1 });
      expect(behaviors).toHaveLength(2);
      expect(behaviors[0].behavior_type).toBe('click');
    });
  });

  describe('Recommendation Collection', () => {
    it('应该成功插入推荐结果', async () => {
      const recommendation = new Recommendation({
        user_id: 1,
        recommendation_type: 'course',
        items: [
          {
            item_id: 101,
            item_type: 'course',
            score: 0.95,
            reason: '基于你的学习历史推荐',
            tags: ['python', 'web']
          }
        ],
        algorithm: 'collaborative_filtering',
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_active: true
      });

      const saved = await recommendation.save();
      expect(saved._id).toBeDefined();
      expect(saved.user_id).toBe(1);
      expect(saved.items).toHaveLength(1);
      expect(saved.items[0].score).toBe(0.95);
    });

    it('应该查询活跃的推荐结果', async () => {
      await Recommendation.create({
        user_id: 1,
        recommendation_type: 'course',
        items: [],
        algorithm: 'content_based',
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_active: true
      });

      const recommendations = await Recommendation.find({
        user_id: 1,
        recommendation_type: 'course',
        is_active: true
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].is_active).toBe(true);
    });
  });

  describe('CommunityPost Collection', () => {
    it('应该成功插入社区帖子', async () => {
      const post = new CommunityPost({
        user_id: 1,
        post_type: 'question',
        title: '如何学习Python？',
        content: '我是初学者，想学习Python，有什么建议吗？',
        code_blocks: [
          {
            language: 'python',
            code: 'print("Hello World")'
          }
        ],
        images: ['https://example.com/image1.jpg'],
        tags: ['python', 'beginner'],
        related_course_id: 101,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        is_pinned: false,
        is_featured: false,
        status: 'published'
      });

      const saved = await post.save();
      expect(saved._id).toBeDefined();
      expect(saved.user_id).toBe(1);
      expect(saved.post_type).toBe('question');
      expect(saved.code_blocks).toHaveLength(1);
    });

    it('应该查询特定课程的帖子', async () => {
      await CommunityPost.create({
        user_id: 1,
        post_type: 'forum',
        title: 'Python学习心得',
        content: '分享我的学习经验',
        tags: ['python'],
        related_course_id: 101,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        status: 'published'
      });

      const posts = await CommunityPost.find({ related_course_id: 101 });
      expect(posts).toHaveLength(1);
      expect(posts[0].related_course_id).toBe(101);
    });
  });

  describe('MindMapData Collection', () => {
    it('应该成功插入思维导图数据', async () => {
      const mindmap = new MindMapData({
        learning_path_id: 1,
        user_id: 1,
        nodes: [
          {
            id: 'node-1',
            label: 'Python基础',
            type: 'root',
            step_id: 1,
            status: 'completed',
            position: { x: 0, y: 0 },
            style: { color: '#4CAF50' }
          }
        ],
        edges: [
          {
            source: 'node-1',
            target: 'node-2',
            type: 'required'
          }
        ],
        layout: 'tree'
      });

      const saved = await mindmap.save();
      expect(saved._id).toBeDefined();
      expect(saved.learning_path_id).toBe(1);
      expect(saved.nodes).toHaveLength(1);
      expect(saved.edges).toHaveLength(1);
    });

    it('应该验证唯一索引 (learning_path_id + user_id)', async () => {
      await MindMapData.create({
        learning_path_id: 1,
        user_id: 1,
        nodes: [],
        edges: [],
        layout: 'tree'
      });

      // 尝试插入重复记录
      await expect(
        MindMapData.create({
          learning_path_id: 1,
          user_id: 1,
          nodes: [],
          edges: [],
          layout: 'radial'
        })
      ).rejects.toThrow();
    });
  });

  describe('AILearningPathDynamic Collection', () => {
    it('应该成功插入路径调整日志', async () => {
      const adjustment = new AILearningPathDynamic({
        user_id: 1,
        learning_path_id: 1,
        adjustment_type: 'knowledge_evaluation',
        trigger_event: '完成课节练习',
        adjustment_details: [
          {
            knowledge_point_id: 1,
            knowledge_point_name: '变量和数据类型',
            old_mastery_level: 'weak',
            new_mastery_level: 'consolidating',
            action: 'add_practice',
            reason: '练习正确率提升到70%'
          }
        ],
        learning_ability_tag: 'steady',
        evaluation_score: 75.5,
        adjustment_summary: '检测到变量知识点掌握度提升，已添加巩固练习'
      });

      const saved = await adjustment.save();
      expect(saved._id).toBeDefined();
      expect(saved.user_id).toBe(1);
      expect(saved.adjustment_details).toHaveLength(1);
      expect(saved.evaluation_score).toBe(75.5);
    });

    it('应该查询用户的调整历史', async () => {
      await AILearningPathDynamic.create({
        user_id: 1,
        learning_path_id: 1,
        adjustment_type: 'knowledge_evaluation',
        trigger_event: '完成课节',
        adjustment_details: [],
        learning_ability_tag: 'efficient',
        evaluation_score: 85,
        adjustment_summary: '知识点已掌握'
      });

      const adjustments = await AILearningPathDynamic.find({ user_id: 1 }).sort({ created_at: -1 });
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].learning_ability_tag).toBe('efficient');
    });
  });

  describe('VirtualLearningPartner Collection', () => {
    it('应该成功插入虚拟伙伴记录', async () => {
      const partner = new VirtualLearningPartner({
        user_id: 1,
        partner_id: 1001,
        partner_name: '小智',
        partner_avatar: 'https://example.com/avatar1.jpg',
        partner_signature: '一起学习，共同进步！',
        learning_ability_tag: 'efficient',
        partner_level: 1,
        interaction_history: [
          {
            sender: 'partner',
            content: '你好！我是你的学习伙伴小智',
            message_type: 'encouragement',
            timestamp: new Date()
          }
        ],
        collaborative_tasks: [
          {
            task_id: 1,
            task_description: '一起完成3道练习题',
            user_progress: 0,
            partner_progress: 0,
            target_count: 3,
            completed: false
          }
        ],
        total_interactions: 1
      });

      const saved = await partner.save();
      expect(saved._id).toBeDefined();
      expect(saved.user_id).toBe(1);
      expect(saved.partner_name).toBe('小智');
      expect(saved.interaction_history).toHaveLength(1);
    });

    it('应该验证唯一索引 (user_id)', async () => {
      await VirtualLearningPartner.create({
        user_id: 1,
        partner_id: 1001,
        partner_name: '小智',
        partner_avatar: 'https://example.com/avatar1.jpg',
        partner_signature: '一起学习！',
        learning_ability_tag: 'efficient',
        partner_level: 1,
        total_interactions: 0
      });

      // 尝试插入重复记录
      await expect(
        VirtualLearningPartner.create({
          user_id: 1,
          partner_id: 1002,
          partner_name: '小明',
          partner_avatar: 'https://example.com/avatar2.jpg',
          partner_signature: '加油！',
          learning_ability_tag: 'steady',
          partner_level: 1,
          total_interactions: 0
        })
      ).rejects.toThrow();
    });
  });

  describe('Index Performance Tests', () => {
    it('应该验证VideoProgress索引效果', async () => {
      // 插入测试数据
      const testData = [];
      for (let i = 1; i <= 100; i++) {
        testData.push({
          user_id: i,
          lesson_id: 101,
          video_url: `https://example.com/video${i}.mp4`,
          current_position: i * 10,
          duration: 600,
          progress_percentage: (i * 10 / 600) * 100,
          watch_count: 1,
          total_watch_time: i * 10,
          playback_speed: 1.0
        });
      }
      await VideoProgress.insertMany(testData);

      // 测试索引查询性能
      const startTime = Date.now();
      const result = await VideoProgress.findOne({ user_id: 50, lesson_id: 101 });
      const queryTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result?.user_id).toBe(50);
      expect(queryTime).toBeLessThan(100); // 查询应该在100ms内完成
    });

    it('应该验证UserBehavior聚合查询性能', async () => {
      // 插入测试数据
      const testData = [];
      for (let i = 1; i <= 100; i++) {
        testData.push({
          user_id: 1,
          behavior_type: i % 2 === 0 ? 'view' : 'click',
          target_type: 'course',
          target_id: i,
          metadata: { course_id: i },
          session_id: 'session-test',
          timestamp: new Date(Date.now() - i * 1000)
        });
      }
      await UserBehavior.insertMany(testData);

      // 测试聚合查询
      const startTime = Date.now();
      const result = await UserBehavior.aggregate([
        { $match: { user_id: 1 } },
        { $group: { _id: '$behavior_type', count: { $sum: 1 } } }
      ]);
      const queryTime = Date.now() - startTime;

      expect(result).toHaveLength(2);
      expect(queryTime).toBeLessThan(200); // 聚合查询应该在200ms内完成
    });
  });
});
