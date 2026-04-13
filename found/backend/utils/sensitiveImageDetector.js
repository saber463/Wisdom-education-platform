import sharp from 'sharp';

/**
 * 敏感图片检测模块
 * 用于检测上传的图片是否包含敏感内容（色情、广告等）
 */

class SensitiveImageDetector {
  constructor() {
    // 肤色范围（RGB）
    this.skinColorRanges = [
      { min: [0, 50, 0], max: [50, 255, 50] }, // 浅肤色
      { min: [50, 80, 0], max: [150, 255, 80] }, // 中等肤色
      { min: [100, 100, 50], max: [255, 255, 150] }, // 深肤色
    ];

    // 敏感关键词（用于检测图片中的文字）
    this.sensitiveKeywords = [
      '色情',
      '裸聊',
      '性交',
      '做爱',
      '淫秽',
      '黄色',
      '赌博',
      '博彩',
      '六合彩',
      '赌场',
      '兼职',
      '刷单',
      '返利',
      '套现',
      '贷款',
      '借钱',
      '广告',
      '推广',
      '代购',
      '微商',
      '加微信',
      '加QQ',
      '兼职',
      '日结',
      '高薪',
      '轻松',
      '月入',
      '日赚',
    ];

    // 检测阈值
    this.thresholds = {
      skinRatio: 0.4, // 肤色占比阈值（超过40%可能有问题）
      textDensity: 0.3, // 文字密度阈值
      suspiciousColors: 0.5, // 可疑颜色（如大量粉色、红色）占比
    };
  }

  /**
   * 检测图片是否包含敏感内容
   * @param {string} imagePath - 图片文件路径
   * @returns {Promise<Object>} 检测结果
   */
  async detect(imagePath) {
    try {
      // 读取图片信息
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      // 如果图片太大，先进行压缩
      let processedImage = image;
      if (metadata.width > 500 || metadata.height > 500) {
        processedImage = image.resize(500, 500, { fit: 'inside' });
      }

      // 获取图片像素数据
      const { data, info } = await processedImage.raw().toBuffer({ resolveWithObject: true });

      // 执行各种检测
      const skinRatio = this.detectSkinColor(data, info);
      const suspiciousColorRatio = this.detectSuspiciousColors(data, info);
      const hasSensitiveText = await this.detectSensitiveText(imagePath);

      // 综合判断
      const isSensitive = this.judgeSensitive({
        skinRatio,
        suspiciousColorRatio,
        hasSensitiveText,
        metadata,
      });

      return {
        isSensitive,
        details: {
          skinRatio: (skinRatio * 100).toFixed(2) + '%',
          suspiciousColorRatio: (suspiciousColorRatio * 100).toFixed(2) + '%',
          hasSensitiveText,
          reasons: this.getReasons(skinRatio, suspiciousColorRatio, hasSensitiveText),
        },
      };
    } catch (error) {
      console.error('敏感图片检测失败:', error);
      // 检测失败时，为了安全起见，返回true（拒绝上传）
      return {
        isSensitive: true,
        details: {
          error: '图片检测失败',
        },
      };
    }
  }

  /**
   * 检测肤色比例
   * @param {Buffer} data - 像素数据
   * @param {Object} info - 图片信息
   * @returns {number} 肤色占比
   */
  detectSkinColor(data, info) {
    let skinPixelCount = 0;
    const totalPixels = info.width * info.height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (this.isSkinColor(r, g, b)) {
        skinPixelCount++;
      }
    }

    return skinPixelCount / totalPixels;
  }

  /**
   * 判断是否为肤色
   * @param {number} r - 红色通道
   * @param {number} g - 绿色通道
   * @param {number} b - 蓝色通道
   * @returns {boolean}
   */
  isSkinColor(r, g, b) {
    // 使用YCbCr颜色空间进行肤色检测
    const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;

    // 肤色范围
    return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
  }

  /**
   * 检测可疑颜色（如大量粉色、红色等常用于广告的颜色）
   * @param {Buffer} data - 像素数据
   * @param {Object} info - 图片信息
   * @returns {number} 可疑颜色占比
   */
  detectSuspiciousColors(data, info) {
    let suspiciousPixelCount = 0;
    const totalPixels = info.width * info.height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (this.isSuspiciousColor(r, g, b)) {
        suspiciousPixelCount++;
      }
    }

    return suspiciousPixelCount / totalPixels;
  }

  /**
   * 判断是否为可疑颜色
   * @param {number} r - 红色通道
   * @param {number} g - 绿色通道
   * @param {number} b - 蓝色通道
   * @returns {boolean}
   */
  isSuspiciousColor(r, g, b) {
    // 检测高饱和度的粉色、红色、紫色（常用于广告）
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    // 高饱和度且偏红/粉/紫
    return saturation > 0.5 && (r > 150 || (r > 100 && b > 100));
  }

  /**
   * 检测图片中是否包含敏感文字
   * 注意：这需要OCR功能，这里提供基础框架
   * @param {string} imagePath - 图片路径
   * @returns {Promise<boolean>}
   */
  async detectSensitiveText(_imagePath) {
    return false;
  }

  /**
   * 综合判断图片是否敏感
   * @param {Object} params - 检测参数
   * @returns {boolean}
   */
  judgeSensitive({ skinRatio, suspiciousColorRatio, hasSensitiveText, _metadata }) {
    // 如果检测到敏感文字，直接判定为敏感
    if (hasSensitiveText) {
      return true;
    }

    // 肤色比例过高
    if (skinRatio > this.thresholds.skinRatio) {
      return true;
    }

    // 可疑颜色比例过高
    if (suspiciousColorRatio > this.thresholds.suspiciousColors) {
      return true;
    }

    // 综合判断：肤色和可疑颜色都偏高
    if (
      skinRatio > this.thresholds.skinRatio * 0.7 &&
      suspiciousColorRatio > this.thresholds.suspiciousColors * 0.7
    ) {
      return true;
    }

    return false;
  }

  /**
   * 获取敏感原因
   * @param {number} skinRatio - 肤色比例
   * @param {number} suspiciousColorRatio - 可疑颜色比例
   * @param {boolean} hasSensitiveText - 是否有敏感文字
   * @returns {Array<string>}
   */
  getReasons(skinRatio, suspiciousColorRatio, hasSensitiveText) {
    const reasons = [];

    if (hasSensitiveText) {
      reasons.push('检测到敏感文字');
    }

    if (skinRatio > this.thresholds.skinRatio) {
      reasons.push('肤色比例异常');
    }

    if (suspiciousColorRatio > this.thresholds.suspiciousColors) {
      reasons.push('颜色特征可疑');
    }

    if (
      skinRatio > this.thresholds.skinRatio * 0.7 &&
      suspiciousColorRatio > this.thresholds.suspiciousColors * 0.7
    ) {
      reasons.push('综合特征异常');
    }

    return reasons.length > 0 ? reasons : ['未检测到明显敏感内容'];
  }

  /**
   * 使用API进行敏感图片检测（可选）
   * @param {string} imagePath - 图片路径
   * @returns {Promise<boolean>}
   */
  async detectWithAPI(_imagePath) {
    return false;
  }
}

// 导出单例
const detector = new SensitiveImageDetector();

export default detector;
