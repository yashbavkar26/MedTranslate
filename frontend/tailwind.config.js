/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'monospace'],
      },
      colors: {
        'triage-red': '#ef4444',
        'triage-yellow': '#eab308',
        'triage-green': '#22c55e',
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
