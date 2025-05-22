/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'constru-blue': '#004C77',
        'constru-orange': '#F36C21',
        'constru-dark': '#333333'
      }
    }
  },
  plugins: []
}
