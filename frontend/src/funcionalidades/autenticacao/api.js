import { buscarCookieCsrf, http } from '../../lib/http.js';

/**
 * POST /auth/cadastro: cria a conta e inicia a sessão (cookie do Sanctum).
 * Busca o cookie CSRF antes e devolve o usuário criado (`data` da resposta 201).
 */
export async function cadastrar(dados) {
  await buscarCookieCsrf();
  const resposta = await http.post('/auth/cadastro', dados);
  return resposta.data.data;
}
