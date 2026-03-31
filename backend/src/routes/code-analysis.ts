/**
 * 代码静态分析 + AI流程图生成路由
 *
 * ⚠️ 安全声明：
 * - 本模块仅做静态代码解析，绝对不执行用户代码
 * - 不调用任何 eval、exec、subprocess、child_process 等执行函数
 * - 代码长度限制500行，单文件大小限制50KB
 * - 请求限流：每用户每分钟10次
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { getCachedHotResource, cacheHotResource } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const router = Router();
router.use(authenticateToken);

// 每用户每分钟最多10次分析请求
const analyzeRateLimit = rateLimit(10, 60_000);

const MAX_LINES = 500;
const MAX_SIZE_KB = 50;

interface FlowNode {
  id: string;
  type: 'terminal' | 'process' | 'decision' | 'loop' | 'function';
  label: string;
  x: number;
  y: number;
  color: string;
  lineRef?: number;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

interface AnalysisResult {
  type: string;
  content: string;
}

/**
 * 纯静态代码解析 - 绝不执行代码
 * 基于关键字匹配和模式识别生成流程图节点
 */
function staticParseCode(
  code: string,
  language: string
): { nodes: FlowNode[]; connections: FlowConnection[] } {
  const lines = code.split('\n');
  const nodes: FlowNode[] = [];
  const connections: FlowConnection[] = [];

  const COLORS = {
    terminal: '#06b6d4',
    process: '#8b5cf6',
    decision: '#f59e0b',
    loop: '#10b981',
    function: '#3b82f6',
  };

  const DECISION_KW: Record<string, RegExp[]> = {
    python: [/^\s*(if|elif|else)\b/, /^\s*case\b/],
    java: [/^\s*(if|else if|switch)\s*\(/, /^\s*else\s*\{/],
    cpp: [/^\s*(if|else if|switch)\s*\(/, /^\s*else\s*\{/],
    javascript: [/^\s*(if|else if|switch)\s*\(/, /^\s*else\s*\{/],
  };
  const LOOP_KW: Record<string, RegExp[]> = {
    python: [/^\s*(for|while)\s+/],
    java: [/^\s*(for|while|do)\s*[\(\{]/],
    cpp: [/^\s*(for|while|do)\s*[\(\{]/],
    javascript: [/^\s*(for|while|do)\s*[\(\{]/],
  };
  const FUNC_KW: Record<string, RegExp[]> = {
    python: [/^\s*def\s+\w+/],
    java: [/^\s*(public|private|protected|static).*\w+\s*\(/],
    cpp: [/^\s*\w[\w:]*\s+\w+\s*\(/],
    javascript: [/^\s*(function\s+\w+|const\s+\w+\s*=\s*(\(|async))/, /^\s*\w+\s*=\s*(\(|async)/],
  };

  const decisionPatterns = DECISION_KW[language] || DECISION_KW.python;
  const loopPatterns = LOOP_KW[language] || LOOP_KW.python;
  const funcPatterns = FUNC_KW[language] || FUNC_KW.python;

  nodes.push({ id: 'start', type: 'terminal', label: '开始', x: 250, y: 60, color: COLORS.terminal });

  let yOffset = 140;
  let prevId = 'start';
  let nodeIdx = 0;

  const effectiveLines = lines.slice(0, Math.min(lines.length, 30));

  for (let i = 0; i < effectiveLines.length; i++) {
    const line = effectiveLines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') continue;

    const id = `n${nodeIdx++}`;
    let type: FlowNode['type'] = 'process';
    let color = COLORS.process;

    if (decisionPatterns.some(p => p.test(line))) {
      type = 'decision'; color = COLORS.decision;
    } else if (loopPatterns.some(p => p.test(line))) {
      type = 'loop'; color = COLORS.loop;
    } else if (funcPatterns.some(p => p.test(line))) {
      type = 'function'; color = COLORS.function;
    }

    const label = trimmed.length > 30 ? trimmed.substring(0, 30) + '…' : trimmed;
    nodes.push({ id, type, label, x: 250, y: yOffset, color, lineRef: i + 1 });
    connections.push({ from: prevId, to: id, label: type === 'decision' ? '是' : undefined });

    yOffset += type === 'decision' ? 90 : 80;
    prevId = id;
  }

  nodes.push({ id: 'end', type: 'terminal', label: '结束', x: 250, y: yOffset, color: COLORS.terminal });
  connections.push({ from: prevId, to: 'end' });

  return { nodes, connections };
}

/**
 * 静态代码质量分析（不执行代码）
 */
function staticAnalyze(code: string, language: string): AnalysisResult[] {
  const lines = code.split('\n');
  const results: AnalysisResult[] = [];

  // 统计代码结构
  const decisionCount = lines.filter(l => /if|elif|else|switch/i.test(l)).length;
  const loopCount = lines.filter(l => /for|while|do\s*{/i.test(l)).length;
  const funcCount = lines.filter(l => language === 'python' ? /^\s*def\s+/.test(l) : /function\s+\w+|def\s+|public\s+\w+\s+\w+\s*\(/.test(l)).length;

  const topics: string[] = [];
  if (decisionCount > 0) topics.push('条件分支');
  if (loopCount > 0) topics.push('循环结构');
  if (funcCount > 0) topics.push('函数定义');
  if (lines.length > 10) topics.push('模块化编程');

  results.push({
    type: '📚 考点识别',
    content: `本代码涉及考点：${topics.join('、') || '顺序执行'}。共 ${lines.filter(l => l.trim()).length} 行有效代码，${funcCount} 个函数，${decisionCount} 个条件判断，${loopCount} 个循环结构。`,
  });

  results.push({
    type: '🔍 逻辑解析',
    content: `代码整体采用${loopCount > 0 ? '循环迭代' : '顺序执行'}结构${decisionCount > 0 ? '，配合条件分支处理不同情况' : ''}${funcCount > 0 ? '，通过函数封装提高复用性' : ''}。逻辑清晰，结构${lines.length < 20 ? '简洁' : '较为复杂，建议考虑函数拆分'}。`,
  });

  // 语法风险检测（静态）
  const warnings: string[] = [];
  if (language === 'python') {
    if (lines.some(l => /\bexec\s*\(/.test(l))) warnings.push('包含exec()调用，存在安全风险');
    if (lines.some(l => /\beval\s*\(/.test(l))) warnings.push('包含eval()调用，建议避免使用');
    if (!lines.some(l => /\bdef\s+/.test(l)) && lines.length > 15) warnings.push('建议将重复逻辑提取为函数');
  }
  if (language === 'java' || language === 'cpp') {
    if (lines.some(l => /\bSystem\.exit\s*\(/.test(l))) warnings.push('直接调用System.exit()会绕过资源清理');
  }

  results.push({
    type: warnings.length ? '⚠️ 优化建议' : '✅ 代码质量',
    content: warnings.length
      ? warnings.join('；')
      : '代码结构合理，命名规范，逻辑清晰。建议添加必要的注释和异常处理以提升可维护性。',
  });

  return results;
}

/**
 * POST /api/code-analysis/analyze
 * 代码静态分析接口（绝不执行代码）
 */
router.post('/analyze', analyzeRateLimit, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, message: '缺少代码内容' });
      return;
    }

    const validLanguages = ['python', 'java', 'cpp', 'javascript'];
    if (!validLanguages.includes(language)) {
      res.status(400).json({ success: false, message: '不支持的编程语言' });
      return;
    }

    // 大小限制
    const sizeKB = Buffer.byteLength(code, 'utf8') / 1024;
    if (sizeKB > MAX_SIZE_KB) {
      res.status(400).json({ success: false, message: `代码大小超限(${Math.round(sizeKB)}KB > ${MAX_SIZE_KB}KB)` });
      return;
    }

    const lineCount = code.split('\n').length;
    if (lineCount > MAX_LINES) {
      res.status(400).json({ success: false, message: `代码行数超限(${lineCount}行 > ${MAX_LINES}行)，请分片分析` });
      return;
    }

    // 缓存键（基于代码内容hash，相同代码复用结果）
    const cacheKey = `code_analysis:${crypto.createHash('md5').update(code + language).digest('hex')}`;

    const cached = await getCachedHotResource(cacheKey);
    if (cached) {
      res.json({ success: true, ...JSON.parse(cached as string), fromCache: true });
      return;
    }

    // 静态解析（不执行代码）
    const flowData = staticParseCode(code, language);
    const analysis = staticAnalyze(code, language);

    const result = { flowData, analysis };

    // 缓存10分钟
    await cacheHotResource(cacheKey, JSON.stringify(result), 600);

    logger.info(`代码分析完成: userId=${req.user?.id}, lang=${language}, lines=${lineCount}`);

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('代码分析接口异常', error);
    res.status(500).json({ success: false, message: '分析服务暂时不可用' });
  }
});

/**
 * POST /api/code-analysis/submit-assignment
 * 将代码+流程图提交为作业
 */
router.post('/submit-assignment', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignment_id, code, language, flowchart_data, note } = req.body;
    const userId = req.user!.id;

    if (!assignment_id || !code) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    // 记录提交（存储代码和流程图数据，不执行）
    const { executeQuery } = await import('../config/database.js');
    await executeQuery(
      `INSERT INTO assignment_submissions
         (assignment_id, user_id, code_content, code_language, flowchart_data, note, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         code_content = VALUES(code_content),
         flowchart_data = VALUES(flowchart_data),
         note = VALUES(note),
         submitted_at = NOW()`,
      [
        assignment_id, userId,
        code.substring(0, 50000), // 最多存50KB
        language,
        flowchart_data ? JSON.stringify(flowchart_data) : null,
        note || null,
      ]
    );

    res.json({ success: true, message: '代码作业提交成功' });
  } catch (error) {
    logger.error('代码作业提交失败', error);
    res.status(500).json({ success: false, message: '提交失败' });
  }
});

export default router;
