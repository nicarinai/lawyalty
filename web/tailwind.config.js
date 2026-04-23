/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0e0e0e',
        surface:  '#131313',
        panel:    '#1c1b1b',
        elevated: '#252525',
        border:   '#2e2d3d',
        muted:    '#464554',
        subtle:   '#908fa0',
        text:     '#e5e2e1',
        dim:      '#c7c4d7',
        accent:   '#c0c1ff',
        accentHi: '#8083ff',
        green:    '#4edea3',
        error:    '#ffb4ab',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
