// Textos curtos da tela de treino ativo derivados de um item do retrato do treino.

const plural = (quantidade, singular, pluralDaPalavra) =>
  `${quantidade} ${quantidade === 1 ? singular : pluralDaPalavra}`;

/** "2 séries × 10 repetições" ou "1 série × 30 s"; sem repetições nem duração, só as séries. */
export function descreverItem(item) {
  const series = plural(item.series, 'série', 'séries');
  if (item.repeticoes !== null && item.repeticoes !== undefined) {
    return `${series} × ${plural(item.repeticoes, 'repetição', 'repetições')}`;
  }
  if (item.duracao_segundos !== null && item.duracao_segundos !== undefined) {
    return `${series} × ${item.duracao_segundos} s`;
  }
  return series;
}

/** "descanso 45 s" ou "sem descanso". */
export function descreverDescanso(item) {
  return item.descanso_segundos > 0 ? `descanso ${item.descanso_segundos} s` : 'sem descanso';
}

export const SELO_REMOVIDO = 'removido da biblioteca';
