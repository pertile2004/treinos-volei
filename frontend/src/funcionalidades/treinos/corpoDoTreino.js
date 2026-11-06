// Conversão entre o estado do montador e a API de treinos.
// estadoParaCorpo: corpo do POST /treinos (PR-12) e do PUT /treinos/{id} (PR-14).
// respostaParaEstado: resposta da API ({ data: treino } ou o treino) para a tela de edição.

import { renumerarPorEtapa } from './montadorDeTreino.js';

function itemDoCorpo(item) {
  return {
    exercicio_id: item.exercicio.id,
    etapa: item.etapa,
    ordem: item.ordem,
    series: item.series,
    repeticoes: item.repeticoes ?? null,
    duracao_segundos: item.duracao_segundos ?? null,
    descanso_segundos: item.descanso_segundos,
  };
}

// autor_id e duracao_estimada_minutos nunca saem do cliente: o servidor define.
export function estadoParaCorpo(estado) {
  const descricao = (estado.descricao ?? '').trim();
  return {
    nome: (estado.nome ?? '').trim(),
    descricao: descricao === '' ? null : descricao,
    nivel: estado.nivel,
    visibilidade: estado.visibilidade,
    itens: renumerarPorEtapa(estado.itens ?? []).map(itemDoCorpo),
  };
}

function itemDoEstado(item) {
  return {
    etapa: item.etapa,
    ordem: item.ordem,
    exercicio: {
      id: item.exercicio?.id ?? item.exercicio_id ?? null,
      nome: item.exercicio?.nome ?? '',
      fundamento: item.exercicio?.fundamento ?? null,
      removido: item.exercicio?.removido ?? false,
    },
    series: item.series,
    repeticoes: item.repeticoes ?? null,
    duracao_segundos: item.duracao_segundos ?? null,
    descanso_segundos: item.descanso_segundos,
  };
}

export function respostaParaEstado(resposta) {
  const treino = resposta?.data ?? resposta ?? {};
  const emOrdem = [...(treino.itens ?? [])].sort((a, b) => a.ordem - b.ordem).map(itemDoEstado);
  const itens = renumerarPorEtapa(emOrdem).map((item, indice) => ({ chave: indice + 1, ...item }));
  return {
    nome: treino.nome ?? '',
    descricao: treino.descricao ?? '',
    nivel: treino.nivel ?? '',
    visibilidade: treino.visibilidade ?? 'privado',
    itens,
    proximaChave: itens.length + 1,
  };
}
