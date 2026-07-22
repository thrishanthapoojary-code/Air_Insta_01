/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ig: {
          bg: 'rgb(var(--ig-bg) / <alpha-value>)',
          surface: 'rgb(var(--ig-surface) / <alpha-value>)',
          border: 'rgb(var(--ig-border) / <alpha-value>)',
          text: 'rgb(var(--ig-text) / <alpha-value>)',
          muted: 'rgb(var(--ig-muted) / <alpha-value>)',
          accent: 'rgb(var(--ig-accent) / <alpha-value>)',
          accent2: 'rgb(var(--ig-accent2) / <alpha-value>)',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'heart-pop': {
          '0%': { transform: 'scale(0)' },
          '15%': { transform: 'scale(1.2)' },
          '30%': { transform: 'scale(0.95)' },
          '45%,100%': { transform: 'scale(1)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'heart-pop': 'heart-pop 0.45s ease-out',
      },
    },
  },
  plugins: [],
};
