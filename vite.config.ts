/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// BASE_PATH sert au déploiement sur GitHub Pages (/Projet-Ecole/). En local et sur Vercel : « / ».
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      // Deux pages : l'appli (/) et la vitrine (/vitrine/).
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        vitrine: fileURLToPath(new URL('./vitrine/index.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'e-mirror',
        short_name: 'e-mirror',
        description: 'Ton dressing se tient à jour tout seul.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#FFF8EB',
        theme_color: '#F2B705',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        // La vitrine n'est pas une route de l'appli : le service worker ne doit pas la remplacer par l'appli.
        navigateFallbackDenylist: [/\/vitrine\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    // Les tests d'écrans (*.test.tsx) commencent par « // @vitest-environment jsdom ».
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
  },
})
