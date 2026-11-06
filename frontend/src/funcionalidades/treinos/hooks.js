import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarTreino } from './api.js';

// Toda chave de treinos começa por 'treinos' (as listas e detalhes chegam no PR-13, nos mesmos arquivos).
const CHAVE_TREINOS = ['treinos'];

/**
 * Mutação que cria um treino (POST /treinos). `mutate(corpo)` recebe o corpo de estadoParaCorpo;
 * `data` é o treino criado. Depois de criar, invalida toda consulta de treinos.
 * `opcoes` são opções extras do useMutation (onSuccess, onError…), chamadas depois da invalidação.
 */
export function useCriarTreino(opcoes = {}) {
  const cliente = useQueryClient();
  return useMutation({
    ...opcoes,
    mutationFn: (corpo) => criarTreino(corpo),
    onSuccess: async (...argumentos) => {
      await cliente.invalidateQueries({ queryKey: CHAVE_TREINOS });
      await opcoes.onSuccess?.(...argumentos);
    },
  });
}
