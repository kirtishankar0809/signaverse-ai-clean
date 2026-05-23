/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void: '#050810',
        deep: '#090d1a',
        surface: '#0e1425',
        panel: '#131929',
        border: '#1e2d4a',
        accent: '#00e5ff',
        accent2: '#7c3aed',
        accent3: '#f59e0b',
        success: '#10b981',
        text: {
          primary: '#e8f0fe',
          secondary: '#8fa3bf',
          muted: '#4a6080',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00e5ff33, 0 0 10px #00e5ff22' },
          '100%': { boxShadow: '0 0 20px #00e5ff66, 0 0 40px #00e5ff33' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
