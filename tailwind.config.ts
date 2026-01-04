import type { Config } from "tailwindcss"

const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brightPink: '#ff1493',
        // Hamptons Country Club - Elegant, upscale palette
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98', // Main navy blue
          600: '#486581', // Deep navy
          700: '#334e68', // Dark navy
          800: '#243b53', // Very dark navy
          900: '#102a43', // Almost black navy
        },
        accent: {
          50: '#fef9f0',
          100: '#fcf2e0',
          200: '#f8e4c1',
          300: '#f4d6a2',
          400: '#f0c883',
          500: '#ecba64', // Gold accent
          600: '#d4a558',
          700: '#b8904c',
          800: '#9c7b40',
          900: '#806634',
        },
        cream: {
          50: '#fefcf9',
          100: '#fdf8f0',
          200: '#faf1e1',
          300: '#f7ead2',
          400: '#f4e3c3',
          500: '#f1dcb4', // Cream
          600: '#d9c6a2',
          700: '#c1b090',
          800: '#a99a7e',
          900: '#91846c',
        },
        // Keep original colors for main booking site compatibility
        earth: {
          50: '#f7f5f2',
          100: '#ebe7df',
          200: '#d5cdbf',
          300: '#b8ab96',
          400: '#9a8a70',
          500: '#7d6d57',
          600: '#66584a',
          700: '#54483e',
          800: '#463d35',
          900: '#3c352f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        elegant: ['Cormorant Garamond', 'Playfair Display', 'serif'],
      },
      letterSpacing: {
        'elegant': '0.02em',
        'refined': '0.05em',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config






