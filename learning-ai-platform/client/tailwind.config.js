/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // 启用基于类的深色模式
  theme: {
    extend: {
      colors: {
        primary: '#4361ee',
        'primary-dark': '#3a56d4',
        secondary: '#64748b',
        'secondary-dark': '#5a687d',
        accent: '#3f37c9',
        dark: '#0f172a', // Darker blue-gray
        neutral: '#f8fafc',
        'tech-blue': '#00f2ff',
        'tech-purple': '#bd00ff',
        'tech-bg': '#050b14',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-blue': '0 0 5px theme("colors.tech-blue"), 0 0 20px theme("colors.tech-blue")',
        'neon-purple': '0 0 5px theme("colors.tech-purple"), 0 0 20px theme("colors.tech-purple")',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
