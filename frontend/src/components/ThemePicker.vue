<template>
  <!-- 触发按钮 -->
  <div class="theme-trigger" @click="open = true" title="切换主题">
    <PaintBrushIcon class="trigger-icon" />
    <span class="trigger-label">主题</span>
  </div>

  <!-- 主题选择抽屉 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="theme-overlay" @click.self="open = false">
        <div class="theme-drawer">
          <!-- 顶部 -->
          <div class="drawer-head">
            <div class="drawer-title">
              <PaintBrushIcon class="head-icon" />
              <span>主题风格</span>
            </div>
            <button class="close-btn" @click="open = false">
              <XMarkIcon class="close-icon" />
            </button>
          </div>

          <!-- 主题卡片列表 -->
          <div class="theme-list">
            <div
              v-for="t in THEMES"
              :key="t.id"
              class="theme-card"
              :class="{ active: currentThemeId === t.id, preview: hoveredId === t.id }"
              :style="cardStyle(t)"
              @mouseenter="startPreview(t.id)"
              @mouseleave="stopPreview"
              @click="select(t.id)"
            >
              <!-- 色块预览条 -->
              <div class="color-bar" :style="{ background: t.colors.gradient }" />

              <!-- 缩略 UI 预览 -->
              <div class="mini-ui" :style="{ background: t.colors.bg }">
                <!-- 迷你侧边栏 -->
                <div class="mini-sidebar" :style="{ background: t.colors.sidebar }">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="mini-nav-item"
                    :style="{
                      background: i === 1 ? t.colors.primary + '25' : 'transparent',
                      borderLeft: i === 1 ? `2px solid ${t.colors.primary}` : '2px solid transparent',
                    }"
                  />
                </div>
                <!-- 迷你内容区 -->
                <div class="mini-body">
                  <div class="mini-topbar" :style="{ background: t.colors.card, borderBottom: `1px solid ${t.colors.border}` }" />
                  <div class="mini-cards">
                    <div
                      v-for="j in 4"
                      :key="j"
                      class="mini-card"
                      :style="{ background: t.colors.card, border: `1px solid ${t.colors.border}` }"
                    >
                      <div class="mini-bar" :style="{ background: t.colors.primary, width: `${40 + j * 12}%`, opacity: 0.7 }" />
                      <div class="mini-bar mini-bar-sm" :style="{ background: t.colors.textMuted, width: `${60 + j * 5}%`, opacity: 0.3 }" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 信息 -->
              <div class="card-info" :style="{ color: t.dark ? '#E0E0E0' : '#1F2937' }">
                <div class="card-name">{{ t.name }}</div>
                <div class="card-desc" :style="{ color: t.dark ? '#606060' : '#9CA3AF' }">{{ t.desc }}</div>
              </div>

              <!-- 选中标记 -->
              <div v-if="currentThemeId === t.id" class="check-mark" :style="{ background: t.colors.gradient }">
                <CheckIcon class="check-icon" />
              </div>

              <!-- 悬停提示 -->
              <div v-if="hoveredId === t.id && currentThemeId !== t.id" class="hover-tip" :style="{ color: t.colors.primary }">
                点击应用
              </div>
            </div>
          </div>

          <!-- 底部当前主题说明 -->
          <div class="drawer-footer">
            <span class="footer-label">当前主题：</span>
            <span class="footer-val" :style="{ color: themeStore.currentTheme().colors.primary }">
              {{ themeStore.currentTheme().name }}
            </span>
            <span class="footer-mode">
              {{ themeStore.currentTheme().dark ? '· 深色' : '· 浅色' }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PaintBrushIcon, XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useThemeStore, THEMES, type ThemeId, type ThemeConfig } from '@/stores/theme'

const themeStore = useThemeStore()
const { currentThemeId, setTheme } = themeStore

const open = ref(false)
const hoveredId = ref<ThemeId | null>(null)
let previewTimer: ReturnType<typeof setTimeout> | null = null

