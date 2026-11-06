import axios from 'axios';
import { limparCachesDoApp } from './pwa.js';

export const http = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});

let navegar = (destino) => window.location.assign(destino);

export function definirNavegacao(funcao) {
  navegar = funcao;
}

export function buscarCookieCsrf() {
  return axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

http.interceptors.request.use((config) => {
  config.headers.set('X-Request-Id', crypto.randomUUID());
  return config;
});

http.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const status = erro.response?.status;
    const config = erro.config;
    if (status === 419 && config && !config.csrfRepetido) {
      config.csrfRepetido = true;
      await buscarCookieCsrf();
      return http.request(config);
    }
    if (status === 401) {
      // Sessão encerrada: os dados do usuário guardados pelo service worker não podem ficar no aparelho.
      limparCachesDoApp().catch(() => {});
      if (window.location.pathname !== '/entrar') {
        const pedida = window.location.pathname + window.location.search;
        navegar(`/entrar?voltar=${encodeURIComponent(pedida)}`);
      }
    }
    return Promise.reject(erro);
  },
);
