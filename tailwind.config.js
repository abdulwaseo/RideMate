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
          bg: '#f8fafc',           // Light background (Slate 50)
          surface: '#ffffff',      // Card/surface background
          card: '#ffffff',         // Solid white card surface
          cardHover: '#f1f5f9',    // Light slate card hover
          border: '#e2e8f0',       // Light gray border
          borderHover: '#cbd5e1',  // Darker light border on hover
          primary: '#10b981',      // Emerald Green
          primaryDark: '#059669',
          primaryLight: '#34d399',
          accent: '#0ea5e9',       // Sky Blue
          accentDark: '#0284c7',
          accentLight: '#38bdf8',
          muted: '#64748b',        // Adjusted for light bg contrast
          text: '#0f172a',         // Dark text for light background
          textMuted: '#475569',    // Muted dark text for light background
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 4px 24px 0 rgba(15, 23, 42, 0.08)',
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
