/** @type {import('tailwindcss').Config} */
import defaultColors from 'tailwindcss/colors.js';

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          ...defaultColors.neutral,
          900: '#212121',
          950: '#121212',
        },
        gia: {
          50:  '#f8f0ff',
          100: '#f1deff',
          200: '#e3bfff',
          300: '#cb8ff5',
          400: '#b260e8',
          500: '#9d35d9',
          600: '#8b20c8',
          700: '#7318a8',
          800: '#5e1488',
          900: '#4d1270',
          950: '#2e0845',
        },
      },
      fontSize: {
        // Perfect Fourth scale (×1.333) anchored at 16px base
        'p4-xs':   ['0.75rem',   { lineHeight: '1.25rem' }],    // 12px — floor for micro labels
        'p4-sm':   ['0.875rem',  { lineHeight: '1.375rem' }],   // 14px
        'p4-base': ['1rem',      { lineHeight: '1.625rem' }],   // 16px
        'p4-lg':   ['1.333rem',  { lineHeight: '2rem' }],       // ~21px
        'p4-xl':   ['1.777rem',  { lineHeight: '2.25rem' }],    // ~28px
        'p4-2xl':  ['2.369rem',  { lineHeight: '2.75rem' }],    // ~38px
        'p4-3xl':  ['3.157rem',  { lineHeight: '3.5rem' }],     // ~50px
        'p4-4xl':  ['4.209rem',  { lineHeight: '1.1' }],        // ~67px
      },
      fontFamily: {
        sans:       ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif:      ['Source Serif 4', 'Georgia', 'serif'],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
