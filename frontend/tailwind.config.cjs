/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Manrope', 'DM Sans', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        quiet: 'rgb(var(--quiet) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: { DEFAULT: '#7055df', soft: '#f1edff' },
      },
      boxShadow: { soft: '0 4px 16px rgba(29,31,45,.035)' },
    },
  },
  plugins: [],
}
