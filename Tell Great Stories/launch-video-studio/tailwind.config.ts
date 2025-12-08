import type { Config } from 'tailwindcss';

/**
 * GEIST DESIGN SYSTEM - Vercel Official
 * https://vercel.com/geist
 * Exact color values from Vercel's design system
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Geist Gray Scale (exact Vercel values)
        gray: {
          50: '#fafafa',
          100: '#fafafa',
          200: '#eaeaea',
          300: '#999',
          400: '#888',
          500: '#666',
          600: '#444',
          700: '#333',
          800: '#222',
          900: '#111',
          950: '#000',
        },
        // Geist Blue (Vercel brand)
        blue: {
          DEFAULT: '#0070f3',
          50: '#ebf5ff',
          100: '#cce4ff',
          200: '#99c8ff',
          300: '#66abff',
          400: '#338eff',
          500: '#0070f3',
          600: '#0070f3',
          700: '#005fcc',
          800: '#004fa6',
          900: '#003d80',
        },
        // Geist Green (Success)
        green: {
          DEFAULT: '#46a758',
          50: '#effff3',
          100: '#c7f5d1',
          200: '#8eeba3',
          300: '#5fe175',
          400: '#46a758',
          500: '#46a758',
          600: '#388e4a',
          700: '#2d7a3d',
          800: '#236530',
          900: '#1a5023',
        },
        // Geist Red (Error)
        red: {
          DEFAULT: '#e5484d',
          50: '#fff1f0',
          100: '#ffdad8',
          200: '#ffb5b1',
          300: '#ff908a',
          400: '#f76b63',
          500: '#e5484d',
          600: '#cd2b31',
          700: '#aa2429',
          800: '#861d21',
          900: '#631619',
        },
        // Geist Amber (Warning)
        amber: {
          DEFAULT: '#f5a623',
          50: '#fffbe5',
          100: '#ffecb3',
          200: '#ffdd80',
          300: '#ffce4d',
          400: '#ffbf1a',
          500: '#f5a623',
          600: '#d4900d',
          700: '#b37b00',
          800: '#926500',
          900: '#705000',
        },
        // Accent (alias to blue)
        accent: {
          DEFAULT: '#0070f3',
          foreground: '#fff',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        DEFAULT: '6px',
        none: '0',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        // Geist subtle shadows
        sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
        md: '0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.08)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.08)',
        // Hover shadow
        hover: '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      transitionTimingFunction: {
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
