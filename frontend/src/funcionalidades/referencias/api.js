import { http } from '../../lib/http.js';

/**
 * GET /referencias. Devolve { papeis, fundamentos, niveis, etapas, visibilidades, origens_sessao },
 * cada um uma lista de { valor, rotulo } (docs/API.md), já sem o envelope `data`.
 */
export async function obterReferencias({ signal } = {}) {
  const resposta = await http.get('/referencias', { signal });
  return resposta.data.data;
}
