/**
 * 文件上传路由模块
 * 实现作业文件上传功能
 * 支持Word/PDF/图片格式，文件大小限制20MB
 * 调用Python OCR服务提取文本
 * 需求：1.3, 5.2
 */

import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { recognizeText } from '../services/grpc-clients.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 上传目录配置
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('创建上传目录:', UPLOAD_DIR);
}

// 支持的文件类型
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  // Word文档
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  // PDF文档
  'application/pdf': ['.pdf'],
  // 图片格式
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/webp': ['.webp']
};

// 文件大小限制：20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// 文件过滤器
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const mimeType = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 检查MIME类型是否支持
  if (ALLOWED_MIME_TYPES[mimeType]) {
    // 检查扩展名是否匹配
    if (ALLOWED_MIME_TYPES[mimeType].includes(ext)) {
      callback(null, true);
    } else {
      callback(new Error(`文件扩展名不匹配，期望: ${ALLOWED_MIME_TYPES[mimeType].join(', ')}`));
    }
  } else {
    const supportedFormats = Object.values(ALLOWED_MIME_TYPES).flat().join(', ');
    callback(new Error(`不支持的文件格式。支持的格式: ${supportedFormats}`));
  }
};

// 存储配置
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    // 按日期创建子目录
    const dateDir = new Date().toISOString().split('T')[0];
    const uploadPath = path.join(UPLOAD_DIR, dateDir);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    callback(null, uploadPath);
  },
  filename: (_req, file, callback) => {
    // 生成唯一文件名：时间戳_随机数_原始文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    // 清理文件名中的特殊字符
    const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
    const filename = `${timestamp}_${random}_${safeName}${ext}`;
    callback(null, filename);
  }
});

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // 单次只允许上传一个文件
  }
});

// 所有上传路由都需要认证
router.use(authenticateToken);

/**
 * 判断文件是否为图片格式
 */
function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * 获取文件格式（用于OCR服务）
 */
function getFileFormat(mimeType: string): string {
  const formatMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/webp': 'webp',
    'application/pdf': 'pdf'
  };
  return formatMap[mimeType] || 'unknown';
}

/**
 * POST /api/upload
 * 上传作业文件
 * 
 * 请求：multipart/form-data
 * - file: 文件（必需）
 * - extract_text: 是否提取文本（可选，默认true）
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "file_id": "文件ID",
 *     "filename": "原始文件名",
 *     "stored_filename": "存储文件名",
 *     "file_path": "文件路径",
 *     "file_url": "文件访问URL",
 *     "mime_type": "MIME类型",
 *     "file_size": 文件大小（字节）,
 *     "extracted_text": "提取的文本（如果是图片）",
 *     "ocr_confidence": OCR置信度（如果是图片）,
 *     "upload_time": "上传时间"
 *   }
 * }
 */
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 检查文件是否上传成功
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
      return;
    }

    const file = req.file;
    const extractText = req.body.extract_text !== 'false'; // 默认提取文本

    // 构建文件信息
    const dateDir = new Date().toISOString().split('T')[0];
    const relativePath = `uploads/${dateDir}/${file.filename}`;
    const fileUrl = `/api/upload/files/${dateDir}/${file.filename}`;

    // 生成文件ID
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 响应数据
    const responseData: {
      file_id: string;
      filename: string;
      stored_filename: string;
      file_path: string;
      file_url: string;
      mime_type: string;
      file_size: number;
      extracted_text?: string;
      ocr_confidence?: number;
      upload_time: string;
    } = {
      file_id: fileId,
      filename: file.originalname,
      stored_filename: file.filename,
      file_path: relativePath,
      file_url: fileUrl,
      mime_type: file.mimetype,
      file_size: file.size,
      upload_time: new Date().toISOString()
    };

    // 如果是图片且需要提取文本，调用OCR服务
    if (extractText && isImageFile(file.mimetype)) {
      try {
        // 读取文件内容
        const fileBuffer = fs.readFileSync(file.path);
        const format = getFileFormat(file.mimetype);

        // 调用Python OCR服务
        const ocrResult = await recognizeText(fileBuffer, format);

        responseData.extracted_text = ocrResult.text;
        responseData.ocr_confidence = ocrResult.confidence;

        console.log(`OCR识别完成，置信度: ${ocrResult.confidence}`);
      } catch (ocrError) {
        // OCR失败不影响文件上传成功
        console.warn('OCR识别失败:', ocrError);
        responseData.extracted_text = '';
        responseData.ocr_confidence = 0;
      }
    }

    // 记录上传日志
    console.log(`文件上传成功: ${file.originalname} -> ${file.filename}, 大小: ${file.size} bytes`);

    res.status(201).json({
      success: true,
      message: '文件上传成功',
      data: responseData
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/upload/files/:date/:filename
 * 获取上传的文件
 */
router.get('/files/:date/:filename', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, filename } = req.params;

    // 验证日期格式（防止路径遍历攻击）
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        message: '无效的日期格式'
      });
      return;
    }

    // 验证文件名（防止路径遍历攻击）
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
      return;
    }

    const filePath = path.join(UPLOAD_DIR, date, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
      return;
    }

    // 发送文件
    res.sendFile(filePath);

  } catch (error) {
    console.error('获取文件失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * DELETE /api/upload/files/:date/:filename
 * 删除上传的文件（仅教师可删除）
 */
router.delete('/files/:date/:filename', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 只有教师可以删除文件
    if (req.user!.role !== 'teacher') {
      res.status(403).json({
        success: false,
        message: '无权限删除文件'
      });
      return;
    }

    const { date, filename } = req.params;

    // 验证日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        message: '无效的日期格式'
      });
      return;
    }

    // 验证文件名
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
      return;
    }

    const filePath = path.join(UPLOAD_DIR, date, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
      return;
    }

    // 删除文件
    fs.unlinkSync(filePath);

    console.log(`文件删除成功: ${filePath}`);

    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 错误处理中间件（处理multer错误）
router.use((error: Error, _req: AuthRequest, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: `文件大小超过限制，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: '单次只允许上传一个文件'
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `上传错误: ${error.message}`
    });
    return;
  }

  // 自定义文件过滤错误
  if (error.message.includes('不支持的文件格式') || error.message.includes('文件扩展名不匹配')) {
    res.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }

  // 其他错误
  console.error('上传处理错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

export default router;

// 导出配置常量供测试使用
export { UPLOAD_DIR, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
