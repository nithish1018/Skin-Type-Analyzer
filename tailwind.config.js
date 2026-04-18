/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        skin: {
          beige: '#F5EDE4',
          tone: '#E8CFC1',
          white: '#FAF9F7',
          rose: '#D8A7B1',
          green: '#A8C3A0',
          text: '#3A2E2A',
          gray: '#7A6E6A',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(58, 46, 42, 0.08)',
        card: '0 14px 35px rgba(58, 46, 42, 0.11)',
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
        display: ['"Poppins"', 'sans-serif'],
      },
      keyframes: {
        floatBlob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.18', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        floatBlob: 'floatBlob 6s ease-in-out infinite',
        pulseRing: 'pulseRing 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}

