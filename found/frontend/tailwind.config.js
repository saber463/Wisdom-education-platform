/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色系
        primary:        '#6366f1',
        'primary-light':'#818cf8',
        'primary-dark': '#4f46e5',
        secondary:      '#64748b',
        accent:         '#22d3ee',
        'accent-light': '#67e8f9',

        // 功能色
        success:  '#10b981',
        warning:  '#f59e0b',
        danger:   '#f43f5e',
        info:     '#38bdf8',

        // 背景层级（供 Tailwind 类名使用）
        'bg-base':     '#0d1117',
        'bg-surface':  '#161b27',
        'bg-elevated': '#1e2536',
        'bg-overlay':  '#242d42',

        // 文字
        'text-primary':   '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted':     '#64748b',

        // 旧别名保留，防止破坏已有 Tailwind 类
        dark:          '#0d1117',
        neutral:       '#f8fafc',
        'tech-blue':   '#22d3ee',
        'tech-purple': '#6366f1',
        'tech-bg':     '#0d1117',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '22px',
      },
      boxShadow: {
        'neon-blue':   '0 0 16px rgba(34, 211, 238, 0.3)',
        'neon-purple': '0 0 16px rgba(99, 102, 241, 0.35)',
        'neon-pink':   '0 0 16px rgba(244, 63, 94, 0.35)',
        glass:         '0 8px 32px rgba(0,0,0,0.4)',
        card:          '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float:        'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
