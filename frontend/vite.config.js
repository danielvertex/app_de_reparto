import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://reparto.bluegreenpl.com/api';
  const escapedApiUrl = apiUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/*.png'],
        manifest: {
          name: 'Entrega de Productos',
          short_name: 'Entregas',
          description: 'Gestión de rutas de entrega para repartidores',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#2563EB',
          background_color: '#F8FAFC',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          categories: ['business', 'productivity'],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              urlPattern: new RegExp(`^${escapedApiUrl}/trip$`),
              handler: 'NetworkFirst',
              options: { cacheName: 'trip-data', expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 } },
            },
            {
              urlPattern: new RegExp(`^${escapedApiUrl}/history$`),
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'history-data', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } },
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
})
