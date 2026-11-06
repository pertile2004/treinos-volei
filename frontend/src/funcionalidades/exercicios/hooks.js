import { useQuery } from '@tanstack/react-query';
import { listarExercicios, normalizarFiltros, obterExercicio } from './api.js';

// O id chega como número (itens da lista) ou texto (parâmetro da rota): os dois usam a mesma chave.
function normalizarId(id) {
  if (id == null || id === '') return null;
  return typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id;
}

/** Chaves de consulta do módulo. Para invalidar tudo: queryClient.invalidateQueries({ queryKey: chavesExercicios.todas() }). */
export const chavesExercicios = {
  todas: () => ['exercicios'],
  listas: () => ['exercicios', 'lista'],
  lista: (filtros) => ['exercicios', 'lista', normalizarFiltros(filtros)],
  detalhes: () => ['exercicios', 'detalhe'],
  detalhe: (id) => ['exercicios', 'detalhe', normalizarId(id)],
};

/**
 * Lista paginada de exercícios. `filtros`: { fundamento, nivel, busca, pagina, porPagina }, todos opcionais.
 * `data` da consulta é { data: [exercícios], links, meta }. `opcoes` são opções extras do useQuery.
 */
export function useExercicios(filtros, opcoes = {}) {
  const normalizados = normalizarFiltros(filtros);
  return useQuery({
    ...opcoes,
    queryKey: chavesExercicios.lista(normalizados),
    queryFn: ({ signal }) => listarExercicios(normalizados, { signal }),
  });
}

/** Detalhe de um exercício. Sem id a consulta fica desligada. `data` da consulta é o exercício completo. */
export function useExercicio(id, opcoes = {}) {
  const idNormalizado = normalizarId(id);
  return useQuery({
    ...opcoes,
    queryKey: chavesExercicios.detalhe(idNormalizado),
    queryFn: ({ signal }) => obterExercicio(idNormalizado, { signal }),
    enabled: idNormalizado !== null && (opcoes.enabled ?? true),
  });
}
