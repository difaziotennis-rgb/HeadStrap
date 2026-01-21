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
        // Mid-Century Modern Palette
        mcm: {
          // Warm beiges and creams (primary background)
          cream: {
            50: '#FBF8F3',
            100: '#F5EEDE',
            200: '#E8DCC6',
            300: '#DBC9AE',
            400: '#CEB696',
            500: '#C1A37E', // Main cream
            600: '#A0826D',
            700: '#7F6257',
            800: '#5E4241',
            900: '#3D222B',
          },
          // Mustard yellow (accent)
          mustard: {
            50: '#FDF8E8',
            100: '#FAF0D1',
            200: '#F5E1A3',
            300: '#F0D275',
            400: '#EBC347',
            500: '#D4A574', // Classic mustard
            600: '#B8905F',
            700: '#9C7B4A',
            800: '#806635',
            900: '#645120',
          },
          // Teal/Turquoise (accent)
          teal: {
            50: '#E8F4F6',
            100: '#D1E9ED',
            200: '#A3D3DB',
            300: '#75BDC9',
            400: '#47A7B7',
            500: '#4A7C7E', // Classic teal
            600: '#3D6365',
            700: '#304A4C',
            800: '#233133',
            900: '#16181A',
          },
          // Olive green (accent)
          olive: {
            50: '#F4F6F0',
            100: '#E9EDE1',
            200: '#D3DBC3',
            300: '#BDC9A5',
            400: '#A7B787',
            500: '#6B7E46', // Classic olive
            600: '#566538',
            700: '#414C2A',
            800: '#2C331C',
            900: '#171A0E',
          },
          // Burnt orange (accent)
          orange: {
            50: '#FDF2ED',
            100: '#FBE5DB',
            200: '#F7CBB7',
            300: '#F3B193',
            400: '#EF976F',
            500: '#C97D60', // Burnt orange
            600: '#A1644D',
            700: '#794B3A',
            800: '#513227',
            900: '#291914',
          },
          // Warm browns
          brown: {
            50: '#F5F1EB',
            100: '#EBE3D7',
            200: '#D7C7AF',
            300: '#C3AB87',
            400: '#AF8F5F',
            500: '#8B6F47', // Warm brown
            600: '#6F5938',
            700: '#534329',
            800: '#372D1A',
            900: '#1B170D',
          },
          // Charcoal/Navy
          charcoal: {
            50: '#F4F5F6',
            100: '#E9EBED',
            200: '#D3D7DB',
            300: '#BDC3C9',
            400: '#A7AFB5',
            500: '#2C3E50', // Charcoal
            600: '#23323F',
            700: '#1A252E',
            800: '#11181D',
            900: '#080B0C',
          },
        },
        // Keep some original for compatibility
        primary: {
          50: '#F5F1EB',
          100: '#EBE3D7',
          500: '#8B6F47',
          600: '#6F5938',
          700: '#534329',
          800: '#2C3E50',
          900: '#1B170D',
        },
        accent: {
          500: '#D4A574',
          600: '#C97D60',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'mcm': '12px',
        'mcm-lg': '16px',
      },
      boxShadow: {
        'mcm': '0 4px 12px rgba(44, 62, 80, 0.08), 0 2px 4px rgba(44, 62, 80, 0.04)',
        'mcm-lg': '0 8px 24px rgba(44, 62, 80, 0.12), 0 4px 8px rgba(44, 62, 80, 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config






