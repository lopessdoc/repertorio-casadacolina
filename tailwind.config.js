/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        brand: {
          accent: '#82ccbd',
          darkBg: '#080c14',
          cardBg: 'rgba(15, 23, 42, 0.85)',
        }
      }
    }
  },
  plugins: [],
}