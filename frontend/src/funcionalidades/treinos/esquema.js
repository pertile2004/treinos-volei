import { z } from 'zod';
import { DESCRICAO_MAXIMA, NOME_MAXIMO, VISIBILIDADES, VISIBILIDADES_POR_PAPEL } from './validarTreino.js';

/** Visibilidades que o papel pode escolher (RN-06). Sem papel conhecido, todas: o servidor decide (422). */
export function visibilidadesDoPapel(papel) {
  return VISIBILIDADES_POR_PAPEL[papel] ?? VISIBILIDADES;
}

/**
 * Esquema Zod dos campos do cabeçalho do treino (nome, descrição, nível e visibilidade), com as mesmas
 * mensagens de validarTreino.js. Os itens ficam no reducer montadorDeTreino e são conferidos por validarTreino.
 * `opcoes.papel` restringe a visibilidade; `opcoes.niveis` (valores do GET /referencias) confere o nível.
 */
export function esquemaDoTreino({ papel, niveis } = {}) {
  const permitidas = visibilidadesDoPapel(papel);
  return z.object({
    nome: z
      .string()
      .trim()
      .min(1, 'Informe o nome do treino.')
      .max(NOME_MAXIMO, `O nome pode ter no máximo ${NOME_MAXIMO} caracteres.`),
    descricao: z
      .string()
      .trim()
      .max(DESCRICAO_MAXIMA, `A descrição pode ter no máximo ${DESCRICAO_MAXIMA} caracteres.`),
    nivel: z
      .string()
      .min(1, 'Escolha o nível do treino.')
      .refine((valor) => !niveis || niveis.includes(valor), 'Nível inválido.'),
    visibilidade: z
      .string()
      .min(1, 'Escolha a visibilidade do treino.')
      .refine((valor) => VISIBILIDADES.includes(valor), 'Visibilidade inválida.')
      .refine(
        (valor) => !VISIBILIDADES.includes(valor) || permitidas.includes(valor),
        'Seu perfil não pode usar esta visibilidade.',
      ),
  });
}
