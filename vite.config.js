import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png'],
      manifest: {
        name: 'Rivapp',
        short_name: 'Rivapp',
        theme_color: '#d0ff00',
        background_color: '#0f0f0f',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      // manualChunks NO va aquí
      output: {
        // manualChunks SI va aquí adentro
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-db': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts', 'react-is'], // Agregamos react-is aquí también
          'vendor-ui': ['framer-motion', 'lucide-react']
        }
      }
    }
  }
});