import { http as rede, HttpResponse } from 'msw';
import { servidor } from '../servidor.js';
import { REFERENCIAS } from './referencias.js';

// Corpos iguais aos exemplos do contrato do PR-08 (só para testes).
export const RESUMO = {
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

export const RESUMO_COM_DURACAO = {
  id: 7,
  nome: 'Saque por cima na linha de fundo',
  foco: 'Lançamento constante',
  fundamento: 'saque',
  fundamento_rotulo: 'Saque',
  nivel: 'intermediario',
  nivel_rotulo: 'Intermediário',
  series_padrao: 4,
  repeticoes_padrao: null,
  duracao_segundos_padrao: 30,
  descanso_segundos: 60,
  tem_video: false,
  imagem_url: '/ilustracoes/saque.svg',
};

export const DETALHE = {
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

export const DETALHE_COM_VIDEO = {
  ...DETALHE,
  id: 13,
  nome: 'Recepção alta com deslocamento',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

export function paginaDe(itens, meta = {}) {
  const metaFinal = { current_page: 1, per_page: 15, total: itens.length, last_page: 1, ...meta };
  return {
    data: itens,
    links: {
      first: '/api/v1/exercicios?page=1',
      last: `/api/v1/exercicios?page=${metaFinal.last_page}`,
      prev: metaFinal.current_page > 1 ? `/api/v1/exercicios?page=${metaFinal.current_page - 1}` : null,
      next:
        metaFinal.current_page < metaFinal.last_page ? `/api/v1/exercicios?page=${metaFinal.current_page + 1}` : null,
    },
    meta: metaFinal,
  };
}

/** GET /referencias com o corpo do API.md. */
export function registrarReferencias() {
  servidor.use(rede.get('/api/v1/referencias', () => HttpResponse.json({ data: REFERENCIAS })));
}

/**
 * GET /exercicios respondendo com `responder(parametros)` (ou um corpo fixo) e devolvendo a lista
 * dos parâmetros recebidos em cada requisição.
 */
export function registrarLista(responder = paginaDe([RESUMO, RESUMO_COM_DURACAO])) {
  const pedidos = [];
  servidor.use(
    rede.get('/api/v1/exercicios', ({ request }) => {
      const parametros = Object.fromEntries(new URL(request.url).searchParams);
      pedidos.push(parametros);
      const corpo = typeof responder === 'function' ? responder(parametros) : responder;
      return HttpResponse.json(corpo);
    }),
  );
  return pedidos;
}

/** GET /exercicios/{id} respondendo com o detalhe informado. */
export function registrarDetalhe(detalhe = DETALHE) {
  const ids = [];
  servidor.use(
    rede.get('/api/v1/exercicios/:id', ({ params }) => {
      ids.push(params.id);
      return HttpResponse.json({ data: detalhe });
    }),
  );
  return ids;
}

/** Resposta de erro no formato da API: { message, errors?, request_id }. */
export function erroDaApi(status, message, extras = {}) {
  return HttpResponse.json({ message, request_id: `req-${status}`, ...extras }, { status });
}
