import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/__/auth': {
          target: 'https://ritmoup-b432b.firebaseapp.com',
          changeOrigin: true,
        },
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackAllowlist: [/^(?!\/__).*/]
        },
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'RitmoUp',
          short_name: 'RitmoUp',
          description: 'Seu Treino, Seu Ritmo.',
          lang: 'pt-BR',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        }
      })



    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          format: 'es',
          manualChunks: undefined,
        }
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    }
  };
});
