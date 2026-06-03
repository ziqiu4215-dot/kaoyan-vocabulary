/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '640px',   // large phone
      md: '768px',   // tablet portrait
      lg: '1024px',  // tablet landscape / small desktop
      xl: '1280px',  // desktop
      '2xl': '1536px', // large desktop
    },
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        'content': '42rem',    // phone
        'content-md': '48rem', // tablet portrait
        'content-lg': '64rem', // tablet landscape
        'content-xl': '72rem', // desktop
      },
    },
  },
  plugins: [],
};
