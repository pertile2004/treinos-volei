import { useMutation } from '@tanstack/react-query';
import { cadastrar } from './api.js';

/** Mutação do cadastro. O que fazer no sucesso ou no erro fica a cargo de quem chama `mutate`. */
export function useCadastro() {
  return useMutation({ mutationFn: cadastrar });
}
