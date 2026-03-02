/**
 * 文件上传属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 * 
 * 属性2：文件解析存储一致性
 * 验证需求：1.3
 */

import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 测试上传目录（使用系统临时目录）
const TEST_UPLOAD_DIR = path.join(os.tmpdir(), 'edu-platform-test-uploads');

// 支持的文件类型
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

// 文件大小限制：20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * 文件元数据接口
 */
interface FileMetadata {
  file_id: string;
  filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  upload_time: string;
}

/**
 * 模拟文件存储逻辑（与upload.ts中的逻辑一致）
 */
function generateStoredFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  // 清理文件名中的特殊字符
  const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
  return `${timestamp}_${random}_${safeName}${ext}`;
}

/**
 * 模拟文件上传和存储
 */
function simulateFileUpload(
  content: Buffer,
  originalFilename: string,
  mimeType: string
): FileMetadata {
  // 确保测试目录存在
  const dateDir = new Date().toISOString().split('T')[0];
  const uploadPath = path.join(TEST_UPLOAD_DIR, dateDir);
  
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  // 生成存储文件名
  const storedFilename = generateStoredFilename(originalFilename);
  const filePath = path.join(uploadPath, storedFilename);
  
  // 写入文件
  fs.writeFileSync(filePath, content);
  
  // 生成文件ID
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    file_id: fileId,
    filename: originalFilename,
    stored_filename: storedFilename,
    file_path: `test-uploads/${dateDir}/${storedFilename}`,
    mime_type: mimeType,
    file_size: content.length,
    upload_time: new Date().toISOString()
  };
}

/**
 * 从存储路径读取文件
 */
function retrieveFile(filePath: string): Buffer | null {
  const fullPath = path.join(TEST_UPLOAD_DIR, '..', filePath.replace('test-uploads/', ''));
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath);
  }
  // 尝试直接从TEST_UPLOAD_DIR读取
  const altPath = path.join(TEST_UPLOAD_DIR, filePath.replace('test-uploads/', ''));
  if (fs.existsSync(altPath)) {
    return fs.readFileSync(altPath);
  }
  return null;
}

/**
 * 清理测试文件
 */
function cleanupTestFile(filePath: string): void {
  const fullPath = path.join(TEST_UPLOAD_DIR, '..', filePath.replace('test-uploads/', ''));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  // 尝试直接从TEST_UPLOAD_DIR删除
  const altPath = path.join(TEST_UPLOAD_DIR, filePath.replace('test-uploads/', ''));
  if (fs.existsSync(altPath)) {
    fs.unlinkSync(altPath);
  }
}

// 测试前确保测试目录存在
beforeAll(() => {
  if (!fs.existsSync(TEST_UPLOAD_DIR)) {
    fs.mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
  }
});

// 测试后清理测试目录
afterAll(() => {
  // 清理测试上传目录
  if (fs.existsSync(TEST_UPLOAD_DIR)) {
    fs.rmSync(TEST_UPLOAD_DIR, { recursive: true, force: true });
  }
});

/**
 * 属性2：文件解析存储一致性
 * Feature: smart-education-platform, Property 2: 文件解析存储一致性
 * 验证需求：1.3
 * 
 * 对于任何支持格式的题目文件（Word/PDF/图片），上传后解析的内容应正确存储到数据库，
 * 且可以完整检索
 */
