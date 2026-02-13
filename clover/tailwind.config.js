/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#F0FFF4",
          100: "#C6F6D5",
          200: "#9AE6B4",
          300: "#68D391",
          400: "#48BB78",
          500: "#38A169",
          600: "#2F855A",
        },
        emerald: "#48BB78",
        "dark-slate": "#2D3748",
        "slate-800": "#1A202C",
        "slate-700": "#2D3748",
        "slate-600": "#4A5568",
        "slate-500": "#718096",
        "slate-400": "#A0AEC0",
        "slate-300": "#CBD5E0",
        "slate-200": "#E2E8F0",
        "slate-100": "#EDF2F7",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
