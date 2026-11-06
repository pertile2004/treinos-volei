import { http } from '../../lib/http.js';

/**
 * Lista os agendamentos do usuário no intervalo: GET /agendamentos?de=AAAA-MM-DD&ate=AAAA-MM-DD (máximo 31 dias).
 * Devolve a lista sem o envelope `data`, já na ordem do servidor (data, hora, id).
 */
export async function listarAgendamentos({ de, ate }) {
  const resposta = await http.get('/agendamentos', { params: { de, ate } });
  return resposta.data.data;
}

/** Agenda um treino: POST /agendamentos com { treino_id, data, hora }. `hora` ausente vai como null. */
export async function criarAgendamento({ treino_id, data, hora = null }) {
  const resposta = await http.post('/agendamentos', { treino_id, data, hora: hora ?? null });
  return resposta.data.data;
}

/** Altera data e hora: PATCH /agendamentos/{id}. Treino e sessão não mudam. */
export async function atualizarAgendamento(id, { data, hora }) {
  const resposta = await http.patch(`/agendamentos/${encodeURIComponent(id)}`, { data, hora });
  return resposta.data.data;
}

/** Remove o agendamento: DELETE /agendamentos/{id} (204, sem corpo). A sessão vinculada continua. */
export async function removerAgendamento(id) {
  await http.delete(`/agendamentos/${encodeURIComponent(id)}`);
}
