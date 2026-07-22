/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#070a13',        // Very Dark Slate background
          surface: '#0b0f19',   // Slightly lighter slate surface
          card: 'rgba(13, 20, 35, 0.6)', // Glassmorphic card surface
          cardHover: 'rgba(20, 30, 50, 0.75)',
          border: 'rgba(255, 255, 255, 0.06)',
          borderHover: 'rgba(255, 255, 255, 0.12)',
          primary: '#10b981',   // Emerald Green
          primaryDark: '#059669',
          primaryLight: '#34d399',
          accent: '#0ea5e9',    // Sky Blue
          accentDark: '#0284c7',
          accentLight: '#38bdf8',
          muted: '#828e9e',
          text: '#f8fafc',
          textMuted: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 8px 32px 0 rgba(16, 185, 129, 0.1)',
        glow: '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-accent': '0 0 20px rgba(14, 165, 233, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
