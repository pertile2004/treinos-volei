// Apoio compartilhado pelos testes do módulo treino-ativo (não é código de produção).
import { ACOES, criarEstadoInicial, reducerDoTreino } from './maquinaDoTreino.js';

export const T0 = Date.parse('2026-11-06T21:00:00.000Z');
export const seg = (segundos) => T0 + segundos * 1000;

export const treinoDeExemplo = () => ({
  id: 12,
  nome: 'Recepção básica',
  itens: [
    {
      exercicio_id: 5,
      nome: 'Manchete na parede',
      removido: false,
      etapa: 'tecnica',
      series: 2,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
    },
    {
      exercicio_id: 8,
      nome: 'Prancha',
      removido: true,
      etapa: 'fisico',
      series: 1,
      repeticoes: null,
      duracao_segundos: 30,
      descanso_segundos: 0,
    },
  ],
});

export function congelar(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    Object.values(valor).forEach(congelar);
  }
  return valor;
}

// Aplica as ações em sequência congelando cada estado: qualquer mutação quebra o teste.
export function aplicar(estado, ...acoes) {
  return acoes.reduce((atual, acao) => congelar(reducerDoTreino(atual, acao)), congelar(estado));
}

export function estadoIniciado(treino = treinoDeExemplo()) {
  return aplicar(criarEstadoInicial(treino), {
    tipo: ACOES.INICIAR,
    agora: T0,
    id_cliente: 'id-do-teste',
  });
}

// Percorre o treino de exemplo inteiro e para no resumo (185 s ativos).
export function estadoNoResumo() {
  return aplicar(
    estadoIniciado(),
    { tipo: ACOES.MAIS_ACERTO },
    { tipo: ACOES.MAIS_ACERTO },
    { tipo: ACOES.MAIS_ERRO },
    { tipo: ACOES.CONCLUIR_SERIE, agora: seg(95) },
    { tipo: ACOES.TIQUE, agora: seg(140) },
    { tipo: ACOES.MAIS_ACERTO },
    { tipo: ACOES.CONCLUIR_SERIE, agora: seg(200) },
    { tipo: ACOES.PULAR, agora: seg(205) },
    { tipo: ACOES.COMECAR_PROXIMO, agora: seg(210) },
    { tipo: ACOES.CONCLUIR_SERIE, agora: seg(240) },
  );
}

export function criarStorageFalso(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
    get tamanho() {
      return dados.size;
    },
  };
}
