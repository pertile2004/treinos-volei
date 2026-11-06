import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MES, SEMANA, registrarEstatisticas } from '../../testes/exemplosDeEstatisticas.js';
import { chavesEstatisticas, useEstatisticas } from './hooks.js';

function renderizarHook(usar, propsIniciais) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  return { ...renderHook(usar, { wrapper, initialProps: propsIniciais }), cliente };
}

describe('chavesEstatisticas', () => {
  it('a chave do periodo fica embaixo da chave geral', () => {
    expect(chavesEstatisticas.todas()).toEqual(['estatisticas']);
    expect(chavesEstatisticas.periodo('mes')).toEqual(['estatisticas', 'mes']);
  });
});

describe('useEstatisticas', () => {
  it('carrega o periodo pedido e guarda na chave ["estatisticas", periodo]', async () => {
    const pedidos = registrarEstatisticas();
    const { result, cliente } = renderizarHook(() => useEstatisticas('semana'));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(SEMANA);
    expect(pedidos).toEqual(['semana']);
    expect(cliente.getQueryData(chavesEstatisticas.periodo('semana'))).toEqual(SEMANA);
  });

  it('trocar o periodo faz uma nova requisicao com o periodo novo', async () => {
    const pedidos = registrarEstatisticas();
    const { result, rerender } = renderizarHook(({ periodo }) => useEstatisticas(periodo), { periodo: 'semana' });
    await waitFor(() => expect(result.current.data).toEqual(SEMANA));
    rerender({ periodo: 'mes' });
    await waitFor(() => expect(result.current.data).toEqual(MES));
    expect(pedidos).toEqual(['semana', 'mes']);
  });

  it('periodo invalido deixa a consulta desligada, sem chamar a API', () => {
    const pedidos = registrarEstatisticas();
    const { result } = renderizarHook(() => useEstatisticas('dia'));
    expect(result.current.fetchStatus).toBe('idle');
    expect(pedidos).toEqual([]);
  });
});
