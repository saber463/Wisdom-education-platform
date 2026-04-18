# 教育科技感UI设计系统文档

## 📋 项目概述
本文档定义了学习AI平台的教育科技感UI设计系统，旨在提供现代、专业、科技感的用户界面。

---

## 🎨 设计理念

### 核心值
- **科技感** - 采用未来感的设计语言和渐变色
- **教育友好** - 清晰的信息层级和易用性
- **包容性** - 支持无障碍访问和多语言
- **性能优先** - 轻量级的动画和加载效果

---

## 🌈 色彩系统

### 主色板

| 名称 | 颜色值 | 用途 | RGB |
|-----|------|------|-----|
| 主蓝 | `#0D47A1` | 主要操作、核心功能 | 13, 71, 161 |
| 亮蓝 | `#1E88E5` | 链接、按钮悬停 | 30, 136, 229 |
| 科技蓝 | `#00BCD4` | 强调、突出显示 | 0, 188, 212 |
| 成功绿 | `#4CAF50` | 成功状态、通过 | 76, 175, 80 |
| 警告黄 | `#FFC107` | 警告、进行中 | 255, 193, 7 |
| 错误红 | `#F44336` | 错误、删除 | 244, 67, 54 |
| 中立灰 | `#9E9E9E` | 禁用、次要文本 | 158, 158, 158 |

### 渐变系列

```css
/* 科技渐变 */
background: linear-gradient(135deg, #0D47A1 0%, #00BCD4 100%);

/* 学习路径渐变 */
background: linear-gradient(90deg, #1E88E5 0%, #26C6DA 50%, #4CAF50 100%);

/* 深色渐变 */
background: linear-gradient(180deg, #001A33 0%, #0D47A1 100%);

/* 彩虹渐变 */
background: linear-gradient(90deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7);
```

---

## 🔤 字体系统

### 字体族
```css
--font-family-primary: 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
--font-family-mono: 'Courier New', 'Monaco', 'Source Code Pro', monospace;
```

### 字体大小规范

| 级别 | 大小 | 用途 | 行高 |
|-----|------|------|-----|
| H1 | 36px | 页面标题 | 1.3 |
| H2 | 28px | 模块标题 | 1.35 |
| H3 | 24px | 分类标题 | 1.4 |
| H4 | 20px | 卡片标题 | 1.4 |
| 正文 | 16px | 主要内容 | 1.5 |
| 小号 | 14px | 次要信息 | 1.4 |
| 细号 | 12px | 标签/提示 | 1.3 |

### 字重
- **Light**: 300 - 辅助文本
- **Regular**: 400 - 正文
- **Medium**: 500 - 强调文本
- **Bold**: 700 - 标题

---

## 📦 组件库

### 1. 按钮组件 (Button)

#### 大小规范
```
Small:   8px 16px, 14px font
Medium:  12px 24px, 16px font (默认)
Large:   16px 32px, 18px font
```

#### 状态
```
Primary    - 主操作
Secondary  - 次操作
Success    - 成功操作
Warning    - 警告操作
Danger     - 危险操作
Ghost      - 幽灵按钮
Disabled   - 禁用状态
Loading    - 加载状态
```

#### 样式示例
```css
.btn-primary {
  background: linear-gradient(135deg, #1E88E5, #00BCD4);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(30, 136, 229, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(30, 136, 229, 0.6);
}
```

### 2. 卡片组件 (Card)

#### 样式规范
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}
```

#### 卡片类型
- **信息卡** - 显示课程/内容信息
- **进度卡** - 显示学习进度
- **成就卡** - 显示成就徽章
- **教师卡** - 显示教师信息
- **统计卡** - 显示数据统计

### 3. 输入框组件 (Input)

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #1E88E5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
  outline: none;
}

.input::placeholder {
  color: #9E9E9E;
}
```

### 4. 导航栏 (Navigation)

```css
.navbar {
  background: linear-gradient(90deg, #0D47A1, #1565C0);
  color: white;
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-item {
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.3s ease;
}

.navbar-item:hover,
.navbar-item.active {
  color: white;
  border-bottom: 3px solid #00BCD4;
}
```

### 5. 进度条 (Progress Bar)

```css
.progress-container {
  width: 100%;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1E88E5, #00BCD4);
  border-radius: 4px;
  animation: slideIn 0.6s ease;
}

@keyframes slideIn {
  from { width: 0; }
}
```

