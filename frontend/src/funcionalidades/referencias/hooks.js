import { useQuery } from '@tanstack/react-query';
import { obterReferencias } from './api.js';

export const chavesReferencias = {
  todas: () => ['referencias'],
};

/** Rótulos dos enums da API. Mudam só com deploy, então a consulta nunca fica obsoleta sozinha. */
export function useReferencias(opcoes = {}) {
  return useQuery({
    staleTime: Infinity,
    ...opcoes,
    queryKey: chavesReferencias.todas(),
    queryFn: ({ signal }) => obterReferencias({ signal }),
  });
}
