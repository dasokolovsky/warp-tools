import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#040810',
        warp: {
          bg: '#040810',
          card: '#080F1E',
          'card-hover': '#0C1528',
          accent: '#00C650',
          'accent-muted': 'rgba(0, 198, 80, 0.125)',
          border: '#1A2235',
          muted: '#8B95A5',
          danger: '#FF4444',
          warning: '#FFAA00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: { warp: '12px' },
      boxShadow: {
        'warp-glow': '0 0 20px rgba(0, 198, 80, 0.15)',
        'warp-card': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
