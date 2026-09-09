/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fondo: '#f5f3ec',
        superficie: '#ffffff',
        bosque: {
          DEFAULT: '#2f5d3a',
          claro: '#4b7b56',
          oscuro: '#1f3f28',
          suave: '#e6efe6',
        },
        alerta: {
          DEFAULT: '#a65b19',
          claro: '#e0a15f',
          suave: '#fbeedd',
        },
        peligro: {
          DEFAULT: '#b42318',
          claro: '#f0a59d',
          suave: '#fee4e2',
        },
        recuperacion: {
          DEFAULT: '#3d7fa6',
          claro: '#8fbdd6',
          suave: '#e2eef4',
        },
        texto: {
          DEFAULT: '#26302a',
          suave: '#5c6660',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
