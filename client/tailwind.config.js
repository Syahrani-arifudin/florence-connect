/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brown: {
          50:  '#fdf6f0',
          100: '#f5efe6',
          200: '#e8d5c0',
          300: '#d4a97a',
          400: '#c8813a',
          500: '#a0522d',
          600: '#8B4513',
          700: '#6b3310',
          800: '#3d1f0a',
          900: '#1e0e06',
          950: '#0f0704',
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        dm: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp .4s ease forwards',
        'fade-in':   'fadeIn .3s ease forwards',
        'slide-in':  'slideIn .35s ease forwards',
        'bounce-in': 'bounceIn .5s cubic-bezier(.34,1.56,.64,1) forwards',
        'pulse-slow':'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from:{opacity:0,transform:'translateY(20px)'}, to:{opacity:1,transform:'translateY(0)'} },
        fadeIn:   { from:{opacity:0}, to:{opacity:1} },
        slideIn:  { from:{opacity:0,transform:'translateX(-20px)'}, to:{opacity:1,transform:'translateX(0)'} },
        bounceIn: { from:{opacity:0,transform:'scale(.7)'}, to:{opacity:1,transform:'scale(1)'} },
      }
    }
  },
  plugins: []
}
