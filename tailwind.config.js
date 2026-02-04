/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif']
      },
      colors: {
        primary: '#f97316', // Orange Lazismu
        secondary: '#1e293b', // Slate 800
      }
    }
  },
  plugins: [],
}
