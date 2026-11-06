import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { buscarTreino, listarTreinos } from './api.js';

const RESUMO = {
  id: 12,
  nome: 'Saque e recepção',
  descricao: 'Foco em regularidade',
  nivel: 'intermediario',
  visibilidade: 'privado',
  duracao_estimada_minutos: 45,
  total_exercicios: 8,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
};

const LINKS = { first: '/api/v1/treinos?page=1', last: '/api/v1/treinos?page=1', prev: null, next: null };
const META = { current_page: 1, per_page: 15, total: 1 };

const DETALHE = {
  id: 12,
  nome: 'Saque e recepção',
  descricao: 'Foco em regularidade',
  nivel: 'intermediario',
  visibilidade: 'privado',
  duracao_estimada_minutos: 45,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
  itens: [
    {
      id: 40,
      etapa: 'aquecimento',
      ordem: 1,
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
      exercicio: { id: 7, nome: 'Saque por baixo no alvo', fundamento: 'saque', nivel: 'iniciante', removido: false },
    },
  ],
};

/** Responde a lista e guarda a query de cada chamada, como objeto simples. */
function atenderLista(corpo = { data: [RESUMO], links: LINKS, meta: META }) {
  const consultas = [];
  servidor.use(
    rede.get('/api/v1/treinos', ({ request }) => {
      consultas.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(corpo);
    }),
  );
  return consultas;
}

describe('listarTreinos', () => {
  it('sem filtros chama GET /treinos sem query (o servidor decide o padrao)', async () => {
    const consultas = atenderLista();
    await listarTreinos();
    expect(consultas).toEqual([{}]);
  });

  it.each(['meus', 'treinador', 'destaque'])('envia o escopo %s', async (escopo) => {
    const consultas = atenderLista();
    await listarTreinos({ escopo });
    expect(consultas).toEqual([{ escopo }]);
  });

  it('envia a pagina no parametro page', async () => {
    const consultas = atenderLista();
    await listarTreinos({ page: 2 });
    expect(consultas).toEqual([{ page: '2' }]);
  });

  it('envia escopo e pagina juntos', async () => {
    const consultas = atenderLista();
    await listarTreinos({ escopo: 'destaque', page: 3 });
    expect(consultas).toEqual([{ escopo: 'destaque', page: '3' }]);
  });

  it('nao envia filtro vazio nem parametro que o contrato nao tem', async () => {
    const consultas = atenderLista();
    await listarTreinos({ escopo: undefined, page: null, usuario: 9, por_pagina: 50 });
    expect(consultas).toEqual([{}]);
  });

  it('devolve data, links e meta da paginacao como a API mandou', async () => {
    atenderLista();
    await expect(listarTreinos({ escopo: 'meus', page: 1 })).resolves.toEqual({
      data: [RESUMO],
      links: LINKS,
      meta: META,
    });
  });

  it('pagina sem treinos devolve data vazio e preserva o meta', async () => {
    const meta = { current_page: 1, per_page: 15, total: 0 };
    atenderLista({ data: [], links: LINKS, meta });
    await expect(listarTreinos()).resolves.toEqual({ data: [], links: LINKS, meta });
  });

  it('rejeita com o erro do http quando a API recusa o filtro', async () => {
    servidor.use(
      rede.get('/api/v1/treinos', () =>
        HttpResponse.json(
          { message: 'O escopo informado é inválido.', errors: { escopo: ['O escopo informado é inválido.'] } },
          { status: 422 },
        ),
      ),
    );
    await expect(listarTreinos({ escopo: 'treinador' })).rejects.toMatchObject({
      response: { status: 422, data: { errors: { escopo: ['O escopo informado é inválido.'] } } },
    });
  });
});

describe('buscarTreino', () => {
  it('chama GET /treinos/{id} sem query e devolve o treino sem o envelope data', async () => {
    const chamadas = [];
    servidor.use(
      rede.get('/api/v1/treinos/:id', ({ params, request }) => {
        chamadas.push([params.id, new URL(request.url).search]);
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    await expect(buscarTreino(12)).resolves.toEqual(DETALHE);
    expect(chamadas).toEqual([['12', '']]);
  });

  it('aceita o id como texto (vem assim da rota)', async () => {
    const ids = [];
    servidor.use(
      rede.get('/api/v1/treinos/:id', ({ params }) => {
        ids.push(params.id);
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    await buscarTreino('12');
    expect(ids).toEqual(['12']);
  });

  it('rejeita com o erro do http quando o treino nao existe ou nao e visivel', async () => {
    servidor.use(
      rede.get('/api/v1/treinos/:id', () => HttpResponse.json({ message: 'Treino não encontrado.' }, { status: 404 })),
    );
    await expect(buscarTreino(99)).rejects.toMatchObject({
      response: { status: 404, data: { message: 'Treino não encontrado.' } },
    });
  });
});
