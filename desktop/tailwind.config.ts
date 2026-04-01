import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          border: '#334155'
        },
        accent: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          lighter: '#C7D2FE',
          bg: 'rgba(99, 102, 241, 0.15)'
        },
        terminal: {
          bg: '#0F172A',
          header: '#1E293B'
        }
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'SF Mono'", "'Fira Code'", 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
