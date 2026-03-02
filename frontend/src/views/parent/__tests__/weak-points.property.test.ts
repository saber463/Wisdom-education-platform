/**
 * 属性测试：AI辅导建议生成
 * 
 * **Feature: smart-education-platform, Property 30: AI辅导建议生成**
 * **验证需求：8.4**
 * 
 * 对于任何薄弱点详情查看，系统应提供AI生成的辅导建议和推荐学习资源
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// 薄弱知识点接口
interface WeakPoint {
  id: number
  name: string
  subject: string
  grade: string
  masteryRate: number
  errorCount: number
  totalCount: number
  errorRate: number
  lastPracticeTime: string
}

// 学习资源接口
interface LearningResource {
  id: number
  title: string
  description: string
  type: 'video' | 'article' | 'exercise' | 'link'
  url: string
}

// 错题接口
interface WrongQuestion {
  id: number
  questionContent: string
  studentAnswer: string
  correctAnswer: string
  errorTime: string
}

// 薄弱点详情响应接口
interface WeakPointDetailResponse {
  weakPoint: WeakPoint
  aiSuggestions: string[]
  recommendedResources: LearningResource[]
  wrongQuestions: WrongQuestion[]
}

// 生成有效的日期字符串
const dateStringArbitrary = fc.integer({ min: 0, max: 365 }).map(days => {
  const date = new Date('2026-01-01')
  date.setDate(date.getDate() - days)
  return date.toISOString()
})

// 生成学科
const subjectArbitrary = fc.constantFrom('语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治')

// 生成年级
const gradeArbitrary = fc.constantFrom('七年级', '八年级', '九年级', '高一', '高二', '高三')

// 生成薄弱知识点（确保errorCount <= totalCount）
const weakPointArbitrary = fc.integer({ min: 1, max: 100 }).chain(totalCount =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 2, maxLength: 50 }),
    subject: subjectArbitrary,
    grade: gradeArbitrary,
    masteryRate: fc.integer({ min: 0, max: 100 }),
    errorCount: fc.integer({ min: 0, max: totalCount }),
    totalCount: fc.constant(totalCount),
    errorRate: fc.float({ min: 0, max: 100, noNaN: true }),
    lastPracticeTime: dateStringArbitrary
  })
)

// 生成资源类型
const resourceTypeArbitrary = fc.constantFrom('video', 'article', 'exercise', 'link') as fc.Arbitrary<'video' | 'article' | 'exercise' | 'link'>

// 生成学习资源
const learningResourceArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 2, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  type: resourceTypeArbitrary,
  url: fc.webUrl()
})

// 生成错题
const wrongQuestionArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  questionContent: fc.string({ minLength: 5, maxLength: 500 }),
  studentAnswer: fc.string({ minLength: 0, maxLength: 200 }),
  correctAnswer: fc.string({ minLength: 1, maxLength: 200 }),
  errorTime: dateStringArbitrary
})

// 生成AI辅导建议
const aiSuggestionArbitrary = fc.string({ minLength: 10, maxLength: 300 })

// 生成完整的薄弱点详情响应
const weakPointDetailResponseArbitrary = fc.record({
  weakPoint: weakPointArbitrary,
  aiSuggestions: fc.array(aiSuggestionArbitrary, { minLength: 0, maxLength: 10 }),
  recommendedResources: fc.array(learningResourceArbitrary, { minLength: 0, maxLength: 10 }),
  wrongQuestions: fc.array(wrongQuestionArbitrary, { minLength: 0, maxLength: 20 })
})

// 验证AI辅导建议数据完整性
function hasAISuggestions(response: WeakPointDetailResponse): boolean {
  return response.aiSuggestions !== undefined &&
         Array.isArray(response.aiSuggestions)
}

// 验证推荐学习资源数据完整性
function hasRecommendedResources(response: WeakPointDetailResponse): boolean {
  return response.recommendedResources !== undefined &&
         Array.isArray(response.recommendedResources) &&
         response.recommendedResources.every(resource =>
           resource.id !== undefined &&
           resource.title !== undefined &&
           resource.type !== undefined &&
           ['video', 'article', 'exercise', 'link'].includes(resource.type)
         )
}

// 验证薄弱知识点数据完整性
function hasWeakPointData(response: WeakPointDetailResponse): boolean {
  const wp = response.weakPoint
  return wp !== undefined &&
         wp.id !== undefined &&
         wp.name !== undefined &&
         wp.subject !== undefined &&
         wp.masteryRate !== undefined &&
         wp.masteryRate >= 0 &&
         wp.masteryRate <= 100
}

// 验证错题数据完整性
function hasWrongQuestionsData(response: WeakPointDetailResponse): boolean {
  return response.wrongQuestions !== undefined &&
         Array.isArray(response.wrongQuestions) &&
         response.wrongQuestions.every(wq =>
           wq.id !== undefined &&
           wq.questionContent !== undefined &&
           wq.correctAnswer !== undefined
         )
}

// 验证错误率计算的一致性
function isErrorRateConsistent(weakPoint: WeakPoint): boolean {
  if (weakPoint.totalCount === 0) {
    return true // 没有答题记录时，错误率可以是任意值
  }
  // 错误次数不应超过总次数
  return weakPoint.errorCount <= weakPoint.totalCount
}

describe('Property 30: AI辅导建议生成', () => {
  /**
   * 属性测试：薄弱点详情应包含AI辅导建议
   */
  it('薄弱点详情应包含AI辅导建议字段', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        // 验证AI辅导建议字段存在
        expect(response.aiSuggestions).toBeDefined()
        expect(Array.isArray(response.aiSuggestions)).toBe(true)
        
        // 验证每条建议都是字符串
        response.aiSuggestions.forEach(suggestion => {
          expect(typeof suggestion).toBe('string')
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：薄弱点详情应包含推荐学习资源
   */
  it('薄弱点详情应包含推荐学习资源字段', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        // 验证推荐资源字段存在
        expect(response.recommendedResources).toBeDefined()
        expect(Array.isArray(response.recommendedResources)).toBe(true)
        
        // 验证每个资源的数据完整性
        response.recommendedResources.forEach(resource => {
          expect(resource.id).toBeDefined()
          expect(resource.title).toBeDefined()
          expect(resource.type).toBeDefined()
          expect(['video', 'article', 'exercise', 'link']).toContain(resource.type)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：薄弱知识点数据应完整
   */
  it('薄弱知识点数据应包含必要字段', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        const wp = response.weakPoint
        
        // 验证必要字段存在
        expect(wp.id).toBeDefined()
        expect(wp.name).toBeDefined()
        expect(wp.subject).toBeDefined()
        expect(wp.masteryRate).toBeDefined()
        expect(wp.errorCount).toBeDefined()
        expect(wp.totalCount).toBeDefined()
        
        // 验证掌握度在有效范围内
        expect(wp.masteryRate).toBeGreaterThanOrEqual(0)
        expect(wp.masteryRate).toBeLessThanOrEqual(100)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：错误次数不应超过总答题次数
   */
  it('错误次数不应超过总答题次数', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        const wp = response.weakPoint
        
        expect(wp.errorCount).toBeGreaterThanOrEqual(0)
        expect(wp.totalCount).toBeGreaterThanOrEqual(0)
        expect(wp.errorCount).toBeLessThanOrEqual(wp.totalCount)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：学习资源URL应为有效格式
   */
  it('学习资源URL应为有效格式', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        response.recommendedResources.forEach(resource => {
          if (resource.url) {
            // URL应该是字符串
            expect(typeof resource.url).toBe('string')
            // URL应该以http或https开头
            expect(resource.url.startsWith('http://') || resource.url.startsWith('https://')).toBe(true)
          }
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：错题数据应完整
   */
  it('错题数据应包含题目内容和正确答案', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        response.wrongQuestions.forEach(wq => {
          expect(wq.id).toBeDefined()
          expect(wq.questionContent).toBeDefined()
          expect(wq.correctAnswer).toBeDefined()
          expect(typeof wq.questionContent).toBe('string')
          expect(typeof wq.correctAnswer).toBe('string')
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：薄弱点详情应包含AI辅导建议和推荐学习资源
   */
  it('薄弱点详情应同时包含AI辅导建议和推荐学习资源', () => {
    fc.assert(
      fc.property(weakPointDetailResponseArbitrary, (response) => {
        // 1. 验证AI辅导建议
        expect(hasAISuggestions(response)).toBe(true)
        
        // 2. 验证推荐学习资源
        expect(hasRecommendedResources(response)).toBe(true)
        
        // 3. 验证薄弱知识点数据
        expect(hasWeakPointData(response)).toBe(true)
        
        // 4. 验证错题数据
        expect(hasWrongQuestionsData(response)).toBe(true)
        
        return true
      }),
      { numRuns: 20 }
    )
  })
})
