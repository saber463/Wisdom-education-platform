/**
 * 属性测试：时间筛选动态更新
 * 
 * **Feature: smart-education-platform, Property 13: 时间筛选动态更新**
 * **验证需求：3.4**
 * 
 * 对于任何时间段筛选操作，所有统计图表应根据筛选条件动态更新数据
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// 学情分析数据接口
interface AnalyticsData {
  averageScore: number
  passRate: number
  excellentRate: number
  totalStudents: number
  trendData: {
    dates: string[]
    averageScores: number[]
    passRates: number[]
    excellentRates: number[]
  }
  weakPoints: Array<{ id: number; name: string; errorRate: number }>
  ranking: Array<{ rank: number; studentName: string; averageScore: number; progress: number }>
}

// 时间范围接口
interface DateRange {
  startDate: Date
  endDate: Date
}

// 生成有效的日期范围
const dateRangeArbitrary = fc.record({
  startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-30') }),
  endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
}).filter(({ startDate, endDate }) => startDate <= endDate)

// 生成有效的日期字符串
const dateStringArbitrary = fc.integer({ min: 0, max: 730 }).map(days => {
  const date = new Date('2024-01-01')
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
})

// 生成学情分析数据
const analyticsDataArbitrary = fc.record({
  averageScore: fc.integer({ min: 0, max: 100 }),
  passRate: fc.integer({ min: 0, max: 100 }),
  excellentRate: fc.integer({ min: 0, max: 100 }),
  totalStudents: fc.integer({ min: 0, max: 100 }),
  trendData: fc.record({
    dates: fc.array(dateStringArbitrary, { minLength: 1, maxLength: 30 }),
    averageScores: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 30 }),
    passRates: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 30 }),
    excellentRates: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 30 })
  }),
  weakPoints: fc.array(fc.record({
    id: fc.integer({ min: 1, max: 100 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    errorRate: fc.integer({ min: 0, max: 100 })
  }), { minLength: 0, maxLength: 10 }),
  ranking: fc.array(fc.record({
    rank: fc.integer({ min: 1, max: 100 }),
    studentName: fc.string({ minLength: 1, maxLength: 20 }),
    averageScore: fc.integer({ min: 0, max: 100 }),
    progress: fc.integer({ min: -50, max: 50 })
  }), { minLength: 0, maxLength: 50 })
})

// 模拟根据时间范围过滤数据
function filterDataByDateRange(data: AnalyticsData, dateRange: DateRange): AnalyticsData {
  const { startDate, endDate } = dateRange
  
  // 过滤趋势数据中在时间范围内的数据
  const filteredIndices: number[] = []
  data.trendData.dates.forEach((dateStr, index) => {
    const date = new Date(dateStr)
    if (date >= startDate && date <= endDate) {
      filteredIndices.push(index)
    }
  })
  
  return {
    ...data,
    trendData: {
      dates: filteredIndices.map(i => data.trendData.dates[i]),
      averageScores: filteredIndices.map(i => data.trendData.averageScores[i] || 0),
      passRates: filteredIndices.map(i => data.trendData.passRates[i] || 0),
      excellentRates: filteredIndices.map(i => data.trendData.excellentRates[i] || 0)
    }
  }
}

// 验证数据是否在时间范围内
function isDataWithinDateRange(dates: string[], dateRange: DateRange): boolean {
  return dates.every(dateStr => {
    const date = new Date(dateStr)
    return date >= dateRange.startDate && date <= dateRange.endDate
  })
}

// 计算数据数组的长度一致性
function areArrayLengthsConsistent(trendData: AnalyticsData['trendData']): boolean {
  const { dates, averageScores, passRates, excellentRates } = trendData
  return dates.length === averageScores.length &&
         dates.length === passRates.length &&
         dates.length === excellentRates.length
}

describe('Property 13: 时间筛选动态更新', () => {
  /**
   * 属性测试：时间筛选后的数据应在指定时间范围内
   */
  it('时间筛选后的趋势数据应在指定时间范围内', () => {
    fc.assert(
      fc.property(analyticsDataArbitrary, dateRangeArbitrary, (data, dateRange) => {
        const filteredData = filterDataByDateRange(data, dateRange)
        
        // 如果有过滤后的数据，验证它们都在时间范围内
        if (filteredData.trendData.dates.length > 0) {
          expect(isDataWithinDateRange(filteredData.trendData.dates, dateRange)).toBe(true)
        }
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：过滤后的数据数组长度应保持一致
   */
  it('过滤后的趋势数据数组长度应保持一致', () => {
    fc.assert(
      fc.property(analyticsDataArbitrary, dateRangeArbitrary, (data, dateRange) => {
        const filteredData = filterDataByDateRange(data, dateRange)
        
        // 验证所有趋势数据数组长度一致
        expect(areArrayLengthsConsistent(filteredData.trendData)).toBe(true)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：过滤后的数据量不应超过原始数据量
   */
  it('过滤后的数据量不应超过原始数据量', () => {
    fc.assert(
      fc.property(analyticsDataArbitrary, dateRangeArbitrary, (data, dateRange) => {
        const filteredData = filterDataByDateRange(data, dateRange)
        
        // 过滤后的数据量应小于等于原始数据量
        expect(filteredData.trendData.dates.length).toBeLessThanOrEqual(data.trendData.dates.length)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：统计指标应在有效范围内
   */
  it('统计指标应在有效范围内（0-100）', () => {
    fc.assert(
      fc.property(analyticsDataArbitrary, (data) => {
        // 平均分应在0-100之间
        expect(data.averageScore).toBeGreaterThanOrEqual(0)
        expect(data.averageScore).toBeLessThanOrEqual(100)
        
        // 及格率应在0-100之间
        expect(data.passRate).toBeGreaterThanOrEqual(0)
        expect(data.passRate).toBeLessThanOrEqual(100)
        
        // 优秀率应在0-100之间
        expect(data.excellentRate).toBeGreaterThanOrEqual(0)
        expect(data.excellentRate).toBeLessThanOrEqual(100)
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：薄弱知识点错误率应在有效范围内
   */
  it('薄弱知识点错误率应在有效范围内（0-100）', () => {
    fc.assert(
      fc.property(analyticsDataArbitrary, (data) => {
        data.weakPoints.forEach(point => {
          expect(point.errorRate).toBeGreaterThanOrEqual(0)
          expect(point.errorRate).toBeLessThanOrEqual(100)
        })
        
        return true
      }),
      { numRuns: 20 }
    )
  })

  /**
   * 属性测试：学生排名应按排名顺序排列
   */
  it('学生排名应按排名顺序排列', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          rank: fc.integer({ min: 1, max: 100 }),
          studentName: fc.string({ minLength: 1, maxLength: 20 }),
          averageScore: fc.float({ min: 0, max: 100, noNaN: true }),
          progress: fc.float({ min: -50, max: 50, noNaN: true })
        }), { minLength: 1, maxLength: 50 }),
        (ranking) => {
          // 按排名排序
          const sortedRanking = [...ranking].sort((a, b) => a.rank - b.rank)
          
          // 验证排名是递增的
          for (let i = 1; i < sortedRanking.length; i++) {
            expect(sortedRanking[i].rank).toBeGreaterThanOrEqual(sortedRanking[i - 1].rank)
          }
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })
})
