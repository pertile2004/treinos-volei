import { useQuery } from '@tanstack/react-query';
import { ehPeriodoValido, obterEstatisticas } from './api.js';

/** Chaves de consulta do módulo. Depois de salvar uma sessão: queryClient.invalidateQueries({ queryKey: chavesEstatisticas.todas() }). */
export const chavesEstatisticas = {
  todas: () => ['estatisticas'],
  periodo: (periodo) => ['estatisticas', periodo],
};

/**
 * Estatísticas do usuário logado para um período (semana, mes, 3meses ou ano).
 * `data` da consulta é o conteúdo de `data` da API. Período inválido deixa a consulta desligada.
 */
export function useEstatisticas(periodo, opcoes = {}) {
  return useQuery({
    ...opcoes,
    queryKey: chavesEstatisticas.periodo(periodo),
    queryFn: ({ signal }) => obterEstatisticas(periodo, { signal }),
    enabled: ehPeriodoValido(periodo) && (opcoes.enabled ?? true),
  });
}
