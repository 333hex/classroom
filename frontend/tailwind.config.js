/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#141a15',
        surface: {
          50: '#1b241c',
          100: '#263127',
          200: '#344236',
        },
        primary: {
          DEFAULT: '#91aa75',
          hover: '#a4bc86',
          light: '#c0d0a5',
        },
        accent: {
          emerald: '#9eb986',
          amber: '#d4b477',
          rose: '#ce8d80',
          purple: '#b1a0c2',
        },
        slate: {
          50: '#f5f4eb', 100: '#e7e8da', 200: '#d1d5c4', 300: '#bcc3ae',
          400: '#9da894', 500: '#7e8979', 600: '#626f62', 700: '#465448',
          800: '#344236', 900: '#263127', 950: '#1b241c',
        },
      },
    },
  },
  plugins: [],
}
