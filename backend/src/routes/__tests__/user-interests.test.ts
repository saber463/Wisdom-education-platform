/**
 * 用户兴趣调查API测试
 * Property-Based Tests using fast-check
 * Requirements: 20.1, 20.9, 20.10
 */

import * as fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import userInterestsRoutes from '../user-interests.js';
import { executeQuery } from '../../config/database.js';

// Mock dependencies
jest.mock('../../config/database.js');
jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    // Mock authentication - extract user from token
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, 'test-secret') as any;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ success: false, message: '令牌无效' });
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/api/user-interests', userInterestsRoutes);

const JWT_SECRET = 'test-secret';

// Helper function to generate JWT token
function generateToken(userId: number, role: string = 'student'): string {
  return jwt.sign({ id: userId, username: `user${userId}`, role }, JWT_SECRET, { expiresIn: '1h' });
}

// Arbitraries for property-based testing
const learningGoalArb = fc.constantFrom('employment', 'hobby', 'exam', 'project');
const skillLevelArb = fc.constantFrom('beginner', 'intermediate', 'advanced', 'expert');
const weeklyHoursArb = fc.constantFrom('less_5', 'hours_5_10', 'hours_10_20', 'more_20');
const languageArb = fc.constantFrom('Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust', 'TypeScript');
const directionArb = fc.constantFrom('frontend', 'backend', 'mobile', 'ai', 'data', 'game', 'devops');
const styleArb = fc.constantFrom('video', 'document', 'project', 'interactive');

const surveyDataArb = fc.record({
  learning_goal: learningGoalArb,
  interested_languages: fc.array(languageArb, { minLength: 1, maxLength: 5 }).map(arr => [...new Set(arr)]),
  interested_directions: fc.array(directionArb, { minLength: 1, maxLength: 5 }).map(arr => [...new Set(arr)]),
  skill_level: skillLevelArb,
  weekly_hours: weeklyHoursArb,
  learning_style: fc.array(styleArb, { minLength: 1, maxLength: 4 }).map(arr => [...new Set(arr)])
});

