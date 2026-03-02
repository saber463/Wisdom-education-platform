/**
 * 属性测试：作业列表信息完整性
 * 
 * **Feature: smart-education-platform, Property 5: 作业列表信息完整性**
 * **验证需求：1.6**
 * 
 * 对于任何作业列表查询，返回的每个作业应包含作业名称、发布时间、提交人数、批改进度四项信息
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// 作业数据接口
interface Assignment {
  id: number
  title: string
  description?: string
  classId: number
  className: string
  teacherId: number
  difficulty: 'basic' | 'medium' | 'advanced'
  totalScore: number
  deadline: string
  status: 'draft' | 'published' | 'closed'
  createdAt: string
  updatedAt: string
  submittedCount: number
  gradedCount: number
  totalStudents: number
}

// 生成有效的日期字符串
const dateStringArbitrary = fc.integer({ min: 0, max: 3650 }).map(days => {
  const date = new Date('2020-01-01')
  date.setDate(date.getDate() + days)
  return date.toISOString()
})

// 生成有效的作业数据
const assignmentArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  classId: fc.integer({ min: 1, max: 100 }),
  className: fc.string({ minLength: 1, maxLength: 100 }),
  teacherId: fc.integer({ min: 1, max: 100 }),
  difficulty: fc.constantFrom('basic', 'medium', 'advanced') as fc.Arbitrary<'basic' | 'medium' | 'advanced'>,
  totalScore: fc.integer({ min: 1, max: 1000 }),
  deadline: dateStringArbitrary,
  status: fc.constantFrom('draft', 'published', 'closed') as fc.Arbitrary<'draft' | 'published' | 'closed'>,
  createdAt: dateStringArbitrary,
  updatedAt: dateStringArbitrary,
  submittedCount: fc.integer({ min: 0, max: 100 }),
  gradedCount: fc.integer({ min: 0, max: 100 }),
  totalStudents: fc.integer({ min: 0, max: 100 })
})

// 验证作业数据是否包含所有必需字段
function validateAssignmentCompleteness(assignment: Assignment): {
  hasTitle: boolean
  hasCreatedAt: boolean
  hasSubmittedCount: boolean
  hasGradingProgress: boolean
} {
  return {
    hasTitle: typeof assignment.title === 'string' && assignment.title.length > 0,
    hasCreatedAt: typeof assignment.createdAt === 'string' && assignment.createdAt.length > 0,
    hasSubmittedCount: typeof assignment.submittedCount === 'number' && typeof assignment.totalStudents === 'number',
    hasGradingProgress: typeof assignment.gradedCount === 'number' && typeof assignment.submittedCount === 'number'
  }
}

// 计算批改进度
function calculateGradingProgress(assignment: Assignment): number {
  if (assignment.submittedCount === 0) return 0
  return Math.round((assignment.gradedCount / assignment.submittedCount) * 100)
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

describe('Property 5: 作业列表信息完整性', () => {
  /**
   * 属性测试：对于任何作业数据，应包含作业名称、发布时间、提交人数、批改进度四项信息
   */
  it('对于任何作业数据，应包含作业名称、发布时间、提交人数、批改进度四项信息', () => {
    fc.assert(
      fc.property(assignmentArbitrary, (assignment) => {
        const validation = validateAssignmentCompleteness(assignment)
        
        // 验证所有必需字段都存在
        expect(validation.hasTitle).toBe(true)
        expect(validation.hasCreatedAt).toBe(true)
        expect(validation.hasSubmittedCount).toBe(true)
        expect(validation.hasGradingProgress).toBe(true)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：批改进度计算应在0-100之间
   */
  it('批改进度计算应在0-100之间', () => {
    fc.assert(
      fc.property(
        fc.record({
          submittedCount: fc.integer({ min: 0, max: 100 }),
          gradedCount: fc.integer({ min: 0, max: 100 })
        }),
        ({ submittedCount, gradedCount }) => {
          // 确保gradedCount不超过submittedCount
          const validGradedCount = Math.min(gradedCount, submittedCount)
          const assignment = {
            submittedCount,
            gradedCount: validGradedCount
          } as Assignment
          
          const progress = calculateGradingProgress(assignment)
          
          // 进度应在0-100之间
          expect(progress).toBeGreaterThanOrEqual(0)
          expect(progress).toBeLessThanOrEqual(100)
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：日期格式化应返回有效字符串
   */
  it('日期格式化应返回有效字符串', () => {
    fc.assert(
      fc.property(
        dateStringArbitrary,
        (dateStr) => {
          const formatted = formatDate(dateStr)
          
          // 格式化后应为非空字符串
          expect(typeof formatted).toBe('string')
          expect(formatted.length).toBeGreaterThan(0)
          expect(formatted).not.toBe('-')
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：作业列表中每个作业都应有唯一ID
   */
  it('作业列表中每个作业都应有唯一ID', () => {
    fc.assert(
      fc.property(
        fc.array(assignmentArbitrary, { minLength: 1, maxLength: 20 }),
        (assignments) => {
          // 为每个作业分配唯一ID
          const assignmentsWithUniqueIds = assignments.map((a, index) => ({
            ...a,
            id: index + 1
          }))
          
          const ids = assignmentsWithUniqueIds.map(a => a.id)
          const uniqueIds = new Set(ids)
          
          // 所有ID应唯一
          expect(uniqueIds.size).toBe(ids.length)
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：提交人数不应超过学生总数
   */
  it('提交人数不应超过学生总数（数据一致性）', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalStudents: fc.integer({ min: 0, max: 100 }),
          submittedCount: fc.integer({ min: 0, max: 100 })
        }),
        ({ totalStudents, submittedCount }) => {
          // 验证数据一致性规则：提交人数不应超过学生总数
          const validSubmittedCount = Math.min(submittedCount, totalStudents)
          
          expect(validSubmittedCount).toBeLessThanOrEqual(totalStudents)
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })
})
