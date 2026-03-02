/**
 * gRPC客户端模块
 * 提供与Python AI服务和Rust服务的通信接口
 * 实现自动重试机制和服务降级
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isAIServiceAvailable,
  getDegradedOCRResponse,
  getDegradedGradingResponse,
  getDegradedQAResponse,
  getDegradedRecommendationResponse,
  getDegradedLearningAnalysisResponse,
  recordAIRequest
} from './ai-service-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 重试配置
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 通用重试包装器
async function withRetry<T>(
  operation: () => Promise<T>,
  serviceName: string,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.warn(
        `${serviceName}调用失败，${RETRY_DELAY_MS}ms后进行第${retryCount + 1}次重试...`
      );
      await delay(RETRY_DELAY_MS);
      return withRetry(operation, serviceName, retryCount + 1);
    } else {
      console.error(`${serviceName}调用失败，已重试${MAX_RETRY_ATTEMPTS}次:`, error);
      throw new Error(
        `${serviceName}调用失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// ==================== Python AI服务客户端 ====================

// 加载AI服务proto文件
const AI_PROTO_PATH = path.resolve(__dirname, '../../../python-ai/protos/ai_service.proto');
const aiPackageDefinition = protoLoader.loadSync(AI_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const aiProto = grpc.loadPackageDefinition(aiPackageDefinition) as any;

// 创建AI服务客户端
const AI_SERVICE_ADDRESS = process.env.AI_SERVICE_ADDRESS || 'localhost:50051';
const aiClient = new aiProto.ai_service.AIGradingService(
  AI_SERVICE_ADDRESS,
  grpc.credentials.createInsecure()
);

/**
 * OCR文字识别
 * @param imageData 图片数据（Buffer）
 * @param format 图片格式（jpg/png/pdf）
 * @returns 识别的文本和置信度
 */
export async function recognizeText(
  imageData: Buffer,
  format: string
): Promise<{ text: string; confidence: number }> {
  // 检查AI服务是否可用
  if (!isAIServiceAvailable()) {
    return getDegradedOCRResponse();
  }

  try {
    const result = await withRetry(
      () =>
        new Promise<{ text: string; confidence: number }>((resolve, reject) => {
          aiClient.RecognizeText(
            { image_data: imageData, format },
            (error: Error | null, response: any) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  text: response.text,
                  confidence: response.confidence
                });
              }
            }
          );
        }),
      'Python AI服务 - OCR识别'
    );
    recordAIRequest(true);
    return result as { text: string; confidence: number };
  } catch (error) {
    recordAIRequest(false);
    console.error('OCR识别失败，返回降级响应:', error);
    return getDegradedOCRResponse();
  }
}

/**
 * 主观题评分
 * @param question 题目
 * @param studentAnswer 学生答案
 * @param standardAnswer 标准答案
 * @param maxScore 最高分
 * @returns 评分结果
 */
export async function gradeSubjective(
  question: string,
  studentAnswer: string,
  standardAnswer: string,
  maxScore: number
): Promise<{ score: number; feedback: string; keyPoints: string[] }> {
  // 检查AI服务是否可用
  if (!isAIServiceAvailable()) {
    return getDegradedGradingResponse(maxScore);
  }

  try {
    const result = await withRetry(
      () =>
        new Promise((resolve, reject) => {
          aiClient.GradeSubjective(
            {
              question,
              student_answer: studentAnswer,
              standard_answer: standardAnswer,
              max_score: maxScore
            },
            (error: Error | null, response: any) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  score: response.score,
                  feedback: response.feedback,
                  keyPoints: response.key_points || []
                });
              }
            }
          );
        }),
      'Python AI服务 - 主观题评分'
    );
    recordAIRequest(true);
    return result as { score: number; feedback: string; keyPoints: string[] };
  } catch (error) {
    recordAIRequest(false);
    console.error('主观题评分失败，返回降级响应:', error);
    return getDegradedGradingResponse(maxScore);
  }
}

