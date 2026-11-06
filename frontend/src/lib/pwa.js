/**
 * Apoio ao PWA (service worker gerado pelo vite-plugin-pwa em vite.config.js).
 *
 * Duas camadas guardam dados da API no aparelho: o TanStack Query (memória, morre ao fechar a aba)
 * e o Cache Storage do service worker (disco, sobrevive ao fechar). Este módulo cuida da segunda.
 */

/** Prefixo de todo cache de API do service worker; o pré-cache do app shell (workbox-precache-*) não o usa. */
export const PREFIXO_DOS_CACHES_DE_API = 'api-';

/** Cache em tempo de execução das respostas 200 de GET /exercicios e /treinos (stale-while-revalidate). */
export const CACHE_DA_API = `${PREFIXO_DOS_CACHES_DE_API}biblioteca`;

/**
 * Apaga os caches de API do service worker, preservando o app shell.
 * Chamar ao sair e quando a sessão expira (401), para o próximo usuário do aparelho não ver dados do anterior.
 */
export async function limparCachesDoApp() {
  if (typeof caches === 'undefined') return;
  const nomes = await caches.keys();
  await Promise.all(
    nomes.filter((nome) => nome.startsWith(PREFIXO_DOS_CACHES_DE_API)).map((nome) => caches.delete(nome)),
  );
}

/** Encerra a sessão no aparelho: limpa o cliente de consultas e os caches de API. Use no sucesso de "sair". */
export async function encerrarSessaoLocal(clienteDeConsultas) {
  clienteDeConsultas?.clear();
  await limparCachesDoApp();
}
