/**
 * AI服务管理器
 * 功能：AI服务降级处理、健康检查、自动重连
 * 需求：5.1, 5.2
 */

import http from 'http';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI服务配置
const AI_SERVICE_CONFIG = {
  HTTP_HOST: process.env.AI_HTTP_HOST || 'localhost',
  HTTP_PORT: parseInt(process.env.AI_HTTP_PORT || '5000'),
  GRPC_HOST: process.env.AI_GRPC_HOST || 'localhost',
  GRPC_PORT: parseInt(process.env.AI_GRPC_PORT || '50051'),
  HEALTH_CHECK_INTERVAL: 30000, // 30秒
  HEALTH_CHECK_TIMEOUT: 5000,   // 5秒
  MAX_RETRY_ATTEMPTS: 3,        // 失败重试3次后标记为不可用
  LOG_DIR: path.join(__dirname, '../../logs'),
  LOG_FILE: 'ai-service-manager.log'
};

// AI服务状态
interface AIServiceStatus {
  isAvailable: boolean;
  lastCheckTime: Date;
  consecutiveFailures: number;
  lastSuccessTime: Date | null;
  lastFailureTime: Date | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  degradedRequests: number;
}

// 全局状态
const serviceStatus: AIServiceStatus = {
  isAvailable: false,
  lastCheckTime: new Date(),
  consecutiveFailures: 0,
  lastSuccessTime: null,
  lastFailureTime: null,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  degradedRequests: 0
};

let healthCheckInterval: NodeJS.Timeout | null = null;
let grpcClient: any = null;

/**
 * 记录日志
 */
function logMessage(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
  // 确保日志目录存在
  if (!fs.existsSync(AI_SERVICE_CONFIG.LOG_DIR)) {
    fs.mkdirSync(AI_SERVICE_CONFIG.LOG_DIR, { recursive: true });
  }

  const logPath = path.join(AI_SERVICE_CONFIG.LOG_DIR, AI_SERVICE_CONFIG.LOG_FILE);
  const logEntry = `[${new Date().toISOString()}] [${level}] ${message}\n`;

  fs.appendFileSync(logPath, logEntry, 'utf8');
  
  // 同时输出到控制台
  if (level === 'ERROR') {
    console.error(logEntry.trim());
  } else if (level === 'WARN') {
    console.warn(logEntry.trim());
  } else {
    console.log(logEntry.trim());
  }
}

/**
 * 检查AI服务HTTP健康状态
 */
async function checkHTTPHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname: AI_SERVICE_CONFIG.HTTP_HOST,
      port: AI_SERVICE_CONFIG.HTTP_PORT,
      path: '/health',
      method: 'GET',
      timeout: AI_SERVICE_CONFIG.HEALTH_CHECK_TIMEOUT
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * 检查AI服务gRPC健康状态
 */
async function checkGRPCHealth(): Promise<boolean> {
  try {
    if (!grpcClient) {
      await initializeGRPCClient();
    }

    // 简单的连接测试
    return grpcClient !== null;
  } catch (error) {
    return false;
  }
}

/**
 * 初始化gRPC客户端
 */
async function initializeGRPCClient(): Promise<void> {
  try {
    const PROTO_PATH = path.resolve(__dirname, '../../../python-ai/protos/ai_service.proto');
    
    if (!fs.existsSync(PROTO_PATH)) {
      logMessage(`Proto文件不存在: ${PROTO_PATH}`, 'ERROR');
      return;
    }

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const aiProto = grpc.loadPackageDefinition(packageDefinition) as any;
    const address = `${AI_SERVICE_CONFIG.GRPC_HOST}:${AI_SERVICE_CONFIG.GRPC_PORT}`;

    grpcClient = new aiProto.ai_service.AIGradingService(
      address,
      grpc.credentials.createInsecure()
    );

    logMessage(`gRPC客户端已初始化: ${address}`, 'INFO');
  } catch (error) {
    logMessage(`gRPC客户端初始化失败: ${error}`, 'ERROR');
    grpcClient = null;
  }
}

/**
 * 执行健康检查
 */
async function performHealthCheck(): Promise<void> {
  serviceStatus.lastCheckTime = new Date();

  // 检查HTTP和gRPC健康状态
  const httpHealthy = await checkHTTPHealth();
  const grpcHealthy = await checkGRPCHealth();

  const isHealthy = httpHealthy && grpcHealthy;

  if (isHealthy) {
    // 服务健康
    if (!serviceStatus.isAvailable) {
      logMessage('AI服务恢复可用', 'INFO');
    }
    serviceStatus.isAvailable = true;
    serviceStatus.consecutiveFailures = 0;
    serviceStatus.lastSuccessTime = new Date();
  } else {
    // 服务不健康
    serviceStatus.consecutiveFailures++;
    serviceStatus.lastFailureTime = new Date();

    if (serviceStatus.consecutiveFailures >= AI_SERVICE_CONFIG.MAX_RETRY_ATTEMPTS) {
      if (serviceStatus.isAvailable) {
        logMessage(
          `AI服务连续${serviceStatus.consecutiveFailures}次健康检查失败，标记为不可用`,
          'WARN'
        );
      }
      serviceStatus.isAvailable = false;

      // 尝试重新初始化gRPC客户端
      logMessage('尝试重新连接AI服务...', 'INFO');
      await initializeGRPCClient();
    }
  }
}

