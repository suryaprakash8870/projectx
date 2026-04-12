import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Direct aliases for Mark X website components
        primary:       '#0066ff',
        accent:        '#ff8a00',
        'page-bg':     'var(--background)',
        'page-text':   'var(--foreground)',
        'muted-text':  'var(--muted)',
        'glass-border':'var(--glass-border)',
        'dark-bg':     '#000000',
        // Primary: Electric Blue — #0066ff (mark-x primary)
        brand: {
          50:  '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',   // primary
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
          950: '#000a1a',
        },
        // Accent: Orange — #ff8a00 (mark-x accent)
        accent: {
          300: '#ffb84d',
          400: '#ffa31a',
          500: '#ff8a00',   // accent
          600: '#cc6f00',
        },
        // Dark surfaces — pure black family (mark-x dark-bg)
        dark: {
          900: '#000000',
          800: '#080808',
          700: '#0f0f0f',
          600: '#161616',
        },
        company: {
          DEFAULT: '#6b7280',
          light:   '#f3f4f6',
          border:  '#374151',
        },
        real: {
          DEFAULT: '#0066ff',
          light:   '#e6f0ff',
          border:  '#003d99',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['DM Sans', 'Outfit', 'Inter', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'blob':       'blob 7s infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%':   { transform: 'translate(0px, 0px) scale(1)' },
          '33%':  { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%':  { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(0, 102, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.6), 0 0 10px rgba(255, 138, 0, 0.3)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