### 6. 徽章 (Badge)

```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge.success { background: #E8F5E9; color: #2E7D32; }
.badge.warning { background: #FFF3E0; color: #E65100; }
.badge.error { background: #FFEBEE; color: #C62828; }
.badge.info { background: #E3F2FD; color: #0D47A1; }
```

### 7. 模态框 (Modal)

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 📐 间距系统 (Spacing Scale)

```css
--spacing-xs: 4px;   /* 1 unit */
--spacing-sm: 8px;   /* 2 units */
--spacing-md: 16px;  /* 4 units */
--spacing-lg: 24px;  /* 6 units */
--spacing-xl: 32px;  /* 8 units */
--spacing-2xl: 48px; /* 12 units */
--spacing-3xl: 64px; /* 16 units */
```

---

## 🎬 动画系统

### 过渡时长
```css
--transition-fast: 150ms;
--transition-normal: 300ms;
--transition-slow: 500ms;
```

### 缓动函数
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### 常用动画

#### 淡入淡出
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### 滑入滑出
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 脉冲
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### 旋转加载
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 📱 响应式设计

### 断点规范
```css
--breakpoint-xs: 0;      /* 超小屏 */
--breakpoint-sm: 576px;  /* 小屏 */
--breakpoint-md: 768px;  /* 中屏 */
--breakpoint-lg: 992px;  /* 大屏 */
--breakpoint-xl: 1200px; /* 超大屏 */
--breakpoint-2xl: 1400px; /* 巨屏 */
```

### 栅栏系统
```css
/* 12列栅栏系统 */
.col-xs-12 { width: 100%; }
.col-sm-6  { width: 50%; }
.col-md-4  { width: 33.333%; }
.col-lg-3  { width: 25%; }
.col-xl-2  { width: 16.666%; }
```

---

## 🌙 深色模式 (Dark Mode)

### 深色色板
```css
--bg-dark-primary: #1A1A2E;
--bg-dark-secondary: #16213E;
--bg-dark-tertiary: #0F3460;
--text-dark-primary: #FFFFFF;
--text-dark-secondary: #E0E0E0;
--text-dark-tertiary: #9E9E9E;
--border-dark: #2C2C3C;
```

---

## ♿ 无障碍设计 (Accessibility)

### 对比度标准
- **大文本** (18pt+): 最低 3:1 对比度
- **常规文本**: 最低 4.5:1 对比度
- **UI 组件**: 最小 3:1 对比度

### 键盘导航
```css
/* 可聚焦元素 */
*:focus {
  outline: 2px solid #0D47A1;
  outline-offset: 2px;
}

/* 禁用 outline 时的替代方案 */
*:focus-visible {
  outline: 2px solid #0D47A1;
  outline-offset: 2px;
}
```

### ARIA 标签
- 为所有交互元素添加 `aria-label`
- 为表单字段添加关联的 `<label>`
- 使用语义化 HTML

---

## 📊 数据可视化

### 图表颜色方案
```css
--chart-series-1: #1E88E5;
--chart-series-2: #00BCD4;
--chart-series-3: #26C6DA;
--chart-series-4: #4CAF50;
--chart-series-5: #FFB300;
--chart-series-6: #FF6F00;
```

---

## ✨ 特殊效果

### 玻璃态 (Glassmorphism)
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 新态 (Neumorphism)
```css
.neumorphic {
  background: #E0E5EC;
  box-shadow: 9px 9px 16px #A3B1C6, -9px -9px 16px #FFFFFF;
  border-radius: 20px;
}
```

---

## 🔗 最佳实践

1. **一致性** - 在整个应用中保持设计一致
2. **性能** - 优化动画，避免过度设计
3. **可读性** - 确保足够的对比度和字体大小
4. **响应式** - 在所有设备上测试
5. **无障碍** - 遵循 WCAG 2.1 指南
6. **性能** - 使用 CSS 变量和类，避免内联样式
7. **文档** - 保持设计文档的最新状态

---

## 📚 参考资源

- [Material Design 3](https://material.io/design)
- [Tailwind CSS](https://tailwindcss.com)
- [Element Plus](https://element-plus.org)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Accessibility](https://webaccessibility.withgoogle.com/)

---

**最后更新**: 2026-04-15  
**设计系统版本**: 1.0.0
