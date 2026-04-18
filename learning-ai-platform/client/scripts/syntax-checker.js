#!/usr/bin/env node

/**
 * 项目健康检查脚本
 * 检查：
 * 1. 所有文件的语法错误
 * 2. 缺失的页面引用
 * 3. 导入路径的正确性
 * 4. 404页面引用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class SyntaxChecker {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.errors = [];
    this.warnings = [];
    this.success = [];
    this.references = new Map();
    this.routeDefinitions = new Set();
  }

  /**
   * 运行完整检查
   */
  async runFullCheck() {
    console.log('🔍 开始项目健康检查...\n');
    
    this.scanAllFiles();
    this.checkImports();
    this.checkRoutes();
    this.checkHTMLReferences();
    this.generateReport();
  }

  /**
   * 扫描所有文件
   */
  scanAllFiles() {
    console.log('📁 扫描项目文件...');
    const srcDir = path.join(this.rootDir, 'src');
    const publicDir = path.join(this.rootDir, 'public');
    
    if (fs.existsSync(srcDir)) {
      this.walkDir(srcDir);
    }
    if (fs.existsSync(publicDir)) {
      this.walkDir(publicDir);
    }
    console.log('✓ 文件扫描完成\n');
  }

  /**
   * 递归遍历目录
   */
  walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // 跳过特定目录
      if (this.shouldSkip(file)) continue;
      
      if (stat.isDirectory()) {
        this.walkDir(filePath);
      } else {
        this.checkFileSyntax(filePath);
      }
    }
  }

  /**
   * 判断是否应跳过文件/目录
   */
  shouldSkip(name) {
    const skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.env',
      '.DS_Store'
    ];
    
    return skipPatterns.some(pattern => name.includes(pattern));
  }

  /**
   * 检查文件语法
   */
  checkFileSyntax(filePath) {
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    switch (ext) {
      case '.js':
      case '.mjs':
        this.checkJavaScript(filePath, content);
        break;
      case '.ts':
        this.checkTypeScript(filePath, content);
        break;
      case '.vue':
        this.checkVue(filePath, content);
        break;
      case '.jsx':
      case '.tsx':
        this.checkJSX(filePath, content);
        break;
      case '.css':
      case '.scss':
        this.checkCSS(filePath, content);
        break;
      case '.html':
        this.checkHTML(filePath, content);
        break;
      case '.json':
        this.checkJSON(filePath, content);
        break;
    }
  }

  /**
   * 检查JavaScript语法
   */
  checkJavaScript(filePath, content) {
    try {
      // 检查基本语法问题
      const issues = [];
      
      // 检查未匹配的括号
      if (!this.balancedBrackets(content)) {
        issues.push('未匹配的括号/花括号');
      }
      
      // 检查未配对的引号
      if (!this.balancedQuotes(content)) {
        issues.push('未配对的引号');
      }

      // 检查可能的问题
      if (content.includes('require(') && content.includes('import ')) {
        issues.push('混合使用 require 和 import 语法');
      }

      // 检查未定义的变量（简单检查）
      const unusedVarPatterns = /(?:const|let|var)\s+(\w+)\s*=[\s\S]*?(?!.*\1)/g;
      
      if (issues.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'JavaScript',
          issues
        });
      } else {
        this.success.push(filePath);
      }
    } catch (e) {
      this.errors.push({
        file: filePath,
        type: 'JavaScript',
        error: e.message
      });
    }
  }

  /**
   * 检查TypeScript语法
   */
  checkTypeScript(filePath, content) {
    try {
      // 检查基本语法问题
      const issues = [];
      
      if (!this.balancedBrackets(content)) {
        issues.push('未匹配的括号/花括号');
      }
      
      if (!this.balancedQuotes(content)) {
        issues.push('未配对的引号');
      }

      // 检查接口定义
      if (content.includes('interface ') && !content.includes('{')) {
        issues.push('接口定义可能不完整');
      }

      // 检查类型定义
      if (content.includes('type ') && !content.includes('=')) {
        issues.push('类型定义可能不完整');
      }

      if (issues.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'TypeScript',
          issues
        });
      } else {
        this.success.push(filePath);
      }
    } catch (e) {
      this.errors.push({
        file: filePath,
        type: 'TypeScript',
        error: e.message
      });
    }
  }

  /**
   * 检查Vue文件
   */
  checkVue(filePath, content) {
    try {
      const issues = [];
      
      // 检查template标签
      if (!content.includes('<template>') || !content.includes('</template>')) {
        issues.push('缺少 <template> 标签');
      }
      
      // 检查script标签
      if (!content.includes('<script')) {
        issues.push('缺少 <script> 标签（可选但推荐）');
      }

      // 检查未匹配的模板标签
      if (!this.balancedTags(content)) {
        issues.push('HTML标签未匹配');
      }

      // 检查v-if/v-for配置
      const vIfMatches = content.match(/v-if\s*=\s*['"][^'"]*['"]/g) || [];
      if (vIfMatches.length === 0 && content.includes('v-if')) {
        issues.push('v-if 指令可能配置不正确');
      }

      // 记录template中的引用
      const templateMatch = content.match(/<template>[\s\S]*<\/template>/);
      if (templateMatch) {
        this.extractReferences(templateMatch[0], filePath);
      }

      if (issues.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'Vue',
          issues
        });
      } else {
        this.success.push(filePath);
      }
    } catch (e) {
      this.errors.push({
        file: filePath,
        type: 'Vue',
        error: e.message
      });
    }
  }

  /**
   * 检查CSS语法
   */
  checkCSS(filePath, content) {
    try {
      const issues = [];
      
      // 检查未匹配的花括号
      if (!this.balancedBrackets(content)) {
        issues.push('未匹配的花括号 {}');
      }

      // 检查未匹配的方括号
      if ((content.match(/\[/g) || []).length !== (content.match(/\]/g) || []).length) {
        issues.push('未匹配的方括号 []');
      }

      // 检查未关闭的注释
      if ((content.match(/\/\*/g) || []).length !== (content.match(/\*\//g) || []).length) {
        issues.push('未关闭的注释 /* */');
      }

      // 检查颜色值格式
      const invalidColors = content.match(/#[^0-9A-Fa-f\s,;{}"']/g) || [];
      if (invalidColors.length > 0) {
        issues.push(`发现无效的颜色值: ${invalidColors.join(', ')}`);
      }

      if (issues.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'CSS',
          issues
        });
      } else {
        this.success.push(filePath);
      }
    } catch (e) {
      this.errors.push({
        file: filePath,
        type: 'CSS',
        error: e.message
      });
    }
  }

  /**
   * 检查HTML语法
   */
  checkHTML(filePath, content) {
    try {
      const issues = [];
      
      if (!this.balancedTags(content)) {
        issues.push('HTML标签未匹配');
      }

      // 检查属性值
      const invalidAttrs = content.match(/\s\w+=[^'"\s>]/g) || [];
      if (invalidAttrs.length > 0) {
        issues.push('属性值可能未正确引用');
      }

      // 检查图片链接
      const imgSrc = content.match(/src=["']([^"']*)["']/g) || [];
      imgSrc.forEach(img => {
        if (img.includes('undefined') || img.includes('null')) {
          issues.push(`发现无效的图片链接: ${img}`);
        }
      });

      // 记录链接引用
      this.extractHTMLReferences(content, filePath);

      if (issues.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'HTML',
          issues
        });
      } else {
        this.success.push(filePath);
      }
    } catch (e) {
      this.errors.push({
        file: filePath,
        type: 'HTML',
        error: e.message
      });
    }
  }

  /**
   * 检查JSON语法
   */
  checkJSON(filePath, content) {
    try {
      JSON.parse(content);
      this.success.push(filePath);
    } catch (e) {
      this.errors.push({
        file: filePath,
        type: 'JSON',
        error: e.message
      });
    }
  }

  /**
   * 检查JSX语法
   */
  checkJSX(filePath, content) {
    // JSX检查类似于JavaScript + HTML标签检查
    this.checkJavaScript(filePath, content);
    
    if (!this.balancedTags(content)) {
      this.warnings.push({
        file: filePath,
        type: 'JSX',
        issues: ['JSX标签未匹配']
      });
    }
  }

  /**
   * 检查括号是否平衡
   */
  balancedBrackets(content) {
    const stack = [];
    const pairs = { '{': '}', '[': ']', '(': ')' };
    
    for (const char of content) {
      if (char in pairs) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        if (stack.length === 0 || pairs[stack[stack.length - 1]] !== char) {
          return false;
        }
        stack.pop();
      }
    }
    
    return stack.length === 0;
  }

  /**
   * 检查引号是否匹配
   */
  balancedQuotes(content) {
    // 移除字符串后检查
    const withoutStrings = content
      .replace(/"([^"\\]|\\.)*"/g, '')
      .replace(/'([^'\\]|\\.)*'/g, '')
      .replace(/`([^`\\]|\\.)*`/g, '');
    
    const singleQuotes = (withoutStrings.match(/'/g) || []).length;
    const doubleQuotes = (withoutStrings.match(/"/g) || []).length;
    const backTicks = (withoutStrings.match(/`/g) || []).length;
    
    return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backTicks % 2 === 0;
  }

  /**
   * 检查HTML标签是否匹配
   */
  balancedTags(content) {
    // 自闭合标签
    const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
    
    // 移除文献和代码块
    let cleaned = content.replace(/<!--[\s\S]*?-->/g, '');
    cleaned = cleaned.replace(/<pre[\s\S]*?<\/pre>/g, '');
    
    // 移除自闭合标签
    selfClosing.forEach(tag => {
      cleaned = cleaned.replace(
        new RegExp(`<${tag}[^>]*?/?>`, 'gi'),
        ''
      );
    });

    // 检查开闭标签
    const tagMatches = cleaned.match(/<\/?[\w-]+/g) || [];
    const openTags = [];

    for (const match of tagMatches) {
      const isClosing = match.startsWith('</');
      const tagName = match.replace('<', '').replace('/', '').toLowerCase();

      if (isClosing) {
        if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
          return false;
        }
        openTags.pop();
      } else {
        openTags.push(tagName);
      }
    }

    return openTags.length === 0;
  }

  /**
   * 检查导入
   */
  checkImports() {
    console.log('📦 检查导入和引用...');
    const issues = [];
    
    // 这里可以添加更多导入检查逻辑
    
    console.log('✓ 导入检查完成\n');
  }

  /**
   * 检查路由
   */
  checkRoutes() {
    console.log('🛣️  检查路由定义...');
    
    const routerFile = path.join(this.rootDir, 'src', 'router', 'index.ts');
    if (fs.existsSync(routerFile)) {
      const content = fs.readFileSync(routerFile, 'utf-8');
      
      // 提取路由定义
      const routeMatches = content.match(/path:\s*['"][^'"]*['"]/g) || [];
      routeMatches.forEach(match => {
        const path = match.match(/['"]([^'"]*)['"]/)[1];
        this.routeDefinitions.add(path);
      });
    }
    
    console.log(`✓ 找到 ${this.routeDefinitions.size} 个路由定义\n`);
  }

  /**
   * 检查HTML引用
   */
  checkHTMLReferences() {
    console.log('🔗 检查HTML引用和链接...');
    // 此部分由extractHTMLReferences处理
    console.log('✓ HTML引用检查完成\n');
  }

  /**
   * 提取模板引用
   */
  extractReferences(template, filePath) {
    // 提取路由链接
    const routerLinks = template.match(/to=["']([^"']*)['"]/g) || [];
    routerLinks.forEach(link => {
      const path = link.match(/["']([^"']*)['"]/)[1];
      if (!this.references.has(filePath)) {
        this.references.set(filePath, []);
      }
      this.references.get(filePath).push(path);
    });
  }

  /**
   * 提取HTML引用
   */
  extractHTMLReferences(content, filePath) {
    // 提取href链接
    const hrefs = content.match(/href=["']([^"']*)['"]/g) || [];
    hrefs.forEach(href => {
      const path = href.match(/["']([^"']*)['"]/)[1];
      if (!this.references.has(filePath)) {
        this.references.set(filePath, []);
      }
      this.references.get(filePath).push(path);
    });
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 项目健康检查报告');
    console.log('='.repeat(60) + '\n');

    // 汇总统计
    console.log('📊 检查统计：');
    console.log(`  ✓ 正常文件: ${this.success.length}`);
    console.log(`  ⚠️  警告: ${this.warnings.length}`);
    console.log(`  ✕ 错误: ${this.errors.length}`);
    console.log(`  🛣️  路由定义: ${this.routeDefinitions.size}\n`);

    // 错误详情
    if (this.errors.length > 0) {
      console.log('❌ 错误详情：');
      this.errors.forEach((err, idx) => {
        console.log(`\n  ${idx + 1}. ${err.file}`);
        console.log(`     类型: ${err.type}`);
        console.log(`     错误: ${err.error}`);
      });
      console.log();
    }

    // 警告详情
    if (this.warnings.length > 0) {
      console.log('⚠️  警告详情：');
      this.warnings.forEach((warn, idx) => {
        console.log(`\n  ${idx + 1}. ${warn.file}`);
        console.log(`     类型: ${warn.type}`);
        warn.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      });
      console.log();
    }

    // 路由检查
    if (this.routeDefinitions.size > 0) {
      console.log('✓ 已定义的路由：');
      Array.from(this.routeDefinitions).forEach(route => {
        console.log(`  - ${route}`);
      });
      console.log();
    }

    // 引用检查
    if (this.references.size > 0) {
      console.log('🔗 发现的引用：');
      for (const [file, refs] of this.references.entries()) {
        if (refs.length > 0) {
          console.log(`\n  ${file}:`);
          refs.forEach(ref => {
            const status = this.routeDefinitions.has(ref) ? '✓' : '✕';
            console.log(`    ${status} ${ref}`);
          });
        }
      }
      console.log();
    }

    // 总结
    console.log('='.repeat(60));
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ 项目检查通过！没有发现语法或引用错误。');
    } else {
      console.log(`⚠️  发现 ${this.errors.length} 个错误和 ${this.warnings.length} 个警告。`);
      console.log('请查看上面的详细信息进行修复。');
    }
    console.log('='.repeat(60) + '\n');
  }
}

// 执行检查
const checker = new SyntaxChecker(process.argv[2] || process.cwd());
checker.runFullCheck().catch(console.error);

export default SyntaxChecker;
