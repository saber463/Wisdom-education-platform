#!/usr/bin/env node

/**
 * 404 和页面引用检查脚本
 * 检查：
 * 1. 是否存在 NotFound.vue 页面
 * 2. 所有路由是否指向存在的页面
 * 3. 是否有 404 页面处理
 * 4. 所有页面文件是否被路由引用
 * 5. 自动生成路由完整性报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

class RouteChecker {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.pages = new Map(); // 所有页面文件
    this.routes = new Map(); // 所有路由定义
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log('🔍 开始 404 和路由完整性检查...\n');
    
    this.findAllPages();
    this.findAllRoutes();
    this.verifyRoutes();
    this.generateReport();
  }

  /**
   * 找到所有页面文件
   */
  findAllPages() {
    console.log('📄 扫描页面文件...');
    const viewsDir = path.join(this.rootDir, 'src', 'views');
    
    if (!fs.existsSync(viewsDir)) {
      this.errors.push('找不到 src/views 目录');
      return;
    }

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relative = path.relative(viewsDir, filePath);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.vue')) {
          this.pages.set(relative.replace(/\\/g, '/'), filePath);
        }
      }
    };

    walkDir(viewsDir);
    console.log(`✓ 找到 ${this.pages.size} 个页面文件\n`);
  }

  /**
   * 找到所有路由
   */
  findAllRoutes() {
    console.log('🛣️  扫描路由定义...');
    const routerDir = path.join(this.rootDir, 'src', 'router');
    
    if (!fs.existsSync(routerDir)) {
      this.errors.push('找不到 src/router 目录');
      return;
    }

    // 检查主路由文件
    const mainRouterFile = path.join(routerDir, 'index.ts');
    if (fs.existsSync(mainRouterFile)) {
      this.parseRoutes(mainRouterFile);
    }

    // 检查子路由文件
    const routesDir = path.join(routerDir, 'routes');
    if (fs.existsSync(routesDir)) {
      const files = fs.readdirSync(routesDir);
      for (const file of files) {
        if (file.endsWith('.ts')) {
          this.parseRoutes(path.join(routesDir, file));
        }
      }
    }

    console.log(`✓ 找到 ${this.routes.size} 个路由定义\n`);
  }

  /**
   * 解析路由文件
   */
  parseRoutes(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 提取路由定义（简单匹配）
    const routePatterns = [
      /path:\s*['"]([^'"]*)['"]/g,
      /component:\s*[=>\s]*(\w+|.*?)[,}]/g,
      /component:\s*\(\)\s*=>\s*import\(['"]([^'"]*)['"]\)/g
    ];

    // 提取路径
    let match;
    while ((match = routePatterns[0].exec(content)) !== null) {
      const path = match[1];
      if (path && !path.startsWith(':')) {
        this.routes.set(path, filePath);
      }
    }

    // 提取组件导入
    const componentMatches = content.match(/from\s+['"]([^'"]*\.vue)['"]/g) || [];
    componentMatches.forEach(comp => {
      const match = comp.match(/['"]([^'"]*\.vue)['"]/);
      if (match) {
        const componentPath = match[1];
        this.routes.set(componentPath, filePath);
      }
    });
  }

  /**
   * 验证路由的完整性
   */
  verifyRoutes() {
    console.log('✓ 验证路由完整性\n');
    
    const viewsDir = path.join(this.rootDir, 'src', 'views');
    let routedPages = new Set();
    let missingPages = [];
    let unusedPages = [];

    // 检查路由指向的页面是否存在
    for (const [route, file] of this.routes.entries()) {
      if (route.endsWith('.vue')) {
        const pagePath = route.replace('../views/', '').replace(/^\.\//, '');
        routedPages.add(pagePath);
        
        const fullPath = path.join(viewsDir, pagePath);
        if (!fs.existsSync(fullPath)) {
          this.warnings.push(`路由引用的页面不存在: ${pagePath} (来自 ${path.basename(file)})`);
        }
      }
    }

    // 检查是否存在 NotFound.vue
    const notFoundPath = path.join(viewsDir, 'NotFound.vue');
    if (!fs.existsSync(notFoundPath)) {
      this.errors.push('✗ 缺少 404 页面: src/views/NotFound.vue');
    } else {
      console.log('✓ 找到 404 页面: NotFound.vue');
    }

    // 检查是否有未使用的页面
    for (const [page, filePath] of this.pages.entries()) {
      if (!routedPages.has(page) && page !== 'NotFound.vue' && page !== 'ErrorTest.vue') {
        unusedPages.push(page);
      }
    }

    // 输出未使用的页面
    if (unusedPages.length > 0) {
      console.log(`⚠️  发现 ${unusedPages.length} 个未被路由引用的页面:`);
      unusedPages.forEach(page => {
        console.log(`   - ${page}`);
      });
      console.log();
    }
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('='.repeat(60));
    console.log('📋 404 和路由完整性报告');
    console.log('='.repeat(60) + '\n');

    // 摘要
    console.log('📊 摘要:');
    console.log(`  总页面数: ${this.pages.size}`);
    console.log(`  路由定义数: ${this.routes.size}`);
    console.log(`  错误数: ${this.errors.length}`);
    console.log(`  警告数: ${this.warnings.length}\n`);

    // 错误
    if (this.errors.length > 0) {
      console.log('❌ 错误:');
      this.errors.forEach(err => {
        console.log(`  ${err}`);
      });
      console.log();
    }

    // 警告
    if (this.warnings.length > 0) {
      console.log('⚠️  警告:');
      this.warnings.forEach(warn => {
        console.log(`  ${warn}`);
      });
      console.log();
    }

    // 页面列表
    if (this.pages.size > 0) {
      console.log('📄 页面列表:');
      const sortedPages = Array.from(this.pages.keys()).sort();
      sortedPages.forEach(page => {
        const isBad = page === 'NotFound.vue' ? '(404)' : '';
        console.log(`  ✓ ${page} ${isBad}`);
      });
      console.log();
    }

    // 建议
    console.log('💡 建议:');
    console.log('  1. 确保所有页面都在 router/index.ts 中定义');
    console.log('  2. 为所有路由定义提供正确的组件路径');
    console.log('  3. 在路由表末尾添加 catchall 404 处理:');
    console.log('     {');
    console.log('       path: "/:pathMatch(.*)*",');
    console.log('       name: "NotFound",');
    console.log('       component: () => import("../views/NotFound.vue")');
    console.log('     }');
    console.log('  4. 定期运行此检查脚本验证路由完整性\n');

    // 总结
    console.log('='.repeat(60));
    if (this.errors.length === 0) {
      console.log('✅ 路由配置检查通过！');
    } else {
      console.log('❌ 发现问题！请查看上面的详情。');
    }
    console.log('='.repeat(60) + '\n');
  }
}

// 执行检查
const checker = new RouteChecker(projectRoot);
checker.run().catch(console.error);