/**
 * AI答疑
 * @param question 问题
 * @param context 上下文
 * @returns 答案、解题步骤和相关例题
 */
export async function answerQuestion(
  question: string,
  context: string = ''
): Promise<{ answer: string; steps: string[]; relatedExamples: string[] }> {
  // 检查AI服务是否可用
  if (!isAIServiceAvailable()) {
    return getDegradedQAResponse();
  }

  try {
    const result = await withRetry(
      () =>
        new Promise((resolve, reject) => {
          aiClient.AnswerQuestion(
            { question, context },
            (error: Error | null, response: any) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  answer: response.answer,
                  steps: response.steps || [],
                  relatedExamples: response.related_examples || []
                });
              }
            }
          );
        }),
      'Python AI服务 - AI答疑'
    );
    recordAIRequest(true);
    return result as { answer: string; steps: string[]; relatedExamples: string[] };
  } catch (error) {
    recordAIRequest(false);
    console.error('AI答疑失败，返回降级响应:', error);
    return getDegradedQAResponse();
  }
}

/**
 * 个性化推荐
 * @param studentId 学生ID
 * @param weakPointIds 薄弱知识点ID列表
 * @param count 推荐数量
 * @returns 推荐练习题列表
 */
export async function recommendExercises(
  studentId: number,
  weakPointIds: number[],
  count: number = 10
): Promise<Array<{
  id: number;
  title: string;
  difficulty: string;
  knowledgePointId: number;
}>> {
  // 检查AI服务是否可用
  if (!isAIServiceAvailable()) {
    return getDegradedRecommendationResponse();
  }

  try {
    const result = await withRetry(
      () =>
        new Promise((resolve, reject) => {
          aiClient.RecommendExercises(
            {
              student_id: studentId,
              weak_point_ids: weakPointIds,
              count
            },
            (error: Error | null, response: any) => {
              if (error) {
                reject(error);
              } else {
                const exercises = (response.exercises || []).map((ex: any) => ({
                  id: ex.id,
                  title: ex.title,
                  difficulty: ex.difficulty,
                  knowledgePointId: ex.knowledge_point_id
                }));
                resolve(exercises);
              }
            }
          );
        }),
      'Python AI服务 - 个性化推荐'
    );
    recordAIRequest(true);
    return result as { id: number; title: string; difficulty: string; knowledgePointId: number; }[];
  } catch (error) {
    recordAIRequest(false);
    console.error('个性化推荐失败，返回降级响应:', error);
    return getDegradedRecommendationResponse();
  }
}

/**
 * 学情分析（BERT模型）
 * @param userId 用户ID
 * @param userType 用户类型（student/class/parent）
 * @param learningPaths 学习路径数据
 * @param errorBooks 错题本数据
 * @param answerSpeeds 答题速度数据
 * @returns BERT分析结果
 */
