import { http } from '../../lib/http.js';

/**
 * GET /referencias (público). Devolve `{ papeis, fundamentos, niveis, etapas, visibilidades, origens_sessao }`,
 * cada lista com itens `{ valor, rotulo }`: `valor` vai nas requisições e `rotulo` aparece na tela.
 */
export async function listarReferencias({ signal } = {}) {
  const resposta = await http.get('/referencias', { signal });
  return resposta.data.data;
}
