import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { listarReferencias } from './api.js';
import { chavesReferencias, useReferencias } from './hooks.js';

const REFERENCIAS = {
  papeis: [{ valor: 'jogador', rotulo: 'Jogador' }],
  fundamentos: [{ valor: 'recepcao', rotulo: 'Recepção' }],
  niveis: [{ valor: 'iniciante', rotulo: 'Iniciante' }],
  etapas: [{ valor: 'aquecimento', rotulo: 'Aquecimento' }],
  visibilidades: [{ valor: 'privado', rotulo: 'Privado' }],
  origens_sessao: [{ valor: 'cronometro', rotulo: 'Cronômetro' }],
};

function registrar() {
  const pedidos = [];
  servidor.use(
    rede.get('/api/v1/referencias', ({ request }) => {
      pedidos.push(request.url);
      return HttpResponse.json({ data: REFERENCIAS });
    }),
  );
  return pedidos;
}

function renderizarHook(usar) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  return { ...renderHook(usar, { wrapper }), cliente };
}

describe('listarReferencias', () => {
  it('devolve o conteudo de data', async () => {
    registrar();
    await expect(listarReferencias()).resolves.toEqual(REFERENCIAS);
  });
});

describe('useReferencias', () => {
  it('guarda as referencias na chave do modulo', async () => {
    const pedidos = registrar();
    const { result, cliente } = renderizarHook(() => useReferencias());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(REFERENCIAS);
    expect(chavesReferencias.todas()).toEqual(['referencias']);
    expect(cliente.getQueryData(['referencias'])).toEqual(REFERENCIAS);
    expect(pedidos).toHaveLength(1);
  });

  it('nao refaz a consulta enquanto o cache estiver montado (dados raramente mudam)', async () => {
    const pedidos = registrar();
    const { result, rerender } = renderizarHook(() => useReferencias());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender();
    expect(result.current.isStale).toBe(false);
    expect(pedidos).toHaveLength(1);
  });

  it('expõe o erro da API', async () => {
    servidor.use(
      rede.get('/api/v1/referencias', () =>
        HttpResponse.json({ message: 'Serviço indisponível.', request_id: 'req-503' }, { status: 503 }),
      ),
    );
    const { result } = renderizarHook(() => useReferencias());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(503);
  });
});
