import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// A API e o front ficam na mesma origem: o Vite encaminha /api, /sanctum e /docs para o Laravel,
// e também /pulse (painel de métricas do admin) e os endpoints do Livewire, que o painel usa para atualizar.
// No Livewire 4 o prefixo é /livewire-<8 hex da APP_KEY> (EndpointResolver::prefix); chave com ^ é regex no Vite.
// E2E_API_PORT e E2E_WEB_PORT trocam as portas (testes E2E e cards em paralelo na mesma máquina).
const alvoDaApi = `http://127.0.0.1:${Number(process.env.E2E_API_PORT) || 8000}`;
const encaminhar = { target: alvoDaApi, changeOrigin: false };
const proxy = {
  '/api': encaminhar,
  '/sanctum': encaminhar,
  '/docs': encaminhar,
  '/pulse': encaminhar,
  '^/livewire-[0-9a-f]{8}/': encaminhar,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.E2E_WEB_PORT) || 5173, strictPort: true, proxy },
  preview: { port: Number(process.env.E2E_WEB_PORT) || 4173, strictPort: true, proxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/preparar.js'],
    coverage: {
      provider: 'v8',
      // lcov alimenta o SonarQube Cloud no CI (job sonar, só com o segredo SONAR_TOKEN).
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/testes/**', 'src/main.jsx'],
    },
  },
});
