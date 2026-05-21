/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F9D76', // Medical Green
          dark: '#0A6B57', 
          light: '#E6F5F1',
        },
        secondary: {
          DEFAULT: '#14B8A6', // Teal
          dark: '#0F766E',
          light: '#F0FDFA',
        },
        dark: {
          DEFAULT: '#0F172A',
          surface: '#1E293B',
          panel: '#334155',
        },
        teal: '#14B8A6',
        trust: '#2563EB', // Trust Blue
        offer: '#F59E0B',
        alert: '#DC2626',
        background: '#F8FAFC', // Soft White Background
        panel: 'rgba(255, 255, 255, 0.8)', // Light Glass panel
        text: '#0F172A',
        muted: '#64748B',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to right bottom, #F8FAFC, #E6F5F1, #F0FDFA)',
      },
      boxShadow: {
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'glass-hover': '0 10px 15px -3px rgba(15, 157, 118, 0.1), 0 4px 6px -2px rgba(15, 157, 118, 0.05)',
        'soft': '0 2px 10px rgba(0,0,0,0.05)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
