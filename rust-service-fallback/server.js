import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import stringSimilarity from 'string-similarity';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Rust服务降级版本（Node.js）运行中',
    services: {
      http: 'running',
      note: 'Using Node.js fallback implementation'
    }
  });
});

// AES-256-GCM 加密
app.post('/api/encrypt', (req, res) => {
  try {
    const { data, key } = req.body;
    
    if (!data || !key) {
      return res.status(400).json({ error: '缺少必要参数: data, key' });
    }

    // 生成密钥（使用SHA-256哈希确保32字节）
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    
    // 生成随机IV（12字节用于GCM）
    const iv = crypto.randomBytes(12);
    
    // 创建加密器
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    // 加密数据
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // 获取认证标签
    const authTag = cipher.getAuthTag();
    
    // 组合: IV + 认证标签 + 加密数据
    const result = Buffer.concat([iv, authTag, encrypted]);
    
    // Base64编码
    const encryptedData = result.toString('base64');
    
    res.json({ encrypted_data: encryptedData });
  } catch (error) {
    console.error('加密错误:', error);
    res.status(500).json({ error: `加密失败: ${error.message}` });
  }
});

// AES-256-GCM 解密
app.post('/api/decrypt', (req, res) => {
  try {
    const { encrypted_data, key } = req.body;
    
    if (!encrypted_data || !key) {
      return res.status(400).json({ error: '缺少必要参数: encrypted_data, key' });
    }

    // Base64解码
    const buffer = Buffer.from(encrypted_data, 'base64');
    
    // 提取IV（前12字节）
    const iv = buffer.slice(0, 12);
    
    // 提取认证标签（接下来16字节）
    const authTag = buffer.slice(12, 28);
    
    // 提取加密数据（剩余部分）
    const encrypted = buffer.slice(28);
    
    // 生成密钥
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    
    // 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    // 解密数据
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const data = decrypted.toString('utf8');
    
    res.json({ data });
  } catch (error) {
    console.error('解密错误:', error);
    res.status(500).json({ error: `解密失败: ${error.message}` });
  }
});

// bcrypt 密码哈希
app.post('/api/hash', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: '缺少必要参数: password' });
    }

    // 使用bcrypt生成哈希（10轮）
    const hash = await bcrypt.hash(password, 10);
    
    res.json({ hash });
  } catch (error) {
    console.error('哈希错误:', error);
    res.status(500).json({ error: `哈希失败: ${error.message}` });
  }
});

// 文本相似度计算
app.post('/api/similarity', (req, res) => {
  try {
    const { text1, text2 } = req.body;
    
    if (!text1 || !text2) {
      return res.status(400).json({ error: '缺少必要参数: text1, text2' });
    }

    // 使用Dice系数计算相似度
    const similarity = stringSimilarity.compareTwoStrings(text1, text2);
    
    res.json({ similarity });
  } catch (error) {
    console.error('相似度计算错误:', error);
    res.status(500).json({ error: `相似度计算失败: ${error.message}` });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Rust服务降级版本（Node.js）');
  console.log('========================================');
  console.log(`✓ HTTP服务器已启动，端口: ${PORT}`);
  console.log('========================================');
  console.log('  服务就绪，等待请求...');
  console.log('  提供功能:');
  console.log('  - AES-256-GCM 加密/解密');
  console.log('  - bcrypt 密码哈希');
  console.log('  - 文本相似度计算');
  console.log('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});
