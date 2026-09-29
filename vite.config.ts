import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icones/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Contigo',
        short_name: 'Contigo',
        description: 'Conte comigo, estou contigo!',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        categories: ['health', 'lifestyle'],
        prefer_related_applications: false,
        background_color: '#FFF9F4',
        theme_color: '#FFF9F4',
        icons: [
          { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icones/icone-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Com capturas, o Android mostra a caixa de instalação completa (com prévia), não só a barrinha.
        screenshots: [
          { src: 'capturas/hoje.png', sizes: '540x1080', type: 'image/png', form_factor: 'narrow', label: 'Como você acordou hoje? Vinte segundos por dia.' },
          { src: 'capturas/trilhas.png', sizes: '540x1080', type: 'image/png', form_factor: 'narrow', label: 'Trilhas curtas, escritas por psicólogos.' },
          { src: 'capturas/conversar.png', sizes: '540x1080', type: 'image/png', form_factor: 'narrow', label: 'Vamos conversar: gente de verdade quando precisa.' },
        ],
      },
      workbox: {
        // A casca do app fica em cache; o dado vem sempre do banco.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        globIgnores: ['**/capturas/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//],
      },
    }),
  ],
  server: { host: true, port: 5173 },
});
