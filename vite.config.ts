/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR,
  build: {
    sourcemap: false,
    minify: 'oxc',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app/[hash].js',
        chunkFileNames: 'assets/chunks/[hash].js',
        assetFileNames: 'assets/files/[hash][extname]',
      },
    },
    // React PDF is isolated behind the export click; its renderer is intentionally
    // larger than Vite's default warning threshold but never blocks route loading.
    chunkSizeWarningLimit: 1500,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'brand/favicon.ico',
        'brand/favicon.svg',
        'brand/favicon-16x16.png',
        'brand/favicon-20x20.png',
        'brand/favicon-24x24.png',
        'brand/favicon-32x32.png',
        'brand/favicon-48x48.png',
        'brand/favicon-96x96.png',
        'brand/favicon-128x128.png',
        'brand/apple-touch-icon.png',
        'brand/safari-pinned-tab.svg',
      ],
      manifest: {
        name: 'Energy Management as a Service (EMaaS) Pro — Sustainable Gaps',
        short_name: 'EMaaS Pro',
        description:
          'Energy Management as a Service tools for BESS, generator, cooling, and hybrid energy planning',
        theme_color: '#0E151C',
        background_color: '#0E151C',
        display: 'standalone',
        icons: [
          {
            src: 'brand/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'brand/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'brand/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
