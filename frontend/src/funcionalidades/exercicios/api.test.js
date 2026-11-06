import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { listarExercicios, normalizarFiltros, obterExercicio } from './api.js';

const RESUMO = {
  id: 12,
  nome: 'Recepção em manchete contra a parede',
  foco: 'Plataforma firme e direção da bola',
  fundamento: 'recepcao',
  fundamento_rotulo: 'Recepção',
  nivel: 'iniciante',
  nivel_rotulo: 'Iniciante',
  series_padrao: 3,
  repeticoes_padrao: 15,
  duracao_segundos_padrao: null,
  descanso_segundos: 45,
  tem_video: true,
  imagem_url: '/ilustracoes/recepcao.svg',
};

const DETALHE = {
  id: 12,
  nome: 'Recepção em manchete contra a parede',
  descricao: 'Fique a 3 m da parede e devolva a bola em manchete.',
  foco: 'Plataforma firme e direção da bola',
  fundamento: 'recepcao',
  fundamento_rotulo: 'Recepção',
  nivel: 'iniciante',
  nivel_rotulo: 'Iniciante',
  series_padrao: 3,
  repeticoes_padrao: 15,
  duracao_segundos_padrao: null,
  descanso_segundos: 45,
  video_url: null,
  imagem_url: '/ilustracoes/recepcao.svg',
};

const PAGINA = {
  data: [RESUMO],
  links: { first: '/api/v1/exercicios?page=1', last: '/api/v1/exercicios?page=3', prev: null, next: null },
  meta: { current_page: 1, per_page: 15, total: 40, last_page: 3 },
};

/** Registra o manipulador da lista e devolve os parâmetros de cada requisição recebida. */
function capturarLista(corpo = PAGINA) {
  const pedidos = [];
  servidor.use(
    rede.get('/api/v1/exercicios', ({ request }) => {
      pedidos.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(corpo);
    }),
  );
  return pedidos;
}

describe('normalizarFiltros', () => {
  it('sem filtros devolve so a pagina 1', () => {
    expect(normalizarFiltros()).toEqual({ pagina: 1 });
    expect(normalizarFiltros(null)).toEqual({ pagina: 1 });
    expect(normalizarFiltros({})).toEqual({ pagina: 1 });
  });

  it('descarta filtros vazios e apara a busca', () => {
    expect(normalizarFiltros({ fundamento: '', nivel: null, busca: '   ', porPagina: undefined })).toEqual({
      pagina: 1,
    });
    expect(normalizarFiltros({ busca: '  Recepção alta ' })).toEqual({ busca: 'Recepção alta', pagina: 1 });
  });

  it('converte pagina e porPagina em inteiros e ignora valores invalidos', () => {
    expect(normalizarFiltros({ pagina: '3', porPagina: '50' })).toEqual({ pagina: 3, porPagina: 50 });
    expect(normalizarFiltros({ pagina: 0, porPagina: -1 })).toEqual({ pagina: 1 });
    expect(normalizarFiltros({ pagina: 'abc', porPagina: 2.5 })).toEqual({ pagina: 1 });
  });

  it('mantem todos os filtros preenchidos', () => {
    expect(
      normalizarFiltros({ fundamento: 'saque', nivel: 'avancado', busca: 'flutuante', pagina: 2, porPagina: 30 }),
    ).toEqual({ fundamento: 'saque', nivel: 'avancado', busca: 'flutuante', pagina: 2, porPagina: 30 });
  });

  it('nao altera o objeto recebido', () => {
    const filtros = { busca: ' saque ', pagina: '2' };
    normalizarFiltros(filtros);
    expect(filtros).toEqual({ busca: ' saque ', pagina: '2' });
  });
});

