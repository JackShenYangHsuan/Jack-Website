/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0F1419',
        'dark-card': '#1A1F29',
        'dark-border': '#2D3748',
        'accent-blue': '#3B82F6',
        'accent-green': '#10B981',
        'heatmap': {
          0: '#1A1F29',
          25: '#1a3a2e',
          50: '#2d5a3f',
          75: '#4a9d6f',
          100: '#059669',
        },
      },
    },
  },
  plugins: [],
}