export async function analyzeLearningStatus(
  userId: number,
  userType: string,
  learningPaths: Array<{
    knowledgePointId: number;
    knowledgePointName: string;
    completedCount: number;
    totalCount: number;
  }>,
  errorBooks: Array<{
    knowledgePointId: number;
    knowledgePointName: string;
    errorCount: number;
    totalCount: number;
  }>,
  answerSpeeds: Array<{
    questionId: number;
    timeSpentSeconds: number;
    expectedTimeSeconds: number;
  }>
): Promise<{
  knowledgePointScores: Array<{
    knowledgePointId: number;
    knowledgePointName: string;
    masteryScore: number;
    status: string;
  }>;
  aiSuggestions: string[];
  overallMasteryScore: number;
}> {
  // 检查AI服务是否可用
  if (!isAIServiceAvailable()) {
    return getDegradedLearningAnalysisResponse();
  }

  try {
    const result = await withRetry(
      () =>
        new Promise((resolve, reject) => {
          aiClient.AnalyzeLearningStatus(
            {
              user_id: userId,
              user_type: userType,
              learning_paths: learningPaths.map(lp => ({
                knowledge_point_id: lp.knowledgePointId,
                knowledge_point_name: lp.knowledgePointName,
                completed_count: lp.completedCount,
                total_count: lp.totalCount
              })),
              error_books: errorBooks.map(eb => ({
                knowledge_point_id: eb.knowledgePointId,
                knowledge_point_name: eb.knowledgePointName,
                error_count: eb.errorCount,
                total_count: eb.totalCount
              })),
              answer_speeds: answerSpeeds.map(as => ({
                question_id: as.questionId,
                time_spent_seconds: as.timeSpentSeconds,
                expected_time_seconds: as.expectedTimeSeconds
              }))
            },
            (error: Error | null, response: any) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  knowledgePointScores: (response.knowledge_point_scores || []).map((kps: any) => ({
                    knowledgePointId: kps.knowledge_point_id,
                    knowledgePointName: kps.knowledge_point_name,
                    masteryScore: kps.mastery_score,
                    status: kps.status
                  })),
                  aiSuggestions: response.ai_suggestions || [],
                  overallMasteryScore: response.overall_mastery_score || 0
                });
              }
            }
          );
        }),
      'Python AI服务 - 学情分析'
    );
    recordAIRequest(true);
    return result as { knowledgePointScores: { knowledgePointId: number; knowledgePointName: string; masteryScore: number; status: string; }[]; aiSuggestions: string[]; overallMasteryScore: number; };
  } catch (error) {
    recordAIRequest(false);
    console.error('学情分析失败，返回降级响应:', error);
    return getDegradedLearningAnalysisResponse();
  }
}

// ==================== Rust高性能服务客户端 ====================

// 加载Rust服务proto文件
const RUST_PROTO_PATH = path.resolve(__dirname, '../../../rust-service/protos/rust_service.proto');
const rustPackageDefinition = protoLoader.loadSync(RUST_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const rustProto = grpc.loadPackageDefinition(rustPackageDefinition) as any;

// 创建Rust服务客户端
const RUST_SERVICE_ADDRESS = process.env.RUST_SERVICE_ADDRESS || 'localhost:50052';
const rustClient = new rustProto.rust_service.RustService(
  RUST_SERVICE_ADDRESS,
  grpc.credentials.createInsecure()
);

/**
 * 数据加密
 * @param data 原始数据
 * @param key 加密密钥
 * @returns 加密后的数据
 */
export async function encryptData(data: Buffer, key: string): Promise<Buffer> {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        rustClient.EncryptData(
          { data, key },
          (error: Error | null, response: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(Buffer.from(response.encrypted_data));
            }
          }
        );
      }),
    'Rust服务 - 数据加密'
  );
}

/**
 * 数据解密
 * @param encryptedData 加密数据
 * @param key 解密密钥
 * @returns 解密后的数据
 */
export async function decryptData(encryptedData: Buffer, key: string): Promise<Buffer> {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        rustClient.DecryptData(
          { encrypted_data: encryptedData, key },
          (error: Error | null, response: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(Buffer.from(response.data));
            }
          }
        );
      }),
    'Rust服务 - 数据解密'
  );
}

/**
 * 密码哈希
 * @param password 原始密码
 * @returns 哈希值
 */
export async function hashPassword(password: string): Promise<string> {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        rustClient.HashPassword(
          { password },
          (error: Error | null, response: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(response.hash);
            }
          }
        );
      }),
    'Rust服务 - 密码哈希'
  );
}

/**
 * 相似度计算
 * @param text1 文本1
 * @param text2 文本2
 * @returns 相似度（0-1之间）
 */
export async function calculateSimilarity(text1: string, text2: string): Promise<number> {
  return withRetry(
    () =>
      new Promise((resolve, reject) => {
        rustClient.CalculateSimilarity(
          { text1, text2 },
          (error: Error | null, response: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(response.similarity);
            }
          }
        );
      }),
    'Rust服务 - 相似度计算'
  );
}

/**
 * 关闭所有gRPC连接
 */
export function closeAllConnections(): void {
  aiClient.close();
  rustClient.close();
  console.log('所有gRPC连接已关闭');
}
