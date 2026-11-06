import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

// A API e o front ficam na mesma origem: o Vite encaminha /api, /sanctum e /docs para o Laravel.
// E2E_API_PORT e E2E_WEB_PORT trocam as portas (testes E2E e cards em paralelo na mesma máquina).
const alvoDaApi = `http://127.0.0.1:${Number(process.env.E2E_API_PORT) || 8000}`;
const encaminhar = { target: alvoDaApi, changeOrigin: false };
const proxy = { '/api': encaminhar, '/sanctum': encaminhar, '/docs': encaminhar };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.E2E_WEB_PORT) || 5173, strictPort: true, proxy },
  preview: { port: Number(process.env.E2E_WEB_PORT) || 4173, strictPort: true, proxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/preparar.js'],
    // Os fluxos do Playwright (e2e/*.spec.js) não são testes do Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/testes/**', 'src/main.jsx'],
    },
  },
});
