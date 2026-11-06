import { http } from '../../lib/http.js';

/**
 * Lista treinos: GET /treinos.
 * `escopo` é 'meus', 'treinador' ou 'destaque' e `page` começa em 1; sem eles, o servidor usa o padrão dele.
 * Devolve a página como a API manda: { data: [treino resumido], links, meta }.
 */
export async function listarTreinos({ escopo, page } = {}) {
  const resposta = await http.get('/treinos', { params: { escopo, page } });
  const { data, links = null, meta = null } = resposta.data;
  return { data, links, meta };
}

/** Detalha um treino: GET /treinos/{id}. Devolve o treino com `itens`, sem o envelope `data`. */
export async function buscarTreino(id) {
  const resposta = await http.get(`/treinos/${encodeURIComponent(id)}`);
  return resposta.data.data;
}
