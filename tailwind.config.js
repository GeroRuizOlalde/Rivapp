/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo negro (Estilo Pedisy)
        background: "#0f0f0f", 
        // Tarjetas gris oscuro
        surface: "#1a1a1a", 
        // EL IMPORTANTE: Naranja de la marca (Burgers Topo)
        accent: "#ff6b00", 
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 107, 0, 0.15)',
      }
    },
  },
  plugins: [],
}