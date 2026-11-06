import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROTULOS_DOS_FUNDAMENTOS, registrarReferencias } from '../../testes/exemplosDeEstatisticas.js';
import { chavesReferencias, useReferencias, useRotulosDosFundamentos } from './hooks.js';

function renderizarHook(usar) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  return { ...renderHook(usar, { wrapper }), cliente };
}

describe('useReferencias', () => {
  it('carrega as referencias na chave ["referencias"]', async () => {
    registrarReferencias();
    const { result, cliente } = renderizarHook(() => useReferencias());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.fundamentos).toHaveLength(7);
    expect(chavesReferencias.todas()).toEqual(['referencias']);
    expect(cliente.getQueryData(chavesReferencias.todas())).toBe(result.current.data);
  });
});

describe('useRotulosDosFundamentos', () => {
  it('devolve o mapa codigo -> rotulo dos fundamentos; enquanto carrega, um mapa vazio', async () => {
    registrarReferencias();
    const { result } = renderizarHook(() => useRotulosDosFundamentos());
    expect(result.current).toEqual({});
    await waitFor(() => expect(result.current).toEqual(ROTULOS_DOS_FUNDAMENTOS));
  });
});
