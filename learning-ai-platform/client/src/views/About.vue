<template>
  <div class="about-page max-w-4xl mx-auto py-8">
    <div class="bg-gray-800/80 rounded-2xl p-8 border border-gray-700">
      <h1 class="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <i class="fa fa-graduation-cap text-purple-400"></i>
        关于平台
      </h1>

      <div class="space-y-8">
        <!-- 平台介绍 -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">平台简介</h2>
          <p class="text-gray-300 leading-relaxed">
            AI 学习助手是一款基于人工智能技术的智能学习平台，致力于为每一位学习者提供个性化、高效的学习体验。我们整合了先进的AI算法与优质教育资源，帮助用户规划学习路径、提升学习效率。
          </p>
        </section>

        <!-- 核心技术 -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">核心技术</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-700/50 rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <i class="fa fa-brain text-2xl text-purple-400"></i>
                <h3 class="font-medium text-white">AI智能推荐</h3>
              </div>
              <p class="text-sm text-gray-400">基于用户画像和学习行为，智能推荐最适合的学习内容</p>
            </div>
            <div class="bg-gray-700/50 rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <i class="fa fa-road text-2xl text-blue-400"></i>
                <h3 class="font-medium text-white">学习路径规划</h3>
              </div>
              <p class="text-sm text-gray-400">根据学习目标和时间，生成科学合理的学习计划</p>
            </div>
            <div class="bg-gray-700/50 rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <i class="fa fa-database text-2xl text-green-400"></i>
                <h3 class="font-medium text-white">知识图谱</h3>
              </div>
              <p class="text-sm text-gray-400">构建完整的知识体系，帮助用户建立系统化认知</p>
            </div>
            <div class="bg-gray-700/50 rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <i class="fa fa-chart-line text-2xl text-yellow-400"></i>
                <h3 class="font-medium text-white">学习评估</h3>
              </div>
              <p class="text-sm text-gray-400">多维度评估学习效果，及时调整学习策略</p>
            </div>
          </div>
        </section>

        <!-- 产品功能 -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">主要功能</h2>
          <ul class="space-y-3">
            <li class="flex items-start gap-3">
              <i class="fa fa-check-circle text-green-400 mt-1"></i>
              <div>
                <span class="text-white font-medium">AI学习路径生成</span>
                <p class="text-sm text-gray-400">根据您的学习目标和时间，AI自动生成个性化学习计划</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <i class="fa fa-check-circle text-green-400 mt-1"></i>
              <div>
                <span class="text-white font-medium">开发者路线图</span>
                <p class="text-sm text-gray-400">提供前端、后端、DevOps等多种技术路线图</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <i class="fa fa-check-circle text-green-400 mt-1"></i>
              <div>
                <span class="text-white font-medium">代码生成器</span>
                <p class="text-sm text-gray-400">AI辅助代码生成，支持多种编程语言和框架</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <i class="fa fa-check-circle text-green-400 mt-1"></i>
              <div>
                <span class="text-white font-medium">学习评估系统</span>
                <p class="text-sm text-gray-400">全面的知识点测试，检验学习效果</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <i class="fa fa-check-circle text-green-400 mt-1"></i>
              <div>
                <span class="text-white font-medium">知识库</span>
                <p class="text-sm text-gray-400">丰富的编程知识库，涵盖各主流技术的详细教程</p>
              </div>
            </li>
          </ul>
        </section>

        <!-- 团队信息 -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">团队介绍</h2>
          <p class="text-gray-300 leading-relaxed">
            我们是一支专注于教育科技领域的创业团队，成员来自知名互联网公司和教育机构。我们相信AI技术可以为教育赋能，让每个人都能享受到优质的学习资源。
          </p>
        </section>

        <!-- 版本信息 -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">版本信息</h2>
          <div class="bg-gray-700/50 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-400">当前版本</span>
              <span class="text-white font-mono">v2.1.0</span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-gray-400">更新日期</span>
              <span class="text-white">2025-01-15</span>
            </div>
          </div>
        </section>

        <!-- 统计数据 -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">平台数据</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 text-center border border-purple-500/30">
              <div class="text-3xl font-bold text-purple-400">10,000+</div>
              <div class="text-sm text-gray-400">注册用户</div>
            </div>
            <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 text-center border border-blue-500/30">
              <div class="text-3xl font-bold text-blue-400">500+</div>
              <div class="text-sm text-gray-400">学习路径</div>
            </div>
            <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 text-center border border-green-500/30">
              <div class="text-3xl font-bold text-green-400">98%</div>
              <div class="text-sm text-gray-400">用户满意度</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
