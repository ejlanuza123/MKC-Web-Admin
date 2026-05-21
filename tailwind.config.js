/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mkc: {
          blue: '#0033A0',
          'blue-dark': '#002A80',
          'blue-light': '#E6ECF5',
          red: '#F2C300',
          'red-dark': '#D4A900',
          'red-light': '#FFF4BF',
          yellow: '#FFD700', // Optional: mkc's accent yellow
        }
      },
      backgroundImage: {
        'mkc-gradient': 'linear-gradient(135deg, #0033A0 0%, #F2C300 100%)',
        'mkc-gradient-subtle': 'linear-gradient(135deg, #E6ECF5 0%, #FFF4BF 100%)',
      }
    },
  },
  plugins: [],
}