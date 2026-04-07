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
        background: '#09090b',
        warp: {
          bg: '#09090b',
          card: '#111113',
          'card-hover': '#18181b',
          accent: '#00C650',
          'accent-muted': 'rgba(0, 198, 80, 0.125)',
          border: '#27272a',
          muted: '#71717a',
          danger: '#ef4444',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: { warp: '12px' },
      boxShadow: {
        'warp-glow': '0 0 20px rgba(0, 198, 80, 0.15)',
        'warp-card': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
