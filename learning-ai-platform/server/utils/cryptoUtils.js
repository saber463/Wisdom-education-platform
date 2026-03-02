import crypto from 'crypto';

// 从环境变量获取加密密钥，确保其长度为32字节
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || 'your-default-encryption-key-please-change-in-production',
  'salt',
  32
);
const IV_LENGTH = 16; // 初始化向量长度

/**
 * 加密数据
 * @param {string} text - 要加密的明文
 * @returns {string} - 加密后的密文（包含IV和密文）
 */
const encrypt = text => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // 对于邮箱等需要查询的字段，使用基于输入的确定性IV
  // 注意：这种方法降低了安全性，但允许基于加密值进行查询
  const iv = crypto.scryptSync(text, 'fixed-salt', IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * 解密数据
 * @param {string} text - 要解密的密文（包含IV和密文）
 * @returns {string} - 解密后的明文
 */
const decrypt = text => {
  if (!text || typeof text !== 'string' || !text.includes(':')) {
    return text;
  }

  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

/**
 * 生成加密的MongoDB字段转换对象
 * @param {Array<string>} fields - 要加密的字段列表
 * @returns {Object} - Mongoose Schema的虚拟字段转换对象
 */
const createEncryptedFields = fields => {
  const virtuals = {};

  fields.forEach(field => {
    virtuals[field] = {
      get() {
        return this[`_${field}`] ? decrypt(this[`_${field}`]) : undefined;
      },
      set(value) {
        this[`_${field}`] = encrypt(value);
      },
    };
  });

  return virtuals;
};

export { encrypt, decrypt, createEncryptedFields };