/**
 * 启动健康检查
 */
export function startAIHealthCheck(): void {
  if (healthCheckInterval) {
    logMessage('AI服务健康检查已在运行中', 'INFO');
    return;
  }

  logMessage('启动AI服务健康检查', 'INFO');
  logMessage(`检查间隔: ${AI_SERVICE_CONFIG.HEALTH_CHECK_INTERVAL / 1000}秒`, 'INFO');
  logMessage(`超时时间: ${AI_SERVICE_CONFIG.HEALTH_CHECK_TIMEOUT / 1000}秒`, 'INFO');
  logMessage(`失败重试: ${AI_SERVICE_CONFIG.MAX_RETRY_ATTEMPTS}次后标记为不可用`, 'INFO');

  // 初始化gRPC客户端
  initializeGRPCClient();

  // 立即执行一次检查
  performHealthCheck();

  // 定期执行检查
  healthCheckInterval = setInterval(() => {
    performHealthCheck();
  }, AI_SERVICE_CONFIG.HEALTH_CHECK_INTERVAL);
}

/**
 * 停止健康检查
 */
export function stopAIHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logMessage('AI服务健康检查已停止', 'INFO');
  }

  if (grpcClient) {
    grpcClient.close();
    grpcClient = null;
  }
}

/**
 * 获取AI服务状态
 */
export function getAIServiceStatus(): AIServiceStatus {
  return { ...serviceStatus };
}

/**
 * 检查AI服务是否可用
 */
export function isAIServiceAvailable(): boolean {
  return serviceStatus.isAvailable;
}

/**
 * 获取降级响应 - OCR识别
 */
export function getDegradedOCRResponse(): { text: string; confidence: number } {
  serviceStatus.degradedRequests++;
  logMessage('AI服务不可用，返回OCR降级响应', 'WARN');
  
  return {
    text: 'AI服务暂时不可用，无法识别文字。请稍后重试。',
    confidence: 0
  };
}

/**
 * 获取降级响应 - 主观题评分
 */
export function getDegradedGradingResponse(maxScore: number): {
  score: number;
  feedback: string;
  keyPoints: string[];
} {
  serviceStatus.degradedRequests++;
  logMessage('AI服务不可用，返回主观题评分降级响应', 'WARN');
  
  // 默认给60%分数
  const score = Math.floor(maxScore * 0.6);
  
  return {
    score,
    feedback: 'AI批改服务暂时不可用，已自动给予基础分数。请稍后重新批改以获取详细反馈。',
    keyPoints: []
  };
}

/**
 * 获取降级响应 - AI答疑
 */
export function getDegradedQAResponse(): {
  answer: string;
  steps: string[];
  relatedExamples: string[];
} {
  serviceStatus.degradedRequests++;
  logMessage('AI服务不可用，返回AI答疑降级响应', 'WARN');
  
  return {
    answer: 'AI答疑服务暂时不可用，请稍后重试。您也可以联系老师获取帮助。',
    steps: [],
    relatedExamples: []
  };
}

/**
 * 获取降级响应 - 个性化推荐
 */
export function getDegradedRecommendationResponse(): Array<{
  id: number;
  title: string;
  difficulty: string;
  knowledgePointId: number;
}> {
  serviceStatus.degradedRequests++;
  logMessage('AI服务不可用，返回个性化推荐降级响应', 'WARN');
  
  return [];
}

/**
 * 获取降级响应 - 学情分析
 */
export function getDegradedLearningAnalysisResponse(): {
  knowledgePointScores: Array<{
    knowledgePointId: number;
    knowledgePointName: string;
    masteryScore: number;
    status: string;
  }>;
  aiSuggestions: string[];
  overallMasteryScore: number;
} {
  serviceStatus.degradedRequests++;
  logMessage('AI服务不可用，返回学情分析降级响应', 'WARN');
  
  return {
    knowledgePointScores: [],
    aiSuggestions: ['AI分析服务暂时不可用，请稍后重试。'],
    overallMasteryScore: 0
  };
}

/**
 * 记录请求统计
 */
export function recordAIRequest(success: boolean): void {
  serviceStatus.totalRequests++;
  if (success) {
    serviceStatus.successfulRequests++;
  } else {
    serviceStatus.failedRequests++;
  }
}

/**
 * 获取AI服务统计信息
 */
export function getAIServiceStats(): {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  degradedRequests: number;
  successRate: number;
  degradationRate: number;
} {
  const successRate = serviceStatus.totalRequests > 0
    ? (serviceStatus.successfulRequests / serviceStatus.totalRequests) * 100
    : 0;
  
  const degradationRate = serviceStatus.totalRequests > 0
    ? (serviceStatus.degradedRequests / serviceStatus.totalRequests) * 100
    : 0;

  return {
    totalRequests: serviceStatus.totalRequests,
    successfulRequests: serviceStatus.successfulRequests,
    failedRequests: serviceStatus.failedRequests,
    degradedRequests: serviceStatus.degradedRequests,
    successRate: Math.round(successRate * 100) / 100,
    degradationRate: Math.round(degradationRate * 100) / 100
  };
}
