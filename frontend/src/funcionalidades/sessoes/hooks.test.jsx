import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { chavesSessoes, useRegistrarSessao, useSessao } from './hooks.js';

const SESSAO = {
  id: 40,
  id_cliente: '0b8f6c1e-3f0a-4a57-9d0e-2a4c6c1f7b11',
  origem: 'cronometro',
  treino: { id: 12, nome: 'Recepção básica' },
  iniciada_em: '2026-11-06T21:00:00Z',
  finalizada_em: '2026-11-06T21:38:10Z',
  duracao_segundos: 2100,
  observacao: null,
  series: [],
};

function criarCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function envolver(cliente) {
  return function Envoltorio({ children }) {
    return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  };
}

describe('chavesSessoes', () => {
  it('toda chave comeca por sessoes e o detalhe trata 40 e "40" como a mesma sessao', () => {
    expect(chavesSessoes.todas()).toEqual(['sessoes']);
    expect(chavesSessoes.listas()).toEqual(['sessoes', 'lista']);
    expect(chavesSessoes.detalhe(40)).toEqual(['sessoes', 'detalhe', 40]);
    expect(chavesSessoes.detalhe('40')).toEqual(['sessoes', 'detalhe', 40]);
    expect(chavesSessoes.detalhe(undefined)).toEqual(['sessoes', 'detalhe', null]);
  });
});

describe('useSessao', () => {
  it('busca a sessao pelo id', async () => {
    servidor.use(rede.get('/api/v1/sessoes/40', () => HttpResponse.json({ data: SESSAO })));
    const { result } = renderHook(() => useSessao('40'), { wrapper: envolver(criarCliente()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(SESSAO);
  });

  it('sem id a consulta fica desligada', () => {
    const { result } = renderHook(() => useSessao(undefined), { wrapper: envolver(criarCliente()) });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('404 vira erro', async () => {
    servidor.use(rede.get('/api/v1/sessoes/99', () => HttpResponse.json({ message: 'Nada' }, { status: 404 })));
    const { result } = renderHook(() => useSessao(99), { wrapper: envolver(criarCliente()) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(404);
  });
});

describe('useRegistrarSessao', () => {
  it('envia o corpo, devolve a sessao e guarda o detalhe no cache', async () => {
    const cliente = criarCliente();
    const recebidos = [];
    servidor.use(
      rede.post('/api/v1/sessoes', async ({ request }) => {
        recebidos.push(await request.json());
        return HttpResponse.json({ data: SESSAO }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useRegistrarSessao(), { wrapper: envolver(cliente) });
    result.current.mutate({ id_cliente: SESSAO.id_cliente, origem: 'cronometro', series: [] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(SESSAO);
    expect(recebidos).toHaveLength(1);
    expect(recebidos[0].id_cliente).toBe(SESSAO.id_cliente);
    expect(cliente.getQueryData(chavesSessoes.detalhe(40))).toEqual(SESSAO);
  });

  it('erro do servidor fica em error, com o status', async () => {
    servidor.use(
      rede.post('/api/v1/sessoes', () => HttpResponse.json({ message: 'Erro', request_id: 'r-9' }, { status: 500 })),
    );
    const { result } = renderHook(() => useRegistrarSessao(), { wrapper: envolver(criarCliente()) });
    result.current.mutate({ id_cliente: 'x', origem: 'cronometro', series: [] });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(500);
  });
});
