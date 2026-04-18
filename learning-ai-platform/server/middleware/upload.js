import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sensitiveImageDetector from '../utils/sensitiveImageDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保上传目录存在（修复路径错误，使用相对于当前文件的路径）
const uploadDir = path.join(__dirname, '../uploads');
const tweetsDir = path.join(uploadDir, 'tweets');
const avatarsDir = path.join(uploadDir, 'avatars');
const customAvatarsDir = path.join(avatarsDir, 'custom');

// 确保所有上传目录存在
[uploadDir, tweetsDir, avatarsDir, customAvatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 安全的文件名生成函数
const generateSafeFilename = (originalName, userId) => {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(16).toString('hex');
  return `${userId}-${uniqueSuffix}${ext}`;
};

// 通用文件存储配置
const createStorage = dir => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const safeFilename = generateSafeFilename(file.originalname, req.user._id);
      cb(null, safeFilename);
    },
  });
};

// 通用文件过滤器
const createFileFilter = allowedMimeTypes => {
  return (req, file, cb) => {
    // 检查MIME类型
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new multer.MulterError(
          'LIMIT_FILE_TYPE',
          `只允许上传${allowedMimeTypes.join(', ')}类型的文件`
        )
      );
    }

    // 检查文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    };

    const allowedExts = Object.values(allowedExtensions).flat();
    if (!allowedExts.includes(ext)) {
      return cb(
        new multer.MulterError(
          'LIMIT_FILE_TYPE',
          `文件扩展名不允许，只允许${allowedExts.join(', ')}`
        )
      );
    }

    // 通过验证
    cb(null, true);
  };
};

// 推文图片上传配置
const tweetImageStorage = createStorage(tweetsDir);
const tweetImageFilter = createFileFilter(['image/jpeg', 'image/png', 'image/gif']);

const tweetUpload = multer({
  storage: tweetImageStorage,
  fileFilter: tweetImageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 9, // 最多9张图片
  },
});

// 头像上传配置（用户上传的头像保存到custom文件夹）
const avatarImageStorage = createStorage(customAvatarsDir);
const avatarImageFilter = createFileFilter(['image/jpeg', 'image/png']);

const avatarUpload = multer({
  storage: avatarImageStorage,
  fileFilter: avatarImageFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 1, // 每次只能上传1张头像
  },
});

// 错误处理中间件
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = '文件上传错误';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超过限制';
        break;
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        message = '文件数量超过限制';
        break;
      case 'LIMIT_FILE_TYPE':
        message = err.message;
        break;
      default:
        message = '文件上传失败';
    }

    return res.status(400).json({ success: false, message, error: err.code });
  }
  next(err);
};

// 上传多张图片的中间件
const uploadTweetImages = (req, res, next) => {
  const upload = tweetUpload.array('images', 9);
  upload(req, res, err => {
    if (err) {
      handleMulterError(err, req, res, next);
    } else {
      next();
    }
  });
};

// 上传单张头像的中间件
const uploadAvatarImage = async (req, res, next) => {
  const upload = avatarUpload.single('avatar');

  upload(req, res, async err => {
    if (err) {
      handleMulterError(err, req, res, next);
      return;
    }

    // 如果文件上传成功，进行敏感图片检测
    if (req.file) {
      try {
        const imagePath = req.file.path;

        // 执行敏感图片检测
        const detectionResult = await sensitiveImageDetector.detect(imagePath);

        if (detectionResult.isSensitive) {
          // 删除已上传的敏感图片
          fs.unlinkSync(imagePath);

          return res.status(400).json({
            success: false,
            message: '图片包含敏感内容，无法上传',
            details: detectionResult.details,
          });
        }

        // 检测通过，继续处理
        next();
      } catch {
        console.error('敏感图片检测失败:');

        // 检测失败时，删除已上传的图片
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
          success: false,
          message: '图片检测失败，请稍后重试',
        });
      }
    } else {
      next();
    }
  });
};

export { tweetUpload, uploadTweetImages, uploadAvatarImage, handleMulterError };
