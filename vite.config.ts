/// <reference types="vitest/config" />
import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// BASE_PATH sert au déploiement sur GitHub Pages (/Projet-Ecole/). En local et sur Vercel : « / ».
const base = process.env.BASE_PATH ?? '/'

// En local (dev et preview), recharger une page de l'appli (/app/dressing…) doit rouvrir l'appli et non la vitrine.
// En ligne, c'est 404.html qui joue ce rôle (voir .github/workflows/deploy.yml).
function appFallback(): Plugin {
  const appPath = new RegExp(`^${base}app(/|$)`)
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const path = (req.url ?? '').split('?')[0]
    if (appPath.test(path) && !/\.[a-z0-9]+$/i.test(path) && req.headers.accept?.includes('text/html')) {
      req.url = `${base}app/index.html`
    }
    next()
  }
  return {
    name: 'app-fallback',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      // Deux pages : la vitrine à la racine du site, l'appli dans /app/.
      input: {
        vitrine: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    appFallback(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'DeepIN Armour',
        short_name: 'DeepIN Armour',
        description: 'Partager le bonheur dans son armoire.',
        lang: 'fr',
        start_url: `${base}app/`,
        scope: `${base}app/`,
        display: 'standalone',
        background_color: '#FFF7E8',
        theme_color: '#5A1E56',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Le quiz de présentation (public/quiz/) vit à part : jamais mis en cache par l'appli.
        globIgnores: ['**/node_modules/**/*', 'quiz/**'],
        navigateFallback: `${base}app/index.html`,
        // Seules les adresses de l'appli retombent sur l'appli ; la vitrine reste la vitrine.
        navigateFallbackAllowlist: [new RegExp(`^${base}app(/|$)`)],
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
