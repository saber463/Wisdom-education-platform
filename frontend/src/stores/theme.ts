import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeId = 'neon' | 'indigo' | 'edu' | 'forest'

export interface ThemeConfig {
  id: ThemeId
  name: string
  desc: string
  dark: boolean
  colors: {
    primary: string
    secondary: string
    bg: string
    card: string
    sidebar: string
    text: string
    textMuted: string
    border: string
    gradient: string
  }
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'neon',
    name: '霓虹极客',
    desc: '黑马程序员风格，#1E1E1E + 霓虹绿，高科技感',
    dark: true,
    colors: {
      primary: '#00FF94',
      secondary: '#00D4FF',
      bg: '#1E1E1E',
      card: '#252525',
      sidebar: '#111111',
      text: '#F0F0F0',
      textMuted: '#606060',
      border: 'rgba(0,255,148,0.15)',
      gradient: 'linear-gradient(135deg,#00FF94,#00D4FF)',
    },
  },
  {
    id: 'indigo',
    name: '深空蓝紫',
    desc: '深色蓝紫渐变，类 Linear / GitHub Dark，更沉稳高级',
    dark: true,
    colors: {
      primary: '#818CF8',
      secondary: '#38BDF8',
      bg: '#0D1117',
      card: '#161B27',
      sidebar: '#090D14',
      text: '#E6EDF3',
      textMuted: '#636E7B',
      border: 'rgba(129,140,248,0.18)',
      gradient: 'linear-gradient(135deg,#818CF8,#38BDF8)',
    },
  },
  {
    id: 'edu',
    name: '活力教育',
    desc: '白底橙色，Duolingo 风格，年轻活泼，适合学生',
    dark: false,
    colors: {
      primary: '#F97316',
      secondary: '#FBBF24',
      bg: '#F9FAFB',
      card: '#FFFFFF',
      sidebar: '#FFFFFF',
      text: '#1F2937',
      textMuted: '#9CA3AF',
      border: 'rgba(249,115,22,0.2)',
      gradient: 'linear-gradient(135deg,#F97316,#FBBF24)',
    },
  },
  {
    id: 'forest',
    name: '墨绿学术',
    desc: '深绿底色，翠绿发光，沉稳大气，适合比赛展示',
    dark: true,
    colors: {
      primary: '#22C55E',
      secondary: '#A3E635',
      bg: '#0F1F0F',
      card: '#162316',
      sidebar: '#0A150A',
      text: '#DCFCE7',
      textMuted: '#4B7A50',
      border: 'rgba(34,197,94,0.18)',
      gradient: 'linear-gradient(135deg,#22C55E,#A3E635)',
    },
  },
]

const STORAGE_KEY = 'edu_theme'

export const useThemeStore = defineStore('theme', () => {
  const currentThemeId = ref<ThemeId>(
    (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'neon'
  )

  function applyTheme(id: ThemeId) {
    const t = THEMES.find((t) => t.id === id)
    if (!t) return
    const root = document.documentElement
    const c = t.colors

    // 主题标识（给 CSS 选择器用）
    root.setAttribute('data-theme', id)

    // 通用 CSS 变量（覆盖 global.css 里的 :root）
    const vars: Record<string, string> = {
      '--color-primary':     c.primary,
      '--color-secondary':   c.secondary,
      '--color-neon':        c.primary,
      '--color-neon-dim':    c.primary + 'CC',
      '--color-neon-glow':   hexToRgba(c.primary, 0.3),
      '--color-cyber':       c.secondary,
      '--color-cyber-dim':   c.secondary + 'CC',
      '--color-cyber-glow':  hexToRgba(c.secondary, 0.3),
      '--gradient-primary':  c.gradient,
      '--gradient-sidebar':  `linear-gradient(180deg,${c.sidebar} 0%,${c.sidebar} 100%)`,
      '--gradient-card':     `linear-gradient(145deg,${c.card} 0%,${c.card} 100%)`,
      '--bg-page':           c.bg,
      '--bg-card':           c.card,
      '--bg-card-2':         adjustBrightness(c.card, t.dark ? 8 : -4),
      '--bg-sidebar':        c.sidebar,
      '--bg-topbar':         hexToRgba(c.sidebar, 0.88),
      '--text-primary':      c.text,
      '--text-secondary':    t.dark ? lighten(c.textMuted, 30) : darken(c.textMuted, 10),
      '--text-muted':        c.textMuted,
      '--text-neon':         c.primary,
      '--text-cyber':        c.secondary,
      '--text-white':        t.dark ? '#ffffff' : '#111827',
      '--border-color':      c.border,
      '--border-color-hover': hexToRgba(c.primary, 0.45),
      '--border-color-dim':  t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      '--shadow-card':       t.dark
        ? '0 4px 24px rgba(0,0,0,0.4)'
        : '0 2px 16px rgba(0,0,0,0.08)',
      '--shadow-card-hover': `0 0 30px ${hexToRgba(c.primary, 0.25)},0 8px 40px rgba(0,0,0,0.2)`,
      '--shadow-neon':       `0 0 20px ${hexToRgba(c.primary, 0.35)}`,
      '--shadow-btn':        `0 4px 20px ${hexToRgba(c.primary, 0.35)}`,
    }

    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v)
    }

    // body & #app 背景色
    document.body.style.backgroundColor = c.bg
    document.body.style.color = c.text
    ;(document.getElementById('app') as HTMLElement | null)?.style?.setProperty(
      'background', c.bg
    )
  }

  function setTheme(id: ThemeId) {
    currentThemeId.value = id
    localStorage.setItem(STORAGE_KEY, id)
    applyTheme(id)
  }

  // 启动时应用
  applyTheme(currentThemeId.value)

  // watch 响应式同步
  watch(currentThemeId, (id) => applyTheme(id))

  const currentTheme = () => THEMES.find((t) => t.id === currentThemeId.value)!

  return { currentThemeId, currentTheme, setTheme, THEMES }
})

// ── 工具函数 ────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function adjustBrightness(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  let r = parseInt(h.substring(0, 2), 16) + amount
  let g = parseInt(h.substring(2, 4), 16) + amount
  let b = parseInt(h.substring(4, 6), 16) + amount
  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function lighten(hex: string, amount: number): string {
  return adjustBrightness(hex, amount)
}

function darken(hex: string, amount: number): string {
  return adjustBrightness(hex, -amount)
}
