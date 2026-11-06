import { useQuery } from '@tanstack/react-query';
import { buscarTreino, listarTreinos } from './api.js';

// O id chega como número (dos dados) ou como texto (da rota): 12 e '12' precisam cair na mesma chave.
function normalizarId(id) {
  if (id === undefined || id === null || id === '') return null;
  return /^\d+$/.test(String(id)) ? Number(id) : id;
}

/** Chaves de consulta dos treinos. Para invalidar tudo: chavesTreinos.todas(). */
export const chavesTreinos = {
  todas: () => ['treinos'],
  listas: () => ['treinos', 'lista'],
  lista: (filtros = {}) => ['treinos', 'lista', filtros],
  detalhes: () => ['treinos', 'detalhe'],
  detalhe: (id) => ['treinos', 'detalhe', normalizarId(id)],
};

/** Lista treinos com os filtros { escopo, page }. `data` da consulta é { data, links, meta }. */
export function useTreinos(filtros = {}) {
  return useQuery({
    queryKey: chavesTreinos.lista(filtros),
    queryFn: () => listarTreinos(filtros),
  });
}

/** Detalha um treino. Sem id a consulta fica desligada. `data` da consulta é o treino com `itens`. */
export function useTreino(id) {
  const idDoTreino = normalizarId(id);
  return useQuery({
    queryKey: chavesTreinos.detalhe(idDoTreino),
    queryFn: () => buscarTreino(idDoTreino),
    enabled: idDoTreino !== null,
  });
}
