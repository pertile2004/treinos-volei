// Persistência do treino em andamento (PR-16). O storage vem por parâmetro
// (window.localStorage na tela, um objeto falso nos testes). Nenhuma função lança erro:
// falha de leitura, dado corrompido ou de outra versão viram null/false.
import { FASES, VERSAO_DO_ESTADO, estadoEhValido } from './maquinaDoTreino.js';

export const VERSAO_DO_ARMAZENAMENTO = VERSAO_DO_ESTADO;

/** Um treino em andamento por usuário: a chave por usuário evita vazar entre contas no mesmo navegador. */
export const chaveDoTreinoAtivo = (usuarioId) => `volleypro:treino-ativo:v${VERSAO_DO_ARMAZENAMENTO}:${usuarioId}`;

function descartar(storage, chave) {
  try {
    storage.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}

/** Grava o estado como JSON. Devolve false se não deu para gravar (storage ausente, cheio ou bloqueado). */
export function salvarTreino(storage, usuarioId, estado) {
  if (!storage || !estadoEhValido(estado)) return false;
  try {
    storage.setItem(chaveDoTreinoAtivo(usuarioId), JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

/** Devolve o estado salvo ou null. Dado corrompido, de outra versão ou fora do formato é apagado. */
export function restaurarTreino(storage, usuarioId) {
  if (!storage) return null;
  const chave = chaveDoTreinoAtivo(usuarioId);
  let texto;
  try {
    texto = storage.getItem(chave);
  } catch {
    return null;
  }
  if (texto === null || texto === undefined) return null;
  let dado;
  try {
    dado = JSON.parse(texto);
  } catch {
    dado = null;
  }
  if (estadoEhValido(dado)) return dado;
  descartar(storage, chave);
  return null;
}

/** Apaga o treino salvo (depois de salvar a sessão ou de abandonar). */
export function limparTreino(storage, usuarioId) {
  if (!storage) return false;
  return descartar(storage, chaveDoTreinoAtivo(usuarioId));
}

/**
 * Diz se a mudança de estado merece gravação: a preparação não é gravada e o tique que
 * só adianta o relógio (`atualizado_em`) também não, porque o tempo é derivado dos instantes.
 */
export function precisaGravar(anterior, atual) {
  if (!atual || atual === anterior || atual.fase === FASES.PREPARACAO) return false;
  if (!anterior) return true;
  const campos = new Set([...Object.keys(anterior), ...Object.keys(atual)]);
  campos.delete('atualizado_em');
  return [...campos].some((campo) => anterior[campo] !== atual[campo]);
}
