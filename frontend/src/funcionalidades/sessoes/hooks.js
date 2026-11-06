import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarSessao, registrarSessao } from './api.js';

// O id chega como número (dos dados) ou como texto (da rota): 40 e '40' precisam cair na mesma chave.
function normalizarId(id) {
  if (id === undefined || id === null || id === '') return null;
  return /^\d+$/.test(String(id)) ? Number(id) : id;
}

/** Chaves de consulta das sessões. Para invalidar tudo: chavesSessoes.todas(). */
export const chavesSessoes = {
  todas: () => ['sessoes'],
  listas: () => ['sessoes', 'lista'],
  lista: (filtros = {}) => ['sessoes', 'lista', filtros],
  detalhes: () => ['sessoes', 'detalhe'],
  detalhe: (id) => ['sessoes', 'detalhe', normalizarId(id)],
};

/** Detalha uma sessão. Sem id a consulta fica desligada. `data` da consulta é a sessão com `series`. */
export function useSessao(id) {
  const idDaSessao = normalizarId(id);
  return useQuery({
    queryKey: chavesSessoes.detalhe(idDaSessao),
    queryFn: () => buscarSessao(idDaSessao),
    enabled: idDaSessao !== null,
  });
}

/**
 * Salva uma sessão (POST /sessoes). `mutate(corpo)` recebe o corpo do contrato; no sucesso a sessão entra no
 * cache do detalhe e as listas (histórico, PR-18) são invalidadas.
 */
export function useRegistrarSessao() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: registrarSessao,
    onSuccess: (sessao) => {
      cliente.setQueryData(chavesSessoes.detalhe(sessao.id), sessao);
      return cliente.invalidateQueries({ queryKey: chavesSessoes.listas() });
    },
  });
}
