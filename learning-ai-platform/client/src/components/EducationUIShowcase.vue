<template>
  <div class="education-ui-showcase">
    <!-- 1. 导航栏示例 -->
    <nav class="navbar">
      <div class="navbar-brand">
        <span>🎓 学习AI平台</span>
      </div>
      <ul class="navbar-nav">
        <li class="navbar-item active">首页</li>
        <li class="navbar-item">课程</li>
        <li class="navbar-item">统计</li>
        <li class="navbar-item">个人中心</li>
      </ul>
    </nav>

    <!-- 2. 主容器 -->
    <div class="container mt-lg p-lg">
      <!-- 标题部分 -->
      <div class="mb-lg">
        <h1>教育科技感UI设计系统展示</h1>
        <p class="text-muted">完整的组件库和样式系统演示</p>
      </div>

      <!-- 3. 按钮组件演示 -->
      <section class="card mb-lg">
        <div class="card-header">
          <h3 class="card-title">按钮组件</h3>
        </div>
        <div class="card-content">
          <div class="flex-center gap-md mb-md flex-wrap">
            <button class="btn btn-primary">主按钮</button>
            <button class="btn btn-secondary">次按钮</button>
            <button class="btn btn-success">成功</button>
            <button class="btn btn-warning">警告</button>
            <button class="btn btn-danger">删除</button>
            <button class="btn btn-ghost">幽灵</button>
          </div>
          <div class="flex-center gap-md flex-wrap">
            <button class="btn btn-sm btn-primary">小按钮</button>
            <button class="btn btn-md btn-primary">中按钮</button>
            <button class="btn btn-lg btn-primary">大按钮</button>
            <button class="btn btn-primary" disabled>禁用</button>
          </div>
        </div>
      </section>

      <!-- 4. 卡片组件演示 -->
      <section class="mb-lg">
        <h3 class="mb-md">卡片组件</h3>
        <div class="grid grid-cols-3">
          <!-- 卡片1 - 课程信息 -->
          <div class="card gradient">
            <div class="card-header">
              <h4 class="card-title">📚 Python基础</h4>
            </div>
            <div class="card-content">
              <p class="text-muted">学习Python编程基础</p>
              <div class="progress mt-md mb-md">
                <div class="progress-bar" style="width: 65%"></div>
              </div>
              <div class="flex-between text-muted text-sm">
                <span>进度: 65%</span>
                <span>12/18 课时</span>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-sm btn-primary">继续学习</button>
            </div>
          </div>

          <!-- 卡片2 - 成就 -->
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">🏆 成就徽章</h4>
            </div>
            <div class="card-content">
              <div style="text-align: center; line-height: 2;">
                <p style="font-size: 48px; margin: 10px 0;">⭐</p>
                <p>学习勤奋奖</p>
                <small class="text-muted">已解锁</small>
              </div>
            </div>
          </div>

          <!-- 卡片3 - 进度统计 -->
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">📊 本周统计</h4>
            </div>
            <div class="card-content">
              <div class="mb-md">
                <div class="flex-between text-sm mb-xs">
                  <span>学习时长</span>
                  <span class="text-primary">12小时</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: 60%"></div>
                </div>
              </div>
              <div>
                <div class="flex-between text-sm mb-xs">
                  <span>完成课时</span>
                  <span class="text-primary">8/10</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: 80%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. 徽章和标签 -->
      <section class="card mb-lg">
        <div class="card-header">
          <h3 class="card-title">徽章 (Badges)</h3>
        </div>
        <div class="card-content">
          <div class="flex-center gap-md flex-wrap">
            <span class="badge badge-primary">推荐</span>
            <span class="badge badge-success">已完成</span>
            <span class="badge badge-warning">进行中</span>
            <span class="badge badge-error">已过期</span>
            <span class="badge badge-info">新课程</span>
          </div>
        </div>
      </section>

      <!-- 6. 告警/通知 -->
      <section class="card mb-lg">
        <div class="card-header">
          <h3 class="card-title">通知/告警</h3>
        </div>
        <div class="card-content">
          <div class="alert alert-primary">
            <span>ℹ️</span>
            <div>
              <div class="alert-title">信息提示</div>
              <p>这是一条信息提示，用于通知用户重要信息。</p>
            </div>
          </div>

          <div class="alert alert-success">
            <span>✓</span>
            <div>
              <div class="alert-title">成功</div>
              <p>恭喜！您的操作已成功完成。</p>
            </div>
          </div>

          <div class="alert alert-warning">
            <span>⚠️</span>
            <div>
              <div class="alert-title">警告</div>
              <p>请注意：这个操作需要您的确认。</p>
            </div>
          </div>

          <div class="alert alert-error">
            <span>✕</span>
            <div>
              <div class="alert-title">错误</div>
              <p>操作失败，请检查您的输入。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. 表单示例 -->
      <section class="card mb-lg">
        <div class="card-header">
          <h3 class="card-title">表单控件</h3>
        </div>
        <div class="card-content">
          <div class="mb-md">
            <label class="text-primary font-weight-medium mb-sm block">用户名</label>
            <input type="text" class="input" placeholder="请输入用户名">
          </div>

          <div class="mb-md">
            <label class="text-primary font-weight-medium mb-sm block">邮箱</label>
            <input type="email" class="input" placeholder="请输入邮箱地址">
          </div>

          <div class="mb-md">
            <label class="text-primary font-weight-medium mb-sm block">选择课程</label>
            <select class="input">
              <option>请选择课程</option>
              <option>Python基础</option>
              <option>Web开发</option>
              <option>数据科学</option>
              <option>AI机器学习</option>
            </select>
          </div>

          <div class="mb-md">
            <label class="text-primary font-weight-medium mb-sm block">学习备注</label>
            <textarea class="input" rows="4" placeholder="请输入您的学习备注..."></textarea>
          </div>

          <div class="flex-center gap-md justify-end">
            <button class="btn btn-secondary">取消</button>
            <button class="btn btn-primary">提交</button>
          </div>
        </div>
      </section>

      <!-- 8. 响应式网格 -->
      <section class="mb-lg">
        <h3 class="mb-md">响应式网格系统</h3>
        <div class="grid grid-cols-4">
          <div class="card bg-light">
            <p class="text-center text-muted">列 1</p>
          </div>
          <div class="card bg-light">
            <p class="text-center text-muted">列 2</p>
          </div>
          <div class="card bg-light">
            <p class="text-center text-muted">列 3</p>
          </div>
          <div class="card bg-light">
            <p class="text-center text-muted">列 4</p>
          </div>
        </div>
      </section>

      <!-- 9. 渐变背景 -->
      <section class="card mb-lg" style="background: linear-gradient(135deg, #0D47A1 0%, #00BCD4 100%); color: white;">
        <h3 style="color: white; margin-bottom: 16px;">🎯 特殊效果</h3>
        <p>这是一个具有科技感渐变背景的卡片，展示了教育科技感UI的视觉效果。</p>
        <p style="margin-top: 16px;">✨ 采用现代化的设计语言，提升用户体验</p>
      </section>

      <!-- 10. 按钮合集 -->
      <section class="card">
        <div class="card-header">
          <h3 class="card-title">完整操作流程示例</h3>
        </div>
        <div class="card-content">
          <p class="mb-md">选择您的学习方式：</p>
          <div class="flex-center gap-md flex-wrap">
            <button class="btn btn-lg btn-primary">
              📚 开始学习
            </button>
            <button class="btn btn-lg btn-secondary">
              💬 查看讨论
            </button>
            <button class="btn btn-lg btn-success">
              ⭐ 提交作业
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- 页脚 -->
    <footer style="background: linear-gradient(90deg, #0D47A1, #1565C0); color: white; padding: 32px 24px; text-align: center; margin-top: 32px;">
      <p>© 2026 学习AI平台 | 教育科技感UI设计系统 v1.0</p>
      <small>设计系统提供完整的组件库和样式规范</small>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 此组件完全使用CSS类和HTML元素
// 不需要额外的JavaScript逻辑
</script>

<style scoped>
/* 容器样式 */
.education-ui-showcase {
  min-height: 100vh;
  background: #FAFAFA;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 辅助类 */
.flex-wrap {
  flex-wrap: wrap;
}

.justify-end {
  justify-content: flex-end;
}

.text-center {
  text-align: center;
}

.text-sm {
  font-size: 14px;
}

.block {
  display: block;
}

.font-weight-medium {
  font-weight: 500;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.education-ui-showcase {
  animation: fadeIn 0.5s ease-in;
}
</style>
