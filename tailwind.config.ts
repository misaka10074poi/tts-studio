/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        accent: {
          500: '#8B5CF6',
          600: '#7C3AED',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