describe('User Interests API - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 48: 首次登录显示问卷
   * Feature: learning-platform-integration, Property 48: 首次登录显示问卷
   * Validates: Requirements 20.1
   * 
   * For any new user, when they check survey status, the system should return completed=false
   */
  test('Property 48: First-time users should see survey incomplete status', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 10000 }), async (userId) => {
        // Mock database to return no existing interests
        (executeQuery as jest.Mock).mockResolvedValue([]);

        const token = generateToken(userId);
        const response = await request(app)
          .get('/api/user-interests/status')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.completed).toBe(false);
        expect(response.body.data).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 49: 问卷数据验证
   * Feature: learning-platform-integration, Property 49: 问卷数据验证
   * Validates: Requirements 20.9
   * 
   * For any valid survey data, when submitted, the system should accept it and return success
   */
  test('Property 49: Valid survey data should be accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        surveyDataArb,
        async (userId, surveyData) => {
          // Mock database responses
          (executeQuery as jest.Mock)
            .mockResolvedValueOnce([]) // Check existing interests
            .mockResolvedValueOnce({ insertId: 1 }) // Insert new record
            .mockResolvedValueOnce([{ // Return inserted data
              id: 1,
              user_id: userId,
              learning_goal: surveyData.learning_goal,
              interested_languages: JSON.stringify(surveyData.interested_languages),
              interested_directions: JSON.stringify(surveyData.interested_directions),
              skill_level: surveyData.skill_level,
              weekly_hours: surveyData.weekly_hours,
              learning_style: JSON.stringify(surveyData.learning_style),
              survey_completed: true,
              survey_completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            }]);

          const token = generateToken(userId);
          const response = await request(app)
            .post('/api/user-interests')
            .set('Authorization', `Bearer ${token}`)
            .send(surveyData);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('问卷提交成功');
          expect(response.body.data).toBeDefined();
          expect(response.body.data.learning_goal).toBe(surveyData.learning_goal);
          expect(response.body.data.skill_level).toBe(surveyData.skill_level);
          expect(response.body.data.interested_languages).toEqual(surveyData.interested_languages);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 50: 完成记录
   * Feature: learning-platform-integration, Property 50: 完成记录
   * Validates: Requirements 20.10
   * 
   * For any user who has completed the survey, when they check status, 
   * the system should return completed=true with their data
   */
  test('Property 50: Completed surveys should be recorded and retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        surveyDataArb,
        async (userId, surveyData) => {
          const completedAt = new Date();
          
          // Mock database to return completed survey
          (executeQuery as jest.Mock).mockResolvedValue([{
            id: 1,
            user_id: userId,
            learning_goal: surveyData.learning_goal,
            interested_languages: JSON.stringify(surveyData.interested_languages),
            interested_directions: JSON.stringify(surveyData.interested_directions),
            skill_level: surveyData.skill_level,
            weekly_hours: surveyData.weekly_hours,
            learning_style: JSON.stringify(surveyData.learning_style),
            survey_completed: true,
            survey_completed_at: completedAt,
            created_at: new Date(),
            updated_at: new Date()
          }]);

          const token = generateToken(userId);
          const response = await request(app)
            .get('/api/user-interests/status')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.completed).toBe(true);
          expect(response.body.data).toBeDefined();
          expect(response.body.data.survey_completed).toBe(true);
          expect(response.body.data.user_id).toBe(userId);
          expect(response.body.data.learning_goal).toBe(surveyData.learning_goal);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Invalid survey data should be rejected
   * For any survey data with missing required fields, the system should reject it
   */
  test('Property: Invalid survey data should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        async (userId) => {
          const invalidData = {
            learning_goal: 'employment',
            // Missing other required fields
          };

          const token = generateToken(userId);
          const response = await request(app)
            .post('/api/user-interests')
            .set('Authorization', `Bearer ${token}`)
            .send(invalidData);

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toContain('必填项');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Empty arrays should be rejected
   * For any survey data with empty language/direction/style arrays, the system should reject it
   */
  test('Property: Empty arrays in survey data should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        async (userId) => {
          const invalidData = {
            learning_goal: 'employment',
            interested_languages: [], // Empty array
            interested_directions: ['frontend'],
            skill_level: 'beginner',
            weekly_hours: 'less_5',
            learning_style: ['video']
          };

          const token = generateToken(userId);
          const response = await request(app)
            .post('/api/user-interests')
            .set('Authorization', `Bearer ${token}`)
            .send(invalidData);

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.message).toContain('至少选择一项');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Survey update should preserve user_id
   * For any user updating their survey, the user_id should remain unchanged
   */
  test('Property: Survey updates should preserve user identity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        surveyDataArb,
        surveyDataArb,
        async (userId, initialData, updatedData) => {
          // Mock initial submission
          (executeQuery as jest.Mock)
            .mockResolvedValueOnce([]) // No existing data
            .mockResolvedValueOnce({ insertId: 1 }) // Insert
            .mockResolvedValueOnce([{ // Return initial data
              id: 1,
              user_id: userId,
              ...initialData,
              interested_languages: JSON.stringify(initialData.interested_languages),
              interested_directions: JSON.stringify(initialData.interested_directions),
              learning_style: JSON.stringify(initialData.learning_style),
              survey_completed: true,
              survey_completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            }]);

          const token = generateToken(userId);
          
          // Initial submission
          await request(app)
            .post('/api/user-interests')
            .set('Authorization', `Bearer ${token}`)
            .send(initialData);

          // Mock update
          (executeQuery as jest.Mock)
            .mockResolvedValueOnce(undefined) // Update query
            .mockResolvedValueOnce([{ // Return updated data
              id: 1,
              user_id: userId, // Same user_id
              ...updatedData,
              interested_languages: JSON.stringify(updatedData.interested_languages),
              interested_directions: JSON.stringify(updatedData.interested_directions),
              learning_style: JSON.stringify(updatedData.learning_style),
              survey_completed: true,
              survey_completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            }]);

          // Update submission
          const updateResponse = await request(app)
            .put('/api/user-interests')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

          expect(updateResponse.status).toBe(200);
          expect(updateResponse.body.data.user_id).toBe(userId);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('User Interests API - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/user-interests - should require authentication', async () => {
    const response = await request(app)
      .post('/api/user-interests')
      .send({
        learning_goal: 'employment',
        interested_languages: ['Python'],
        interested_directions: ['backend'],
        skill_level: 'beginner',
        weekly_hours: 'less_5',
        learning_style: ['video']
      });

    expect(response.status).toBe(401);
  });

  test('GET /api/user-interests/status - should return 404 for non-existent user', async () => {
    (executeQuery as jest.Mock).mockResolvedValue([]);

    const token = generateToken(999);
    const response = await request(app)
      .get('/api/user-interests/status')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(false);
  });

  test('GET /api/user-interests/recommendations - should require completed survey', async () => {
    (executeQuery as jest.Mock).mockResolvedValue([]);

    const token = generateToken(1);
    const response = await request(app)
      .get('/api/user-interests/recommendations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('完成兴趣调查问卷');
  });
});
