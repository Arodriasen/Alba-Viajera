import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Alba Viajera',
        short_name: 'Alba Viajera',
        description: 'Nuestro viaje a Japón: qué toca hoy, dónde dormimos y qué falta por comprar',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#F7F4EE',
        theme_color: '#F7F4EE',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Las llamadas al servidor nunca se sirven desde la caché (los datos van en IndexedDB).
        navigateFallbackDenylist: [/^\/api\//, /^\/cdn-cgi\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Las fuentes de Google, para que sin conexión se vea igual (en Japón sin datos, en el metro…).
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fuentes', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 3600 } },
          },
        ],
      },
    }),
  ],
  server: {
    // En desarrollo, /api lo atiende `npm run dev:api` (wrangler) en el puerto 8791.
    // 127.0.0.1 y no localhost: wrangler solo escucha en IPv4 y Node puede resolver localhost a ::1.
    proxy: { '/api': 'http://127.0.0.1:8791' },
    host: true,
  },
});
