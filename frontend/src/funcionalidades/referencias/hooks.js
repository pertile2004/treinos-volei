import { useQuery } from '@tanstack/react-query';
import { mapaDeRotulos, obterReferencias } from './api.js';

/** Chaves de consulta do módulo. */
export const chavesReferencias = {
  todas: () => ['referencias'],
};

/** Referências (enums com rótulo). São estáticas: ficam em cache enquanto a página estiver aberta. */
export function useReferencias(opcoes = {}) {
  return useQuery({
    staleTime: Infinity,
    ...opcoes,
    queryKey: chavesReferencias.todas(),
    queryFn: ({ signal }) => obterReferencias({ signal }),
  });
}

const SEM_ROTULOS = {};

/** Mapa código → rótulo dos fundamentos. Enquanto carrega (ou se falhar), um mapa vazio: a tela mostra o código. */
export function useRotulosDosFundamentos() {
  const { data } = useReferencias();
  return data ? mapaDeRotulos(data.fundamentos) : SEM_ROTULOS;
}
