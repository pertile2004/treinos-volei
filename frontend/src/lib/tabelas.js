// Linhas das tabelas equivalentes aos gráficos da tela Evolução.
// Entrada: o conteúdo de "data" da resposta de GET /api/v1/estatisticas (rascunho do PR-19).

import { NOMES_DOS_DIAS, indiceNaSemana, somarDias } from './datas.js';
import { SEM_DADOS, formatarPercentual, formatarPercentualDeAcerto } from './formatos.js';

const NOMES_DOS_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function diaEMes(data) {
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
}

const ROTULOS_POR_GRANULARIDADE = {
  dia: (inicio) => `${NOMES_DOS_DIAS[indiceNaSemana(inicio)]}, ${diaEMes(inicio)}`,
  semana: (inicio) => `${diaEMes(inicio)} a ${diaEMes(somarDias(inicio, 6))}`,
  mes: (inicio) => {
    somarDias(inicio, 0); // valida a data
    const [ano, mes] = inicio.split('-');
    return `${NOMES_DOS_MESES[Number(mes) - 1]} de ${ano}`;
  },
};

/**
 * Texto da coluna "Período" para um ponto do volume.
 * inicio: data local AAAA-MM-DD (primeiro dia do balde); granularidade: 'dia' | 'semana' | 'mes'.
 */
export function rotuloDoPeriodo(inicio, granularidade) {
  const rotular = Object.hasOwn(ROTULOS_POR_GRANULARIDADE, granularidade) && ROTULOS_POR_GRANULARIDADE[granularidade];
  if (!rotular) {
    throw new TypeError('Granularidade inválida: use dia, semana ou mes.');
  }
  return rotular(inicio);
}

/** Tabela de volume (colunas Período e Minutos): uma linha por ponto, na ordem do servidor. */
export function linhasDeVolume(estatisticas) {
  const volume = estatisticas?.volume;
  return (volume?.pontos ?? []).map((ponto) => ({
    chave: ponto.inicio,
    periodo: rotuloDoPeriodo(ponto.inicio, volume.granularidade),
    minutos: ponto.minutos,
  }));
}

function percentualDaLinha(item) {
  const tentativas = (item.acertos ?? 0) + (item.erros ?? 0);
  if (tentativas === 0) return SEM_DADOS;
  return typeof item.percentual === 'number'
    ? formatarPercentual(item.percentual)
    : formatarPercentualDeAcerto(item.acertos, item.erros);
}

/**
 * Tabela de desempenho (colunas Fundamento, Acertos, Erros e % de acerto), na ordem do servidor.
 * rotulos: mapa código → nome do fundamento (de GET /referencias), ex.: { saque: 'Saque' }.
 */
export function linhasDeDesempenho(estatisticas, rotulos = {}) {
  return (estatisticas?.desempenho ?? []).map((item) => ({
    chave: item.fundamento,
    fundamento: rotulos?.[item.fundamento] ?? item.fundamento,
    acertos: item.acertos,
    erros: item.erros,
    percentual: percentualDaLinha(item),
  }));
}
