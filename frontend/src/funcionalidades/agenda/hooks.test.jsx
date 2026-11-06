import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import {
  chavesAgendamentos,
  useAgendamentos,
  useAgendamentosDeHoje,
  useAtualizarAgendamento,
  useCriarAgendamento,
  useProximosAgendamentos,
  useRemoverAgendamento,
} from './hooks.js';

const AGENDAMENTO = {
  id: 12,
  data: '2026-11-11',
  hora: '18:30',
  concluido: false,
  sessao_id: null,
  treino: { id: 5, nome: 'Saque e recepção', duracao_estimada_minutos: 40 },
};

function criarCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function envolver(cliente = criarCliente()) {
  return function Envoltorio({ children }) {
    return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  };
}

/** Responde a lista e guarda a query de cada chamada. */
function atenderLista(corpo = { data: [AGENDAMENTO] }) {
  const consultas = [];
  servidor.use(
    rede.get('/api/v1/agendamentos', ({ request }) => {
      consultas.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(corpo);
    }),
  );
  return consultas;
}

// Quarta-feira, 11/11/2026, 15h em São Paulo (18h UTC).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('chavesAgendamentos', () => {
  it('toda chave comeca por agendamentos e a lista inclui o intervalo', () => {
    expect(chavesAgendamentos.todas()).toEqual(['agendamentos']);
    expect(chavesAgendamentos.lista({ de: '2026-11-09', ate: '2026-11-15' })).toEqual([
      'agendamentos',
      'lista',
      { de: '2026-11-09', ate: '2026-11-15' },
    ]);
  });
});

describe('useAgendamentos', () => {
  it('busca o intervalo e entrega a lista', async () => {
    const consultas = atenderLista();
    const { result } = renderHook(() => useAgendamentos({ de: '2026-11-09', ate: '2026-11-15' }), {
      wrapper: envolver(),
    });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([AGENDAMENTO]);
    expect(consultas).toEqual([{ de: '2026-11-09', ate: '2026-11-15' }]);
  });

  it('sem intervalo completo fica desligado', async () => {
    const consultas = atenderLista();
    const { result } = renderHook(() => useAgendamentos({ de: '2026-11-09' }), { wrapper: envolver() });
    await new Promise((resolver) => setTimeout(resolver, 30));
    expect(result.current.fetchStatus).toBe('idle');
    expect(consultas).toEqual([]);
  });

  it('erro da API chega no hook', async () => {
    servidor.use(
      rede.get('/api/v1/agendamentos', () =>
        HttpResponse.json({ message: 'Erro interno do servidor.', request_id: 'abc-123' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useAgendamentos({ de: '2026-11-09', ate: '2026-11-15' }), {
      wrapper: envolver(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(500);
  });
});

describe('useAgendamentosDeHoje', () => {
  it('pede de = ate = hoje em Sao Paulo', async () => {
    const consultas = atenderLista();
    const { result } = renderHook(() => useAgendamentosDeHoje(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(consultas).toEqual([{ de: '2026-11-11', ate: '2026-11-11' }]);
    expect(result.current.data).toEqual([AGENDAMENTO]);
  });

  it('as 23h30 de Sao Paulo (02h30 UTC do dia seguinte) ainda e o dia local', async () => {
    vi.setSystemTime(new Date('2026-11-12T02:30:00Z'));
    const consultas = atenderLista();
    const { result } = renderHook(() => useAgendamentosDeHoje(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(consultas).toEqual([{ de: '2026-11-11', ate: '2026-11-11' }]);
  });
});

describe('useProximosAgendamentos', () => {
  it('por padrao pede de hoje ate 6 dias a frente', async () => {
    const consultas = atenderLista();
    const { result } = renderHook(() => useProximosAgendamentos(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(consultas).toEqual([{ de: '2026-11-11', ate: '2026-11-17' }]);
  });

  it('aceita a quantidade de dias e nunca passa de 31', async () => {
    const consultas = atenderLista();
    const { result } = renderHook(() => useProximosAgendamentos({ dias: 60 }), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(consultas).toEqual([{ de: '2026-11-11', ate: '2026-12-11' }]);
  });
});

describe('mutacoes', () => {
  it('criar envia o POST e invalida as listas de agendamentos', async () => {
    let listagens = 0;
    const corpos = [];
    servidor.use(
      rede.get('/api/v1/agendamentos', () => {
        listagens += 1;
        return HttpResponse.json({ data: [] });
      }),
      rede.post('/api/v1/agendamentos', async ({ request }) => {
        corpos.push(await request.json());
        return HttpResponse.json({ data: AGENDAMENTO }, { status: 201 });
      }),
    );
    const cliente = criarCliente();
    const lista = renderHook(() => useAgendamentos({ de: '2026-11-09', ate: '2026-11-15' }), {
      wrapper: envolver(cliente),
    });
    await waitFor(() => expect(lista.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useCriarAgendamento(), { wrapper: envolver(cliente) });
    const criado = await result.current.mutateAsync({ treino_id: 5, data: '2026-11-11', hora: '18:30' });
    expect(criado).toEqual(AGENDAMENTO);
    expect(corpos).toEqual([{ treino_id: 5, data: '2026-11-11', hora: '18:30' }]);
    await waitFor(() => expect(listagens).toBe(2));
  });

  it('atualizar envia o PATCH com id e dados e invalida', async () => {
    let listagens = 0;
    const chamadas = [];
    servidor.use(
      rede.get('/api/v1/agendamentos', () => {
        listagens += 1;
        return HttpResponse.json({ data: [AGENDAMENTO] });
      }),
      rede.patch('/api/v1/agendamentos/:id', async ({ params, request }) => {
        chamadas.push([params.id, await request.json()]);
        return HttpResponse.json({ data: { ...AGENDAMENTO, hora: '19:00' } });
      }),
    );
    const cliente = criarCliente();
    const hoje = renderHook(() => useAgendamentosDeHoje(), { wrapper: envolver(cliente) });
    await waitFor(() => expect(hoje.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useAtualizarAgendamento(), { wrapper: envolver(cliente) });
    await result.current.mutateAsync({ id: 12, data: '2026-11-11', hora: '19:00' });
    expect(chamadas).toEqual([['12', { data: '2026-11-11', hora: '19:00' }]]);
    await waitFor(() => expect(listagens).toBe(2));
  });

  it('remover envia o DELETE e invalida', async () => {
    let listagens = 0;
    const ids = [];
    servidor.use(
      rede.get('/api/v1/agendamentos', () => {
        listagens += 1;
        return HttpResponse.json({ data: [AGENDAMENTO] });
      }),
      rede.delete('/api/v1/agendamentos/:id', ({ params }) => {
        ids.push(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const cliente = criarCliente();
    const hoje = renderHook(() => useAgendamentosDeHoje(), { wrapper: envolver(cliente) });
    await waitFor(() => expect(hoje.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useRemoverAgendamento(), { wrapper: envolver(cliente) });
    await result.current.mutateAsync(12);
    expect(ids).toEqual(['12']);
    await waitFor(() => expect(listagens).toBe(2));
  });
});
