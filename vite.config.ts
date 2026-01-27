import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'offline.html'],
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'Beer Pong League',
        short_name: 'BP League',
        description: 'Social-first platform for beer pong tournaments',
        theme_color: '#f59e0b', // Tailwind amber-500
        background_color: '#0f172a', // Tailwind slate-900
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk splitting for better caching
          if (id.includes('node_modules')) {
            // React core libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // Supabase libraries
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // Workbox (PWA)
            if (id.includes('workbox')) {
              return 'workbox-vendor';
            }
            
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            
            // Other third-party libraries
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // 500KB limit per chunk
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})



