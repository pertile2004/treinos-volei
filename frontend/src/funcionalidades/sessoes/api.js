import { http } from '../../lib/http.js';

/**
 * Salva uma sessão: POST /sessoes. Idempotente por `id_cliente`: reenviar o mesmo corpo devolve a mesma sessão
 * (201 no primeiro envio, 200 no reenvio). Devolve a sessão com `series`, sem o envelope `data`.
 * O cookie CSRF é tratado pelo http.js (um 419 é repetido uma vez depois de buscar o cookie).
 */
export async function registrarSessao(corpo) {
  const resposta = await http.post('/sessoes', corpo);
  return resposta.data.data;
}

/** Detalha uma sessão do usuário: GET /sessoes/{id}. Devolve a sessão sem o envelope `data`. */
export async function buscarSessao(id) {
  const resposta = await http.get(`/sessoes/${encodeURIComponent(id)}`);
  return resposta.data.data;
}
