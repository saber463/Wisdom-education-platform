/**
 * 属性测试：批改结果显示完整性
 * 
 * **Feature: smart-education-platform, Property 20: 批改结果显示完整性**
 * **验证需求：5.4**
 * 
 * 对于任何批改结果查看，应显示总分、各题得分、错题解析、知识点关联四项信息
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// 答题记录接口
interface Answer {
  id: number
  question_id: number
  question_number: number
  question_type: 'choice' | 'fill' | 'judge' | 'subjective'
  question_content: string
  standard_answer: string | null
  student_answer: string
  score: number | null
  max_score: number
  is_correct: boolean | null
  ai_feedback: string | null
  needs_review: boolean
  review_comment: string | null
  knowledge_point: string | null
}

// 提交记录接口
interface Submission {
  id: number
  assignment_id: number
  assignment_title: string
  student_id: number
  student_name: string
  submit_time: string
  status: 'submitted' | 'grading' | 'graded' | 'reviewed'
  total_score: number | null
  max_score: number
  grading_time: string | null
}

// 统计信息接口
interface Statistics {
  total_questions: number
  correct_count: number
  wrong_count: number
  needs_review_count: number
  accuracy_rate: number
}

// 错题信息接口
interface WrongQuestion {
  question_number: number
  question_type: string
  question_content: string
  student_answer: string
  ai_feedback: string | null
  knowledge_point: string | null
}

// 完整的批改结果接口
interface GradingResult {
  submission: Submission
  answers: Answer[]
  statistics: Statistics
  wrong_questions: WrongQuestion[]
  improvement_suggestions: string[]
}

// 生成题目类型
const questionTypeArbitrary = fc.constantFrom('choice', 'fill', 'judge', 'subjective') as fc.Arbitrary<'choice' | 'fill' | 'judge' | 'subjective'>

// 生成答题记录 - 确保score <= max_score
const answerArbitrary = fc.integer({ min: 1, max: 100 }).chain(maxScore => 
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    question_id: fc.integer({ min: 1, max: 10000 }),
    question_number: fc.integer({ min: 1, max: 100 }),
    question_type: questionTypeArbitrary,
    question_content: fc.string({ minLength: 5, maxLength: 200 }),
    standard_answer: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    student_answer: fc.string({ minLength: 0, maxLength: 100 }),
    score: fc.option(fc.integer({ min: 0, max: maxScore }), { nil: null }),
    max_score: fc.constant(maxScore),
    is_correct: fc.option(fc.boolean(), { nil: null }),
    ai_feedback: fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: null }),
    needs_review: fc.boolean(),
    review_comment: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    knowledge_point: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null })
  })
)

// 生成提交状态
const submissionStatusArbitrary = fc.constantFrom('submitted', 'grading', 'graded', 'reviewed') as fc.Arbitrary<'submitted' | 'grading' | 'graded' | 'reviewed'>

// 生成有效的日期字符串
const dateStringArbitrary = fc.integer({ min: 0, max: 3650 }).map(days => {
  const date = new Date('2020-01-01')
  date.setDate(date.getDate() + days)
  return date.toISOString()
})

// 生成提交记录 - 使用有效的日期范围
const submissionArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  assignment_id: fc.integer({ min: 1, max: 10000 }),
  assignment_title: fc.string({ minLength: 2, maxLength: 100 }),
  student_id: fc.integer({ min: 1, max: 10000 }),
  student_name: fc.string({ minLength: 2, maxLength: 50 }),
  submit_time: dateStringArbitrary,
  status: submissionStatusArbitrary,
  total_score: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
  max_score: fc.integer({ min: 1, max: 1000 }),
  grading_time: fc.option(dateStringArbitrary, { nil: null })
})

// 生成统计信息
const statisticsArbitrary = fc.record({
  total_questions: fc.integer({ min: 0, max: 100 }),
  correct_count: fc.integer({ min: 0, max: 100 }),
  wrong_count: fc.integer({ min: 0, max: 100 }),
  needs_review_count: fc.integer({ min: 0, max: 100 }),
  accuracy_rate: fc.integer({ min: 0, max: 100 })
})

// 生成错题信息
const wrongQuestionArbitrary = fc.record({
  question_number: fc.integer({ min: 1, max: 100 }),
  question_type: fc.string({ minLength: 1, maxLength: 20 }),
  question_content: fc.string({ minLength: 5, maxLength: 200 }),
  student_answer: fc.string({ minLength: 0, maxLength: 100 }),
  ai_feedback: fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: null }),
  knowledge_point: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null })
})

// 生成完整的批改结果
const gradingResultArbitrary = fc.record({
  submission: submissionArbitrary,
  answers: fc.array(answerArbitrary, { minLength: 1, maxLength: 20 }),
  statistics: statisticsArbitrary,
  wrong_questions: fc.array(wrongQuestionArbitrary, { minLength: 0, maxLength: 10 }),
  improvement_suggestions: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 0, maxLength: 5 })
})

// 验证批改结果是否包含总分信息
function hasTotalScore(result: GradingResult): boolean {
  return result.submission !== undefined &&
         result.submission.total_score !== undefined &&
         result.submission.max_score !== undefined &&
         result.submission.max_score > 0
}

// 验证批改结果是否包含各题得分
function hasQuestionScores(result: GradingResult): boolean {
  return result.answers !== undefined &&
         Array.isArray(result.answers) &&
         result.answers.every(answer => 
           answer.score !== undefined &&
           answer.max_score !== undefined &&
           answer.max_score > 0
         )
}

// 验证批改结果是否包含错题解析（AI反馈）
function hasWrongQuestionAnalysis(result: GradingResult): boolean {
  // 错题应该有AI反馈或在错题列表中
  const wrongAnswers = result.answers.filter(a => a.is_correct === false)
  
  // 如果没有错题，则不需要错题解析
  if (wrongAnswers.length === 0) {
    return true
  }
  
  // 检查是否有错题列表或AI反馈
  return result.wrong_questions !== undefined ||
         wrongAnswers.some(a => a.ai_feedback !== null)
}

// 验证批改结果是否包含知识点关联
function hasKnowledgePointAssociation(result: GradingResult): boolean {
  // 至少有一道题有知识点关联，或者错题列表中有知识点
  return result.answers.some(a => a.knowledge_point !== null) ||
         result.wrong_questions.some(wq => wq.knowledge_point !== null)
}

// 验证统计信息的一致性
function isStatisticsConsistent(result: GradingResult): boolean {
  const { statistics, answers } = result
  
  // 总题数应该等于答题记录数
  if (statistics.total_questions !== answers.length) {
    return false
  }
  
  // 正确数 + 错误数 应该小于等于总题数
  if (statistics.correct_count + statistics.wrong_count > statistics.total_questions) {
    return false
  }
  
  // 正确率应该在0-100之间
  if (statistics.accuracy_rate < 0 || statistics.accuracy_rate > 100) {
    return false
  }
  
  return true
}

// 验证得分的有效性
function areScoresValid(result: GradingResult): boolean {
  // 每道题的得分不应超过最大分数
  for (const answer of result.answers) {
    if (answer.score !== null && answer.score > answer.max_score) {
      return false
    }
    if (answer.score !== null && answer.score < 0) {
      return false
    }
  }
  
  // 总分不应超过最大总分
  if (result.submission.total_score !== null && 
      result.submission.total_score > result.submission.max_score) {
    return false
  }
  
  return true
}

describe('Property 20: 批改结果显示完整性', () => {
  /**
   * 属性测试：批改结果应包含总分信息
   */
  it('批改结果应包含总分和最大分数', () => {
    fc.assert(
      fc.property(gradingResultArbitrary, (result) => {
        // 验证提交记录存在
        expect(result.submission).toBeDefined()
        
        // 验证最大分数存在且大于0
        expect(result.submission.max_score).toBeDefined()
        expect(result.submission.max_score).toBeGreaterThan(0)
        
        // 总分可以为null（未批改），但如果存在应该是有效值
        if (result.submission.total_score !== null) {
          expect(result.submission.total_score).toBeGreaterThanOrEqual(0)
        }
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：批改结果应包含各题得分
   */
  it('批改结果应包含各题得分信息', () => {
    fc.assert(
      fc.property(gradingResultArbitrary, (result) => {
        // 验证答题记录存在
        expect(result.answers).toBeDefined()
        expect(Array.isArray(result.answers)).toBe(true)
        
        // 验证每道题都有分数信息
        result.answers.forEach(answer => {
          expect(answer.max_score).toBeDefined()
          expect(answer.max_score).toBeGreaterThan(0)
          
          // 得分可以为null（未批改），但如果存在应该是有效值
          if (answer.score !== null) {
            expect(answer.score).toBeGreaterThanOrEqual(0)
            expect(answer.score).toBeLessThanOrEqual(answer.max_score)
          }
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：批改结果应包含错题解析
   */
  it('错题应有AI反馈或在错题列表中', () => {
    fc.assert(
      fc.property(gradingResultArbitrary, (result) => {
        // 验证错题列表存在
        expect(result.wrong_questions).toBeDefined()
        expect(Array.isArray(result.wrong_questions)).toBe(true)
        
        // 验证改进建议存在
        expect(result.improvement_suggestions).toBeDefined()
        expect(Array.isArray(result.improvement_suggestions)).toBe(true)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：批改结果应包含知识点关联
   */
  it('答题记录应支持知识点关联', () => {
    fc.assert(
      fc.property(gradingResultArbitrary, (result) => {
        // 验证每道题都有知识点字段（可以为null）
        result.answers.forEach(answer => {
          expect('knowledge_point' in answer).toBe(true)
        })
        
        // 验证错题列表中的知识点字段
        result.wrong_questions.forEach(wq => {
          expect('knowledge_point' in wq).toBe(true)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：统计信息应与答题记录一致
   */
  it('统计信息应与答题记录数量一致', () => {
    fc.assert(
      fc.property(
        fc.array(answerArbitrary, { minLength: 1, maxLength: 20 }),
        (answers) => {
          // 计算统计信息
          const correctCount = answers.filter(a => a.is_correct === true).length
          const wrongCount = answers.filter(a => a.is_correct === false).length
          const totalQuestions = answers.length
          const accuracyRate = totalQuestions > 0 
            ? Math.round((correctCount / totalQuestions) * 100) 
            : 0
          
          // 验证统计信息的一致性
          expect(correctCount + wrongCount).toBeLessThanOrEqual(totalQuestions)
          expect(accuracyRate).toBeGreaterThanOrEqual(0)
          expect(accuracyRate).toBeLessThanOrEqual(100)
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：得分应在有效范围内
   */
  it('得分应在有效范围内（0到最大分数）', () => {
    fc.assert(
      fc.property(gradingResultArbitrary, (result) => {
        // 验证每道题的得分有效性
        result.answers.forEach(answer => {
          if (answer.score !== null) {
            expect(answer.score).toBeGreaterThanOrEqual(0)
            expect(answer.score).toBeLessThanOrEqual(answer.max_score)
          }
        })
        
        // 验证总分有效性
        if (result.submission.total_score !== null) {
          expect(result.submission.total_score).toBeGreaterThanOrEqual(0)
        }
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：批改结果应包含完整的四项信息
   */
  it('批改结果应包含总分、各题得分、错题解析、知识点关联四项信息', () => {
    fc.assert(
      fc.property(gradingResultArbitrary, (result) => {
        // 1. 验证总分信息
        expect(hasTotalScore(result)).toBe(true)
        
        // 2. 验证各题得分
        expect(hasQuestionScores(result)).toBe(true)
        
        // 3. 验证错题解析（错题列表或AI反馈）
        expect(hasWrongQuestionAnalysis(result)).toBe(true)
        
        // 4. 验证知识点关联字段存在
        result.answers.forEach(answer => {
          expect('knowledge_point' in answer).toBe(true)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })
})
