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
      },
      // Explicit breakpoints matching UX design doc
      screens: {
        'sm': '640px',   // Tailwind default
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1440px',  // Desktop large
      },
    },
  },
  plugins: [],
}



