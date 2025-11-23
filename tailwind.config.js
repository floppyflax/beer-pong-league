/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f59e0b', // Amber 500 - Beer color
        secondary: '#1e293b', // Slate 800
        accent: '#ef4444', // Red 500 - Red cup color
      }
    },
  },
  plugins: [],
}



