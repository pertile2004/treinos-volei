import { http } from '../../lib/http.js';

/** GET /referencias (público). Devolve o conteúdo de `data`: { papeis, fundamentos, niveis, etapas, visibilidades, origens_sessao }. */
export async function obterReferencias({ signal } = {}) {
  const resposta = await http.get('/referencias', { signal });
  return resposta.data.data;
}

/** Transforma uma lista [{ valor, rotulo }] em um mapa { valor: rotulo }. Sem lista, devolve {}. */
export function mapaDeRotulos(lista) {
  return Object.fromEntries((lista ?? []).map((item) => [item.valor, item.rotulo]));
}
