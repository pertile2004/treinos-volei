import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CACHE_DA_API, encerrarSessaoLocal, limparCachesDoApp } from './pwa.js';

// Cache Storage simulado: o jsdom não tem `caches`.
function simularCaches(nomes) {
  const apagar = vi.fn(async () => true);
  vi.stubGlobal('caches', { keys: async () => nomes, delete: apagar });
  return apagar;
}

afterEach(() => vi.unstubAllGlobals());

describe('limparCachesDoApp', () => {
  it('apaga só os caches de API e preserva o do app shell', async () => {
    const apagar = simularCaches(['workbox-precache-v2-http://localhost/', CACHE_DA_API, 'api-outro']);
    await limparCachesDoApp();
    expect(apagar.mock.calls.map(([nome]) => nome).sort()).toEqual(['api-outro', CACHE_DA_API].sort());
  });

  it('sem Cache Storage (navegador antigo ou teste) resolve sem erro', async () => {
    expect('caches' in globalThis).toBe(false);
    await expect(limparCachesDoApp()).resolves.toBeUndefined();
  });

  it('o nome do cache de API começa com o prefixo que a limpeza procura', () => {
    expect(CACHE_DA_API).toMatch(/^api-/);
  });
});

describe('encerrarSessaoLocal', () => {
  it('limpa o cliente de consultas e os caches de API', async () => {
    const apagar = simularCaches([CACHE_DA_API]);
    const cliente = new QueryClient();
    cliente.setQueryData(['eu'], { id: 1 });
    await encerrarSessaoLocal(cliente);
    expect(cliente.getQueryData(['eu'])).toBeUndefined();
    expect(apagar).toHaveBeenCalledWith(CACHE_DA_API);
  });
});
