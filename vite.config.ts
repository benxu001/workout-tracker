import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The manifest already lives in public/, so serve that one.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
        // Supabase responses are not cached: stale lifting data would be
        // worse than an honest error.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { port: 3000, strictPort: true },
})
