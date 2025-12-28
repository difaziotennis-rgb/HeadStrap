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
        // Hudson Valley theme - natural, elegant colors
        primary: {
          50: '#f0f7f4',
          100: '#dceee5',
          200: '#bddccb',
          300: '#92c3a8',
          400: '#62a37f',
          500: '#3d8561', // Main green
          600: '#2d6b4d',
          700: '#255640',
          800: '#204535',
          900: '#1b392d',
        },
        accent: {
          50: '#faf8f4',
          100: '#f4efe6',
          200: '#e7dcc8',
          300: '#d6c2a3',
          400: '#c2a57a',
          500: '#b08d5a', // Warm accent
          600: '#9a7548',
          700: '#7d5d3c',
          800: '#684e35',
          900: '#57432f',
        },
        earth: {
          50: '#f7f5f2',
          100: '#ebe7df',
          200: '#d5cdbf',
          300: '#b8ab96',
          400: '#9a8a70',
          500: '#7d6d57', // Earth tone
          600: '#66584a',
          700: '#54483e',
          800: '#463d35',
          900: '#3c352f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

export default config






