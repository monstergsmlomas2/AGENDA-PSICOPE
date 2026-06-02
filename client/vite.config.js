import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const apiRoutes = ['/pacientes', '/turnos', '/consultorios', '/obras-sociales', '/informes', '/evaluaciones', '/pagos', '/analytics', '/configuracion', '/drive']

const apiProxy = {
  target: 'http://localhost:3000',
  changeOrigin: true,
  bypass(req) {
    // Solo proxear si el cliente espera JSON (fetch/XHR), no navegación del browser
    const accept = req.headers['accept'] || ''
    if (accept.includes('text/html')) return req.url
  },
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'icon-192x192.png',
        'icon-512x512.png',
        'apple-touch-icon.png',
        'maskable-icon.png',
      ],
      manifest: {
        name: 'Agenda Psicope',
        short_name: 'Psicope',
        description: 'Agenda digital para psicólogos',
        theme_color: '#ec4899',
        background_color: '#e9d5ff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 1 día
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https?:\/\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
            },
          },
          {
            urlPattern: /\.(?:js|css|svg|png|ico|woff2)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    proxy: Object.fromEntries(apiRoutes.map(r => [r, apiProxy]))
  }
})
