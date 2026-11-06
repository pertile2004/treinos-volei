import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { useCriarTreino } from './hooks.js';

const CORPO = {
  nome: 'Terça',
  descricao: null,
  nivel: 'iniciante',
  visibilidade: 'privado',
  itens: [
    {
      exercicio_id: 15,
      etapa: 'tecnica',
      ordem: 1,
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
    },
  ],
};

const TREINO = { id: 12, nome: 'Terça', duracao_estimada_minutos: 3, itens: [] };

function renderizarHook(usar) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  return { ...renderHook(usar, { wrapper }), cliente };
}

describe('useCriarTreino', () => {
  it('envia o corpo, devolve o treino criado e invalida a chave treinos', async () => {
    const corpos = [];
    servidor.use(
      rede.post('/api/v1/treinos', async ({ request }) => {
        corpos.push(await request.json());
        return HttpResponse.json({ data: TREINO }, { status: 201 });
      }),
    );
    const { result, cliente } = renderizarHook(() => useCriarTreino());
    cliente.setQueryData(['treinos', 'lista', { escopo: 'meus' }], { data: [] });
    cliente.setQueryData(['exercicios', 'lista', { pagina: 1 }], { data: [] });
    const invalidar = vi.spyOn(cliente, 'invalidateQueries');

    result.current.mutate(CORPO);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(corpos).toEqual([CORPO]);
    expect(result.current.data).toEqual(TREINO);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['treinos'] });
    expect(cliente.getQueryState(['treinos', 'lista', { escopo: 'meus' }]).isInvalidated).toBe(true);
    expect(cliente.getQueryState(['exercicios', 'lista', { pagina: 1 }]).isInvalidated).toBe(false);
  });

  it('chama o onSuccess de quem usa com o treino criado', async () => {
    servidor.use(rede.post('/api/v1/treinos', () => HttpResponse.json({ data: TREINO }, { status: 201 })));
    const aoCriar = vi.fn();
    const { result } = renderizarHook(() => useCriarTreino({ onSuccess: aoCriar }));
    result.current.mutate(CORPO);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(aoCriar).toHaveBeenCalledWith(TREINO, CORPO, undefined, expect.anything());
  });

  it('em erro expõe a resposta da API e nao invalida nada', async () => {
    servidor.use(
      rede.post('/api/v1/treinos', () =>
        HttpResponse.json({ message: 'Não autenticado.', request_id: 'req-401' }, { status: 401 }),
      ),
    );
    const { result, cliente } = renderizarHook(() => useCriarTreino());
    const invalidar = vi.spyOn(cliente, 'invalidateQueries');
    result.current.mutate(CORPO);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(401);
    expect(invalidar).not.toHaveBeenCalled();
  });
});
