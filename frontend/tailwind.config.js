module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        accent: '#5eead4',
        surface: {
          DEFAULT: '#09090b',
          alt:     '#18181b',
        },
      },
      boxShadow: {
        soft:     '0 1px 3px 0 rgba(0,0,0,0.12), 0 1px 2px -1px rgba(0,0,0,0.12)',
        card:     '0 4px 6px -1px rgba(0,0,0,0.15), 0 2px 4px -2px rgba(0,0,0,0.10)',
        elevated: '0 10px 15px -3px rgba(0,0,0,0.18), 0 4px 6px -4px rgba(0,0,0,0.12)',
        glow:     '0 0 24px rgba(20,184,166,0.25)',
        'glow-lg':'0 0 48px rgba(20,184,166,0.20)',
      },
      borderRadius: {
        xl:   '0.875rem',
        '2xl':'1.25rem',
        '3xl':'1.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.35s ease-out',
        'fade-in-scale': 'fade-in-scale 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'float':         'float 3s ease-in-out infinite',
        'pulse-ring':    'pulse-ring 1.4s ease-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
