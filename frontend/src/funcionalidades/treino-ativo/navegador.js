// Acesso ao navegador (localStorage, UUID e vibração) isolado para a tela e os hooks do treino ativo.
// Tudo com detecção de suporte: a tela funciona em navegador sem storage ou sem vibração.

/**
 * Chave do treino em andamento no armazenamento local. Até o login existir no front (PR-05), todo
 * aparelho usa este mesmo segmento; o PR-05 troca pelo id do usuário logado.
 */
export const USUARIO_DO_ARMAZENAMENTO = 'local';

/** O localStorage do navegador, ou null quando o acesso lança (modo privado, bloqueio de site). */
export function obterStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** UUID para o id_cliente da sessão. */
export function gerarIdCliente() {
  return crypto.randomUUID();
}

/** Vibra se o navegador permitir; nunca é o único aviso (o texto "Descanso encerrado" vai no aria-live). */
export function vibrar(duracaoMs = 200) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  try {
    return Boolean(navigator.vibrate(duracaoMs));
  } catch {
    return false;
  }
}
