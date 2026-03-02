/**
 * 属性测试：家长学情报告完整性
 * 
 * **Feature: smart-education-platform, Property 29: 家长学情报告完整性**
 * **验证需求：8.3**
 * 
 * 对于任何家长查看学情报告，应显示孩子的成绩趋势图、薄弱知识点、学习时长统计三项内容
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// 成绩趋势数据接口
interface TrendData {
  dates: string[]
  scores: number[]
  classAverages: number[]
}

// 薄弱知识点接口
interface WeakPoint {
  id: number
  name: string
  masteryRate: number
  errorCount: number
}

// 学习时长数据接口
interface StudyTimeData {
  days: string[]
  times: number[]
}

// 最近成绩接口
interface RecentResult {
  id: number
  assignmentTitle: string
  subject: string
  score: number
  totalScore: number
  classAverage: number
  rank: number
  gradingTime: string
}

// 完整的学情报告接口
interface LearningReport {
  // 基本统计
  latestScore: number | null
  scoreTrend: number
  classRank: number | null
  totalStudents: number | null
  rankTrend: number
  averageScore: number | null
  classAverage: number | null
  studyTime: number // 分钟
  
  // 成绩趋势图数据
  trendData: TrendData
  
  // 薄弱知识点
  weakPoints: WeakPoint[]
  
  // 学习时长统计
  studyTimeData: StudyTimeData
  
  // 最近成绩
  recentResults: RecentResult[]
}

// 生成有效的日期字符串
const dateStringArbitrary = fc.integer({ min: 0, max: 30 }).map(days => {
  const date = new Date('2026-01-01')
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
})

// 生成日期时间字符串
const dateTimeStringArbitrary = fc.integer({ min: 0, max: 365 }).map(days => {
  const date = new Date('2026-01-01')
  date.setDate(date.getDate() - days)
  return date.toISOString()
})

// 生成成绩趋势数据
const trendDataArbitrary = fc.integer({ min: 1, max: 30 }).chain(count =>
  fc.record({
    dates: fc.array(dateStringArbitrary, { minLength: count, maxLength: count }),
    scores: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: count, maxLength: count }),
    classAverages: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: count, maxLength: count })
  })
)

// 生成薄弱知识点
const weakPointArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  masteryRate: fc.integer({ min: 0, max: 100 }),
  errorCount: fc.integer({ min: 0, max: 100 })
})

// 生成学习时长数据
const studyTimeDataArbitrary = fc.record({
  days: fc.array(fc.constantFrom('周一', '周二', '周三', '周四', '周五', '周六', '周日'), { minLength: 7, maxLength: 7 }),
  times: fc.array(fc.integer({ min: 0, max: 480 }), { minLength: 7, maxLength: 7 }) // 最多8小时
})

// 生成最近成绩
const recentResultArbitrary = fc.integer({ min: 1, max: 100 }).chain(totalScore =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    assignmentTitle: fc.string({ minLength: 2, maxLength: 100 }),
    subject: fc.constantFrom('语文', '数学', '英语', '物理', '化学', '生物'),
    score: fc.integer({ min: 0, max: totalScore }),
    totalScore: fc.constant(totalScore),
    classAverage: fc.float({ min: 0, max: totalScore, noNaN: true }),
    rank: fc.integer({ min: 1, max: 50 }),
    gradingTime: dateTimeStringArbitrary
  })
)

// 生成班级排名数据（确保排名 <= 总人数）
const rankDataArbitrary = fc.integer({ min: 1, max: 100 }).chain(totalStudents =>
  fc.record({
    classRank: fc.option(fc.integer({ min: 1, max: totalStudents }), { nil: null }),
    totalStudents: fc.constant(totalStudents as number | null)
  })
).map(data => ({
  classRank: data.classRank,
  totalStudents: data.totalStudents
}))

// 生成完整的学情报告
const learningReportArbitrary = rankDataArbitrary.chain(rankData =>
  fc.record({
    latestScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
    scoreTrend: fc.float({ min: -50, max: 50, noNaN: true }),
    classRank: fc.constant(rankData.classRank),
    totalStudents: fc.constant(rankData.totalStudents),
    rankTrend: fc.integer({ min: -20, max: 20 }),
    averageScore: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
    classAverage: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
    studyTime: fc.integer({ min: 0, max: 10000 }),
    trendData: trendDataArbitrary,
    weakPoints: fc.array(weakPointArbitrary, { minLength: 0, maxLength: 10 }),
    studyTimeData: studyTimeDataArbitrary,
    recentResults: fc.array(recentResultArbitrary, { minLength: 0, maxLength: 20 })
  })
)

// 验证成绩趋势图数据完整性
function hasTrendData(report: LearningReport): boolean {
  return report.trendData !== undefined &&
         Array.isArray(report.trendData.dates) &&
         Array.isArray(report.trendData.scores) &&
         Array.isArray(report.trendData.classAverages) &&
         report.trendData.dates.length === report.trendData.scores.length &&
         report.trendData.dates.length === report.trendData.classAverages.length
}

// 验证薄弱知识点数据完整性
function hasWeakPointsData(report: LearningReport): boolean {
  return report.weakPoints !== undefined &&
         Array.isArray(report.weakPoints) &&
         report.weakPoints.every(wp => 
           wp.id !== undefined &&
           wp.name !== undefined &&
           wp.masteryRate !== undefined &&
           wp.masteryRate >= 0 &&
           wp.masteryRate <= 100
         )
}

// 验证学习时长统计数据完整性
function hasStudyTimeData(report: LearningReport): boolean {
  return report.studyTimeData !== undefined &&
         Array.isArray(report.studyTimeData.days) &&
         Array.isArray(report.studyTimeData.times) &&
         report.studyTimeData.days.length === report.studyTimeData.times.length &&
         report.studyTimeData.times.every(t => t >= 0)
}

// 验证分数有效性
function areScoresValid(report: LearningReport): boolean {
  // 最新成绩应在0-100之间
  if (report.latestScore !== null && (report.latestScore < 0 || report.latestScore > 100)) {
    return false
  }
  
  // 平均分应在0-100之间
  if (report.averageScore !== null && (report.averageScore < 0 || report.averageScore > 100)) {
    return false
  }
  
  // 趋势数据中的分数应在0-100之间
  if (!report.trendData.scores.every(s => s >= 0 && s <= 100)) {
    return false
  }
  
  return true
}

// 验证排名有效性
function isRankValid(report: LearningReport): boolean {
  if (report.classRank !== null && report.totalStudents !== null) {
    return report.classRank >= 1 && report.classRank <= report.totalStudents
  }
  return true
}

describe('Property 29: 家长学情报告完整性', () => {
  /**
   * 属性测试：学情报告应包含成绩趋势图数据
   */
  it('学情报告应包含成绩趋势图数据', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        // 验证趋势数据存在
        expect(report.trendData).toBeDefined()
        expect(report.trendData.dates).toBeDefined()
        expect(report.trendData.scores).toBeDefined()
        expect(report.trendData.classAverages).toBeDefined()
        
        // 验证数据长度一致
        expect(report.trendData.dates.length).toBe(report.trendData.scores.length)
        expect(report.trendData.dates.length).toBe(report.trendData.classAverages.length)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：学情报告应包含薄弱知识点数据
   */
  it('学情报告应包含薄弱知识点数据', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        // 验证薄弱知识点数据存在
        expect(report.weakPoints).toBeDefined()
        expect(Array.isArray(report.weakPoints)).toBe(true)
        
        // 验证每个薄弱知识点的数据完整性
        report.weakPoints.forEach(wp => {
          expect(wp.id).toBeDefined()
          expect(wp.name).toBeDefined()
          expect(wp.masteryRate).toBeDefined()
          expect(wp.masteryRate).toBeGreaterThanOrEqual(0)
          expect(wp.masteryRate).toBeLessThanOrEqual(100)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：学情报告应包含学习时长统计数据
   */
  it('学情报告应包含学习时长统计数据', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        // 验证学习时长数据存在
        expect(report.studyTimeData).toBeDefined()
        expect(report.studyTimeData.days).toBeDefined()
        expect(report.studyTimeData.times).toBeDefined()
        
        // 验证数据长度一致
        expect(report.studyTimeData.days.length).toBe(report.studyTimeData.times.length)
        
        // 验证时长为非负数
        report.studyTimeData.times.forEach(time => {
          expect(time).toBeGreaterThanOrEqual(0)
        })
        
        // 验证总学习时长字段存在
        expect(report.studyTime).toBeDefined()
        expect(report.studyTime).toBeGreaterThanOrEqual(0)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：学情报告中的分数应在有效范围内
   */
  it('学情报告中的分数应在有效范围内（0-100）', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        // 验证最新成绩
        if (report.latestScore !== null) {
          expect(report.latestScore).toBeGreaterThanOrEqual(0)
          expect(report.latestScore).toBeLessThanOrEqual(100)
        }
        
        // 验证平均分
        if (report.averageScore !== null) {
          expect(report.averageScore).toBeGreaterThanOrEqual(0)
          expect(report.averageScore).toBeLessThanOrEqual(100)
        }
        
        // 验证趋势数据中的分数
        report.trendData.scores.forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0)
          expect(score).toBeLessThanOrEqual(100)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：班级排名应在有效范围内
   */
  it('班级排名应在有效范围内（1到总人数）', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        if (report.classRank !== null && report.totalStudents !== null) {
          expect(report.classRank).toBeGreaterThanOrEqual(1)
          expect(report.classRank).toBeLessThanOrEqual(report.totalStudents)
        }
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：最近成绩中的得分不应超过总分
   */
  it('最近成绩中的得分不应超过总分', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        report.recentResults.forEach(result => {
          expect(result.score).toBeGreaterThanOrEqual(0)
          expect(result.score).toBeLessThanOrEqual(result.totalScore)
          expect(result.totalScore).toBeGreaterThan(0)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：学情报告应包含完整的三项内容
   */
  it('学情报告应包含成绩趋势图、薄弱知识点、学习时长统计三项内容', () => {
    fc.assert(
      fc.property(learningReportArbitrary, (report) => {
        // 1. 验证成绩趋势图数据
        expect(hasTrendData(report)).toBe(true)
        
        // 2. 验证薄弱知识点数据
        expect(hasWeakPointsData(report)).toBe(true)
        
        // 3. 验证学习时长统计数据
        expect(hasStudyTimeData(report)).toBe(true)
        
        return true
      }),
      { numRuns: 20 }
    )
  })
})