function startPreview(id: ThemeId) {
  hoveredId.value = id
  // 悬停 300ms 后实时预览
  previewTimer = setTimeout(() => {
    if (hoveredId.value === id) themeStore.setTheme(id)
  }, 300)
}

function stopPreview() {
  if (previewTimer) clearTimeout(previewTimer)
  hoveredId.value = null
  // 恢复当前主题（如果和选中不一致）
  themeStore.setTheme(currentThemeId as unknown as ThemeId)
}

function select(id: ThemeId) {
  if (previewTimer) clearTimeout(previewTimer)
  hoveredId.value = null
  setTheme(id)
  open.value = false
}

function cardStyle(t: ThemeConfig) {
  return {
    background: t.dark ? '#1a1a1a' : '#ffffff',
    border: currentThemeId === t.id
      ? `2px solid ${t.colors.primary}`
      : t.dark ? '2px solid rgba(255,255,255,0.06)' : '2px solid rgba(0,0,0,0.08)',
    boxShadow: currentThemeId === t.id
      ? `0 0 20px ${t.colors.primary}40`
      : 'none',
  }
}
</script>

<style scoped>
/* ── 触发按钮 ── */
.theme-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  margin: 4px 10px;
}
.theme-trigger:hover {
  background: rgba(128,128,128,0.1);
  color: var(--text-primary);
}
.trigger-icon { width: 18px; height: 18px; flex-shrink: 0; }
.trigger-label { font-size: 14px; font-weight: 500; }

/* ── 遮罩层 ── */
.theme-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

/* ── 抽屉 ── */
.theme-drawer {
  width: 480px;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 头部 ── */
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color-dim);
  flex-shrink: 0;
}
.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}
.head-icon { width: 22px; height: 22px; color: var(--color-primary); }
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s;
  color: var(--text-muted);
}
.close-btn:hover { background: rgba(128,128,128,0.15); }
.close-icon { width: 20px; height: 20px; }

/* ── 主题列表 ── */
.theme-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  scrollbar-width: thin;
}

/* ── 主题卡片 ── */
.theme-card {
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  position: relative;
  transform: scale(1);
}
.theme-card:hover {
  transform: scale(1.025) translateY(-2px);
}
.theme-card.active {
  transform: scale(1.02);
}

/* 色块条 */
.color-bar {
  height: 5px;
  width: 100%;
}

/* 迷你 UI 预览 */
.mini-ui {
  display: flex;
  height: 90px;
  overflow: hidden;
}
.mini-sidebar {
  width: 28px;
  flex-shrink: 0;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mini-nav-item {
  height: 6px;
  border-radius: 3px;
  margin-left: 2px;
  transition: all 0.2s;
}
.mini-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.mini-topbar {
  height: 14px;
  flex-shrink: 0;
}
.mini-cards {
  flex: 1;
  padding: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
}
.mini-card {
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.mini-bar {
  height: 4px;
  border-radius: 2px;
}
.mini-bar-sm {
  height: 3px;
}

/* 卡片信息 */
.card-info {
  padding: 10px 12px;
}
.card-name {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 2px;
}
.card-desc {
  font-size: 10px;
  line-height: 1.4;
}

/* 选中标记 */
.check-mark {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.check-icon { width: 13px; height: 13px; color: #000; stroke-width: 3; }

/* 悬停提示 */
.hover-tip {
  position: absolute;
  bottom: 38px;
  right: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

/* ── 底部 ── */
.drawer-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border-color-dim);
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.footer-label { color: var(--text-muted); }
.footer-val { font-weight: 700; }
.footer-mode { color: var(--text-muted); margin-left: 4px; }

/* ── 动画 ── */
.drawer-enter-active,
.drawer-leave-active { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
.drawer-enter-from { opacity: 0; }
.drawer-enter-from .theme-drawer { transform: translateX(100%); }
.drawer-leave-to { opacity: 0; }
.drawer-leave-to .theme-drawer { transform: translateX(100%); }
</style>