describe('listarExercicios', () => {
  it('sem filtros pede a pagina 1 e nada mais', async () => {
    const pedidos = capturarLista();
    await listarExercicios();
    expect(pedidos).toEqual([{ page: '1' }]);
  });

  it('envia o filtro fundamento', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ fundamento: 'recepcao' });
    expect(pedidos).toEqual([{ fundamento: 'recepcao', page: '1' }]);
  });

  it('envia o filtro nivel', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ nivel: 'intermediario' });
    expect(pedidos).toEqual([{ nivel: 'intermediario', page: '1' }]);
  });

  it('envia a busca aparada, com acentos preservados', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ busca: '  Recepção alta ' });
    expect(pedidos).toEqual([{ busca: 'Recepção alta', page: '1' }]);
  });

  it('envia pagina como page', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ pagina: 3 });
    expect(pedidos).toEqual([{ page: '3' }]);
  });

  it('envia porPagina como por_pagina', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ porPagina: 50 });
    expect(pedidos).toEqual([{ page: '1', por_pagina: '50' }]);
  });

  it('combina todos os filtros na mesma requisicao', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ fundamento: 'saque', nivel: 'avancado', busca: 'flutuante', pagina: 2, porPagina: 30 });
    expect(pedidos).toEqual([
      { fundamento: 'saque', nivel: 'avancado', busca: 'flutuante', page: '2', por_pagina: '30' },
    ]);
  });

  it('nao envia filtros vazios', async () => {
    const pedidos = capturarLista();
    await listarExercicios({ fundamento: '', nivel: null, busca: '   ', pagina: undefined, porPagina: '' });
    expect(pedidos).toEqual([{ page: '1' }]);
  });

  it('devolve data, links e meta da paginacao como a API mandou', async () => {
    capturarLista();
    const resultado = await listarExercicios({ fundamento: 'recepcao' });
    expect(resultado).toEqual(PAGINA);
    expect(resultado.data[0]).toEqual(RESUMO);
    expect(resultado.meta).toEqual({ current_page: 1, per_page: 15, total: 40, last_page: 3 });
  });

  it('devolve a lista vazia com a meta quando nada casa com os filtros', async () => {
    const vazia = { data: [], links: {}, meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } };
    capturarLista(vazia);
    expect(await listarExercicios({ busca: 'nada' })).toEqual(vazia);
  });

  it('rejeita com o erro da API em 422', async () => {
    servidor.use(
      rede.get('/api/v1/exercicios', () =>
        HttpResponse.json(
          {
            message: 'O fundamento selecionado é inválido.',
            errors: { fundamento: ['O fundamento selecionado é inválido.'] },
            request_id: 'req-422',
          },
          { status: 422 },
        ),
      ),
    );
    await expect(listarExercicios({ fundamento: 'voo' })).rejects.toMatchObject({
      response: { status: 422, data: { request_id: 'req-422', errors: { fundamento: expect.any(Array) } } },
    });
  });

  it('cancela a requisicao quando o sinal e abortado', async () => {
    capturarLista();
    const controle = new AbortController();
    controle.abort();
    await expect(listarExercicios({}, { signal: controle.signal })).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });
});

describe('obterExercicio', () => {
  it('pede /exercicios/{id} e devolve o exercicio sem o envelope data', async () => {
    const caminhos = [];
    servidor.use(
      rede.get('/api/v1/exercicios/:id', ({ request, params }) => {
        caminhos.push([new URL(request.url).pathname, new URL(request.url).search, params.id]);
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    expect(await obterExercicio(12)).toEqual(DETALHE);
    expect(await obterExercicio('12')).toEqual(DETALHE);
    expect(caminhos).toEqual([
      ['/api/v1/exercicios/12', '', '12'],
      ['/api/v1/exercicios/12', '', '12'],
    ]);
  });

  it('rejeita com o erro da API em 404', async () => {
    servidor.use(
      rede.get('/api/v1/exercicios/:id', () =>
        HttpResponse.json({ message: 'Exercício não encontrado.', request_id: 'req-404' }, { status: 404 }),
      ),
    );
    await expect(obterExercicio(999)).rejects.toMatchObject({
      response: { status: 404, data: { message: 'Exercício não encontrado.' } },
    });
  });
});