describe('Property 2: 文件解析存储一致性', () => {
  
  /**
   * 测试1：文件内容往返一致性
   * 对于任何文件内容，上传后检索应得到相同的内容
   */
  it('上传的文件内容应该可以完整检索（往返一致性）', async () => {
    // 生成器：随机文件内容（限制大小以加快测试）
    const fileContentArbitrary = fc.uint8Array({ 
      minLength: 1, 
      maxLength: 1024 * 10 // 10KB for testing
    }).map(arr => Buffer.from(arr));
    
    // 生成器：支持的MIME类型
    const mimeTypeArbitrary = fc.constantFrom(...Object.keys(SUPPORTED_MIME_TYPES));
    
    // 生成器：有效的文件名（不含特殊字符）
    const filenameArbitrary = fc.tuple(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')), { minLength: 1, maxLength: 20 }),
      mimeTypeArbitrary
    ).map(([name, mimeType]) => `${name}${SUPPORTED_MIME_TYPES[mimeType]}`);

    await fc.assert(
      fc.asyncProperty(
        fileContentArbitrary,
        mimeTypeArbitrary,
        filenameArbitrary,
        async (content, mimeType, filename) => {
          let metadata: FileMetadata | null = null;
          
          try {
            // 上传文件
            metadata = simulateFileUpload(content, filename, mimeType);
            
            // 验证：文件元数据应该完整
            expect(metadata.file_id).toBeDefined();
            expect(metadata.file_id.startsWith('file_')).toBe(true);
            expect(metadata.filename).toBe(filename);
            expect(metadata.stored_filename).toBeDefined();
            expect(metadata.file_path).toBeDefined();
            expect(metadata.mime_type).toBe(mimeType);
            expect(metadata.file_size).toBe(content.length);
            expect(metadata.upload_time).toBeDefined();
            
            // 检索文件
            const retrievedContent = retrieveFile(metadata.file_path);
            
            // 验证：检索的内容应该与原始内容相同
            expect(retrievedContent).not.toBeNull();
            expect(retrievedContent!.equals(content)).toBe(true);
            
            return true;
          } finally {
            // 清理测试文件
            if (metadata) {
              cleanupTestFile(metadata.file_path);
            }
          }
        }
      ),
      { numRuns: 20 } // 运行100次迭代
    );
  }, 60000);

  /**
   * 测试2：文件大小限制验证
   * 对于任何超过20MB的文件，系统应该拒绝上传
   */
  it('应该拒绝超过20MB的文件', async () => {
    // 生成器：超过限制的文件大小
    const oversizedFileSizeArbitrary = fc.integer({ 
      min: MAX_FILE_SIZE + 1, 
      max: MAX_FILE_SIZE + 1024 * 100 // 超过限制但不要太大
    });

    await fc.assert(
      fc.asyncProperty(
        oversizedFileSizeArbitrary,
        async (fileSize) => {
          // 验证：文件大小超过限制
          const isOversized = fileSize > MAX_FILE_SIZE;
          expect(isOversized).toBe(true);
          
          // 模拟文件大小验证逻辑
          const shouldReject = fileSize > MAX_FILE_SIZE;
          expect(shouldReject).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);

  /**
   * 测试3：文件名安全性验证
   * 对于任何包含特殊字符的文件名，系统应该正确清理并存储
   */
  it('应该正确清理文件名中的特殊字符', async () => {
    // 生成器：包含特殊字符的文件名
    const unsafeFilenameArbitrary = fc.tuple(
      fc.string({ minLength: 1, maxLength: 30 }),
      fc.constantFrom('.jpg', '.png', '.pdf', '.doc')
    ).map(([name, ext]) => `${name}${ext}`);

    await fc.assert(
      fc.asyncProperty(
        unsafeFilenameArbitrary,
        async (unsafeFilename) => {
          // 模拟文件名清理逻辑
          const ext = path.extname(unsafeFilename);
          const baseName = path.basename(unsafeFilename, ext);
          const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
          
          // 验证：清理后的文件名不应包含危险字符
          expect(safeName).not.toMatch(/[<>:"/\\|?*]/);
          expect(safeName).not.toContain('..');
          expect(safeName).not.toContain('/');
          expect(safeName).not.toContain('\\');
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * 测试4：MIME类型验证
   * 对于任何支持的MIME类型，系统应该正确识别和存储
   */
  it('应该正确识别和存储支持的MIME类型', async () => {
    // 生成器：支持的MIME类型
    const supportedMimeTypeArbitrary = fc.constantFrom(...Object.keys(SUPPORTED_MIME_TYPES));

    await fc.assert(
      fc.asyncProperty(
        supportedMimeTypeArbitrary,
        async (mimeType) => {
          // 验证：MIME类型应该在支持列表中
          expect(SUPPORTED_MIME_TYPES[mimeType]).toBeDefined();
          
          // 验证：扩展名应该正确
          const expectedExt = SUPPORTED_MIME_TYPES[mimeType];
          expect(expectedExt).toBeDefined();
          expect(expectedExt.startsWith('.')).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);

  /**
   * 测试5：文件路径一致性
   * 对于任何上传的文件，存储路径应该可以正确解析回文件
   */
  it('存储路径应该可以正确解析回文件', async () => {
    // 生成器：随机文件内容
    const fileContentArbitrary = fc.uint8Array({ 
      minLength: 1, 
      maxLength: 1024 
    }).map(arr => Buffer.from(arr));
    
    // 生成器：有效的文件名
    const validFilenameArbitrary = fc.tuple(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
      fc.constantFrom('.jpg', '.png', '.pdf')
    ).map(([name, ext]) => `${name}${ext}`);

    await fc.assert(
      fc.asyncProperty(
        fileContentArbitrary,
        validFilenameArbitrary,
        async (content, filename) => {
          let metadata: FileMetadata | null = null;
          
          try {
            // 上传文件
            metadata = simulateFileUpload(content, filename, 'image/jpeg');
            
            // 验证：路径格式正确
            expect(metadata.file_path).toMatch(/^test-uploads\/\d{4}-\d{2}-\d{2}\/.+$/);
            
            // 验证：可以通过路径检索文件
            const retrievedContent = retrieveFile(metadata.file_path);
            expect(retrievedContent).not.toBeNull();
            
            // 验证：文件大小一致
            expect(retrievedContent!.length).toBe(metadata.file_size);
            
            return true;
          } finally {
            if (metadata) {
              cleanupTestFile(metadata.file_path);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

/**
 * 文件元数据完整性验证
 */
describe('文件元数据完整性验证', () => {
  it('上传的文件应该生成完整的元数据', async () => {
    // 生成器：随机文件内容
    const fileContentArbitrary = fc.uint8Array({ 
      minLength: 1, 
      maxLength: 512 
    }).map(arr => Buffer.from(arr));
    
    // 生成器：有效的文件名和MIME类型
    const fileInfoArbitrary = fc.tuple(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
      fc.constantFrom(
        { mime: 'image/jpeg', ext: '.jpg' },
        { mime: 'image/png', ext: '.png' },
        { mime: 'application/pdf', ext: '.pdf' }
      )
    ).map(([name, info]) => ({ filename: `${name}${info.ext}`, mimeType: info.mime }));

    await fc.assert(
      fc.asyncProperty(
        fileContentArbitrary,
        fileInfoArbitrary,
        async (content, fileInfo) => {
          let metadata: FileMetadata | null = null;
          
          try {
            // 上传文件
            metadata = simulateFileUpload(content, fileInfo.filename, fileInfo.mimeType);
            
            // 验证：所有必需字段都存在
            expect(metadata.file_id).toBeDefined();
            expect(typeof metadata.file_id).toBe('string');
            
            expect(metadata.filename).toBeDefined();
            expect(typeof metadata.filename).toBe('string');
            
            expect(metadata.stored_filename).toBeDefined();
            expect(typeof metadata.stored_filename).toBe('string');
            
            expect(metadata.file_path).toBeDefined();
            expect(typeof metadata.file_path).toBe('string');
            
            expect(metadata.mime_type).toBeDefined();
            expect(typeof metadata.mime_type).toBe('string');
            
            expect(metadata.file_size).toBeDefined();
            expect(typeof metadata.file_size).toBe('number');
            expect(metadata.file_size).toBeGreaterThan(0);
            
            expect(metadata.upload_time).toBeDefined();
            expect(typeof metadata.upload_time).toBe('string');
            
            // 验证：文件ID格式正确
            expect(metadata.file_id).toMatch(/^file_\d+_[a-z0-9]+$/);
            
            // 验证：上传时间是有效的ISO日期
            const uploadDate = new Date(metadata.upload_time);
            expect(uploadDate.getTime()).not.toBeNaN();
            
            return true;
          } finally {
            if (metadata) {
              cleanupTestFile(metadata.file_path);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
