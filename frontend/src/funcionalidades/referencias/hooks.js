import { useQuery } from '@tanstack/react-query';
import { listarReferencias } from './api.js';

/** Chaves de consulta do módulo. */
export const chavesReferencias = {
  todas: () => ['referencias'],
};

/**
 * Listas de referência da API (fundamentos, níveis, etapas, visibilidades, papéis). São enums do backend e
 * não mudam durante a sessão, então o cache nunca fica velho. `opcoes` são opções extras do useQuery.
 */
export function useReferencias(opcoes = {}) {
  return useQuery({
    staleTime: Infinity,
    ...opcoes,
    queryKey: chavesReferencias.todas(),
    queryFn: ({ signal }) => listarReferencias({ signal }),
  });
}
