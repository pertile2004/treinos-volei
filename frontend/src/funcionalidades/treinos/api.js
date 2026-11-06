import { http } from '../../lib/http.js';

/**
 * POST /treinos. `corpo` vem de estadoParaCorpo (corpoDoTreino.js):
 * { nome, descricao, nivel, visibilidade, itens: [{ exercicio_id, etapa, ordem, series, repeticoes, duracao_segundos, descanso_segundos }] }.
 * Devolve o treino criado, já sem o envelope `data` (inclui duracao_estimada_minutos, autor e itens com exercicio).
 */
export async function criarTreino(corpo, { signal } = {}) {
  const resposta = await http.post('/treinos', corpo, { signal });
  return resposta.data.data;
}
