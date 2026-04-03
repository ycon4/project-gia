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
          50:  '#f9f5fd',
          100: '#f0e3fa',
          200: '#dfc2f3',
          300: '#c99aea',
          400: '#bc87e4',
          500: '#b07ade',
          600: '#a673d8',
          700: '#8c5abf',
          800: '#6b4195',
          900: '#4d2d6c',
          950: '#2b1740',
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
