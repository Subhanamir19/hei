/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.(js|jsx|ts|tsx)', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          lime: '#9EF01A',
          mint: '#80FFDB',
          cyan: '#56CFE1',
        },
        dark: {
          bg: '#0B1021',
          surface: '#11162A',
          muted: '#20263A',
        },
      },
      borderRadius: {
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};
