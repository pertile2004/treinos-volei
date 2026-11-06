import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
import { CACHE_DA_API } from './src/lib/pwa.js';

// A API e o front ficam na mesma origem: o Vite encaminha /api, /sanctum e /docs para o Laravel.
// E2E_API_PORT e E2E_WEB_PORT trocam as portas (testes E2E e cards em paralelo na mesma máquina).
const alvoDaApi = `http://127.0.0.1:${Number(process.env.E2E_API_PORT) || 8000}`;
const encaminhar = { target: alvoDaApi, changeOrigin: false };
const proxy = { '/api': encaminhar, '/sanctum': encaminhar, '/docs': encaminhar };

// Cores do docs/DESIGN.md (fundo).
const COR_DO_TEMA = '#0E0E0E';

// PWA (PR-26). O service worker só existe no build de produção: em dev e nos testes o registro é vazio
// (devOptions desligado), então o proxy acima nunca passa por ele.
const pwa = VitePWA({
  // Atualização por aviso: o service worker novo espera o usuário clicar em "Atualizar" (AvisoNovaVersao).
  registerType: 'prompt',
  // O registro é feito pelo AtualizacaoDoApp (virtual:pwa-register/react), não por script injetado no HTML.
  injectRegister: false,
  includeAssets: ['icones/*.svg', 'icones/*.png'],
  manifest: {
    name: 'VOLLEY PRO',
    short_name: 'VOLLEY PRO',
    description: 'Treino individual de vôlei: biblioteca de exercícios, treinos e evolução.',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: COR_DO_TEMA,
    theme_color: COR_DO_TEMA,
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // App shell: tudo que o build gera (HTML, JS, CSS, ícones) entra no pré-cache.
    globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
    cleanupOutdatedCaches: true,
    // Navegação offline cai no index.html do SPA, menos para o que é do Laravel.
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/docs(\/|$)/, /^\/up$/, /^\/pulse(\/|$)/],
    runtimeCaching: [
      {
        // Só GET de /exercicios e /treinos (lista com qualquer filtro e detalhe). /eu, /sessoes e o resto da API
        // nunca entram em cache: sem rota aqui, o pedido vai direto à rede.
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /^\/api\/v1\/(exercicios|treinos)(\/[^/]+)?$/.test(url.pathname),
        handler: 'StaleWhileRevalidate',
        method: 'GET',
        options: {
          cacheName: CACHE_DA_API,
          // Só respostas 200: 401/403/404/422/429/5xx nunca são gravadas.
          cacheableResponse: { statuses: [200] },
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), pwa],
  server: { port: Number(process.env.E2E_WEB_PORT) || 5173, strictPort: true, proxy },
  preview: { port: Number(process.env.E2E_WEB_PORT) || 4173, strictPort: true, proxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/preparar.js'],
    // Os specs do Playwright (e2e/) não rodam no Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Nos testes o registro do service worker é vazio (como em dev); o runner não carrega o id virtual do plugin.
    alias: {
      'virtual:pwa-register/react': fileURLToPath(new URL('./src/testes/pwa-registro-desligado.js', import.meta.url)),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/testes/**', 'src/main.jsx'],
    },
  },
});
