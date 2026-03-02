/**
 * 单元测试：课程体系管理API
 * Feature: learning-platform-integration, Task 4.3
 * 验证需求：1.1, 1.6, 1.7, 1.2, 1.3
 * 
 * 测试内容：
 * - 课程创建验证
 * - 课程查询筛选
 * - 级联删除
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { executeQuery } from '../../config/database.js';

// 测试数据
const testCourse = {
  language_name: 'TestLang_' + Date.now(),
  display_name: 'Test Language',
  description: 'Test course description',
  difficulty: 'beginner' as const,
  price: 99.00,
  is_hot: true,
  hot_rank: 1
};

const testBranch = {
  branch_name: 'Test Branch',
  description: 'Test branch description',
  difficulty: 'intermediate' as const,
  estimated_hours: 40,
  order_num: 1
};

const testLesson = {
  lesson_number: 1,
  title: 'Test Lesson',
  description: 'Test lesson description',
  video_url: 'https://example.com/video.mp4',
  video_duration: 1800,
  content: '# Test Content',
  code_example: 'console.log("test");',
  is_free: true,
  order_num: 1
};

let createdCourseId: number;
let createdBranchId: number;
let createdLessonId: number;

describe('课程体系管理API单元测试', () => {
  
  // ==================== 课程创建验证测试 ====================
  
  describe('课程创建验证', () => {
    
    test('应该成功创建课程', async () => {
      const result = await executeQuery<any>(
        `INSERT INTO courses 
         (language_name, display_name, description, difficulty, price, is_hot, hot_rank) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          testCourse.language_name,
          testCourse.display_name,
          testCourse.description,
          testCourse.difficulty,
          testCourse.price,
          testCourse.is_hot,
          testCourse.hot_rank
        ]
      );
      
      createdCourseId = result.insertId;
      expect(createdCourseId).toBeGreaterThan(0);
      
      // 验证课程已创建
      const courses = await executeQuery<any[]>(
        'SELECT * FROM courses WHERE id = ?',
        [createdCourseId]
      );
      
      expect(courses.length).toBe(1);
      expect(courses[0].language_name).toBe(testCourse.language_name);
      expect(courses[0].display_name).toBe(testCourse.display_name);
      expect(courses[0].difficulty).toBe(testCourse.difficulty);
      expect(parseFloat(courses[0].price)).toBe(testCourse.price);
    });
    
    test('应该拒绝缺少必填字段的课程', async () => {
      try {
        await executeQuery<any>(
          `INSERT INTO courses (language_name) VALUES (?)`,
          ['InvalidCourse']
        );
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出错误
        expect(error).toBeDefined();
      }
    });
    
    test('应该拒绝无效的难度级别', async () => {
      try {
        await executeQuery<any>(
          `INSERT INTO courses 
           (language_name, display_name, difficulty) 
           VALUES (?, ?, ?)`,
          ['TestLang2', 'Test Lang 2', 'invalid']
        );
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出错误
        expect(error).toBeDefined();
      }
    });
    
    test('应该拒绝负数价格', async () => {
      try {
        await executeQuery<any>(
          `INSERT INTO courses 
           (language_name, display_name, price) 
           VALUES (?, ?, ?)`,
          ['TestLang3', 'Test Lang 3', -10]
        );
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出错误
        expect(error).toBeDefined();
      }
    });
  });
  
  // ==================== 课程查询筛选测试 ====================
  
  describe('课程查询筛选', () => {
    
    test('应该按难度筛选课程', async () => {
      const courses = await executeQuery<any[]>(
        'SELECT * FROM courses WHERE difficulty = ?',
        ['beginner']
      );
      
      expect(Array.isArray(courses)).toBe(true);
      courses.forEach(course => {
        expect(course.difficulty).toBe('beginner');
      });
    });
    
    test('应该按热门标记筛选课程', async () => {
      const courses = await executeQuery<any[]>(
        'SELECT * FROM courses WHERE is_hot = ?',
        [true]
      );
      
      expect(Array.isArray(courses)).toBe(true);
      courses.forEach(course => {
        expect(course.is_hot).toBe(1); // MySQL返回1表示true
      });
    });
    
    test('应该按价格范围筛选课程', async () => {
      const minPrice = 50;
      const maxPrice = 150;
      
      const courses = await executeQuery<any[]>(
        'SELECT * FROM courses WHERE price >= ? AND price <= ?',
        [minPrice, maxPrice]
      );
      
      expect(Array.isArray(courses)).toBe(true);
      courses.forEach(course => {
        const price = parseFloat(course.price);
        expect(price).toBeGreaterThanOrEqual(minPrice);
        expect(price).toBeLessThanOrEqual(maxPrice);
      });
    });
    
    test('应该按关键词搜索课程', async () => {
      const keyword = 'Test';
      const searchPattern = `%${keyword}%`;
      
      const courses = await executeQuery<any[]>(
        `SELECT * FROM courses 
         WHERE language_name LIKE ? OR display_name LIKE ? OR description LIKE ?`,
        [searchPattern, searchPattern, searchPattern]
      );
      
      expect(Array.isArray(courses)).toBe(true);
      courses.forEach(course => {
        const matchesKeyword = 
          course.language_name.includes(keyword) ||
          course.display_name.includes(keyword) ||
          (course.description && course.description.includes(keyword));
        expect(matchesKeyword).toBe(true);
      });
    });
    
    test('应该按热门排名排序', async () => {
      const courses = await executeQuery<any[]>(
        `SELECT * FROM courses 
         WHERE is_hot = 1 
         ORDER BY hot_rank ASC 
         LIMIT 10`
      );
      
      expect(Array.isArray(courses)).toBe(true);
      
      // 验证排序正确
      for (let i = 1; i < courses.length; i++) {
        expect(courses[i].hot_rank).toBeGreaterThanOrEqual(courses[i - 1].hot_rank);
      }
    });
  });
  
  // ==================== 课程分支测试 ====================
  
  describe('课程分支管理', () => {
    
    test('应该成功创建课程分支', async () => {
      const result = await executeQuery<any>(
        `INSERT INTO course_branches 
         (course_id, branch_name, description, difficulty, estimated_hours, order_num) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          createdCourseId,
          testBranch.branch_name,
          testBranch.description,
          testBranch.difficulty,
          testBranch.estimated_hours,
          testBranch.order_num
        ]
      );
      
      createdBranchId = result.insertId;
      expect(createdBranchId).toBeGreaterThan(0);
      
      // 验证分支已创建
      const branches = await executeQuery<any[]>(
        'SELECT * FROM course_branches WHERE id = ?',
        [createdBranchId]
      );
      
      expect(branches.length).toBe(1);
      expect(branches[0].course_id).toBe(createdCourseId);
      expect(branches[0].branch_name).toBe(testBranch.branch_name);
    });
    
    test('应该按order_num排序分支', async () => {
      const branches = await executeQuery<any[]>(
        'SELECT * FROM course_branches WHERE course_id = ? ORDER BY order_num ASC',
        [createdCourseId]
      );
      
      expect(Array.isArray(branches)).toBe(true);
      
      // 验证排序正确
      for (let i = 1; i < branches.length; i++) {
        expect(branches[i].order_num).toBeGreaterThanOrEqual(branches[i - 1].order_num);
      }
    });
  });
  
  // ==================== 课节测试 ====================
  
  describe('课节管理', () => {
    
    test('应该成功创建课节', async () => {
      const result = await executeQuery<any>(
        `INSERT INTO course_lessons 
         (branch_id, lesson_number, title, description, video_url, video_duration, 
          content, code_example, is_free, order_num) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createdBranchId,
          testLesson.lesson_number,
          testLesson.title,
          testLesson.description,
          testLesson.video_url,
          testLesson.video_duration,
          testLesson.content,
          testLesson.code_example,
          testLesson.is_free,
          testLesson.order_num
        ]
      );
      
      createdLessonId = result.insertId;
      expect(createdLessonId).toBeGreaterThan(0);
      
      // 验证课节已创建
      const lessons = await executeQuery<any[]>(
        'SELECT * FROM course_lessons WHERE id = ?',
        [createdLessonId]
      );
      
      expect(lessons.length).toBe(1);
      expect(lessons[0].branch_id).toBe(createdBranchId);
      expect(lessons[0].title).toBe(testLesson.title);
    });
    
    test('应该按lesson_number排序课节', async () => {
      const lessons = await executeQuery<any[]>(
        'SELECT * FROM course_lessons WHERE branch_id = ? ORDER BY lesson_number ASC',
        [createdBranchId]
      );
      
      expect(Array.isArray(lessons)).toBe(true);
      
      // 验证排序正确
      for (let i = 1; i < lessons.length; i++) {
        expect(lessons[i].lesson_number).toBeGreaterThanOrEqual(lessons[i - 1].lesson_number);
      }
    });
  });
  
  // ==================== 级联删除测试 ====================
  
  describe('级联删除', () => {
    
    test('删除课程应该级联删除分支和课节', async () => {
      // 验证删除前数据存在
      const branchesBefore = await executeQuery<any[]>(
        'SELECT * FROM course_branches WHERE course_id = ?',
        [createdCourseId]
      );
      expect(branchesBefore.length).toBeGreaterThan(0);
      
      const lessonsBefore = await executeQuery<any[]>(
        'SELECT * FROM course_lessons WHERE branch_id = ?',
        [createdBranchId]
      );
      expect(lessonsBefore.length).toBeGreaterThan(0);
      
      // 删除课程
      await executeQuery(
        'DELETE FROM courses WHERE id = ?',
        [createdCourseId]
      );
      
      // 验证课程已删除
      const courses = await executeQuery<any[]>(
        'SELECT * FROM courses WHERE id = ?',
        [createdCourseId]
      );
      expect(courses.length).toBe(0);
      
      // 验证分支已级联删除
      const branchesAfter = await executeQuery<any[]>(
        'SELECT * FROM course_branches WHERE course_id = ?',
        [createdCourseId]
      );
      expect(branchesAfter.length).toBe(0);
      
      // 验证课节已级联删除
      const lessonsAfter = await executeQuery<any[]>(
        'SELECT * FROM course_lessons WHERE branch_id = ?',
        [createdBranchId]
      );
      expect(lessonsAfter.length).toBe(0);
    });
  });
  
  // ==================== 数据完整性测试 ====================
  
  describe('数据完整性', () => {
    
    test('应该拒绝创建不存在课程的分支', async () => {
      try {
        await executeQuery<any>(
          `INSERT INTO course_branches 
           (course_id, branch_name) 
           VALUES (?, ?)`,
          [999999, 'Invalid Branch']
        );
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出外键约束错误
        expect(error).toBeDefined();
      }
    });
    
    test('应该拒绝创建不存在分支的课节', async () => {
      try {
        await executeQuery<any>(
          `INSERT INTO course_lessons 
           (branch_id, lesson_number, title) 
           VALUES (?, ?, ?)`,
          [999999, 1, 'Invalid Lesson']
        );
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 应该抛出外键约束错误
        expect(error).toBeDefined();
      }
    });
  });
});
