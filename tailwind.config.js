/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FBF7EF',
        surface: '#FFFFFF',
        ink: '#203A33',
        muted: '#5C7269',
        primary: {
          DEFAULT: '#2F6B4F',
          dark: '#1B3E30',
          light: '#5E9678',
        },
        accent: {
          DEFAULT: '#E59530',
          soft: '#FBE7C6',
          dark: '#B9711A',
        },
        sage: '#E6EEE4',
        line: '#DCD4C4',
      },
      fontFamily: {
        display: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1180px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
