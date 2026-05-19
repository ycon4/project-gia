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
          50: '#fdf5f5',   // was #f9f5fd (purple tint → maroon tint)
          100: '#f7e0e0',   // was #f0e3fa
          200: '#edbbbb',   // was #dfc2f3
          300: '#de8888',   // was #c99aea
          400: '#c95555',   // was #bc87e4
          500: '#a83232',   // was #b07ade
          600: '#741112',   // was #741112  ← PRIMARY (maroon)
          700: '#530B0C',   // was #8c5abf  ← DARK maroon
          800: '#3a0708',   // was #6b4195
          900: '#250405',   // was #4d2d6c
          950: '#140202',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#ECC142',
          dark: '#B8941F',
        },
      },
      fontSize: {
        // Perfect Fourth scale (×1.333) anchored at 16px base
        'p4-xs': ['0.75rem', { lineHeight: '1.25rem' }],    // 12px — floor for micro labels
        'p4-sm': ['0.875rem', { lineHeight: '1.375rem' }],   // 14px
        'p4-base': ['1rem', { lineHeight: '1.625rem' }],   // 16px
        'p4-lg': ['1.333rem', { lineHeight: '2rem' }],       // ~21px
        'p4-xl': ['1.777rem', { lineHeight: '2.25rem' }],    // ~28px
        'p4-2xl': ['2.369rem', { lineHeight: '2.75rem' }],    // ~38px
        'p4-3xl': ['3.157rem', { lineHeight: '3.5rem' }],     // ~50px
        'p4-4xl': ['4.209rem', { lineHeight: '1.1' }],        // ~67px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
