import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { somarDias } from '../../lib/datas.js';
import { useHoje } from '../../lib/useHoje.js';
import { atualizarAgendamento, criarAgendamento, listarAgendamentos, removerAgendamento } from './api.js';

// Limite do contrato de GET /agendamentos: intervalo de no máximo 31 dias.
const MAXIMO_DE_DIAS = 31;

/** Chaves de consulta da agenda. Para invalidar tudo: chavesAgendamentos.todas(). */
export const chavesAgendamentos = {
  todas: () => ['agendamentos'],
  listas: () => ['agendamentos', 'lista'],
  lista: ({ de, ate }) => ['agendamentos', 'lista', { de, ate }],
};

/** Lista os agendamentos do intervalo { de, ate } (datas locais AAAA-MM-DD). Sem os dois, fica desligado. */
export function useAgendamentos({ de, ate } = {}) {
  const completo = Boolean(de && ate);
  return useQuery({
    queryKey: chavesAgendamentos.lista({ de, ate }),
    queryFn: () => listarAgendamentos({ de, ate }),
    enabled: completo,
  });
}

/** Agendamentos de hoje (dia de São Paulo). Serve para a Agenda do dia no Início e para o lembrete. */
export function useAgendamentosDeHoje() {
  const hoje = useHoje();
  return useAgendamentos({ de: hoje, ate: hoje });
}

/** Agendamentos de hoje em diante: `dias` dias contando hoje (padrão 7, máximo 31). */
export function useProximosAgendamentos({ dias = 7 } = {}) {
  const hoje = useHoje();
  const quantidade = Math.min(Math.max(Math.trunc(dias) || 1, 1), MAXIMO_DE_DIAS);
  return useAgendamentos({ de: hoje, ate: somarDias(hoje, quantidade - 1) });
}

function useInvalidarAgendamentos() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: chavesAgendamentos.todas() });
}

/** Cria um agendamento ({ treino_id, data, hora }) e invalida todas as listas da agenda. */
export function useCriarAgendamento() {
  const invalidar = useInvalidarAgendamentos();
  return useMutation({ mutationFn: criarAgendamento, onSuccess: invalidar });
}

/** Atualiza data e hora ({ id, data, hora }) e invalida todas as listas da agenda. */
export function useAtualizarAgendamento() {
  const invalidar = useInvalidarAgendamentos();
  return useMutation({
    mutationFn: ({ id, data, hora }) => atualizarAgendamento(id, { data, hora }),
    onSuccess: invalidar,
  });
}

/** Remove um agendamento pelo id e invalida todas as listas da agenda. */
export function useRemoverAgendamento() {
  const invalidar = useInvalidarAgendamentos();
  return useMutation({ mutationFn: removerAgendamento, onSuccess: invalidar });
}
