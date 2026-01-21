import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'San Juan Delivery',
        short_name: 'SJ Delivery',
        description: 'La mejor comida de San Juan',
        theme_color: '#ff6b00',
        background_color: '#0f0f0f',
        display: 'standalone', // Esto oculta la barra de URL del navegador
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // Tienes que crear esta imagen en public/
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Tienes que crear esta imagen en public/
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});