/** 90 → "1 min 30 s"; 60 → "1 min"; 45 → "45 s". Sem valor positivo devolve null. */
export function formatarDuracao(segundos) {
  const total = Number(segundos);
  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }
  const minutos = Math.floor(total / 60);
  const resto = Math.round(total % 60);
  if (minutos === 0) {
    return `${resto} s`;
  }
  return resto === 0 ? `${minutos} min` : `${minutos} min ${resto} s`;
}

/** Padrões de um exercício em uma linha: "3 × 15", "4 × 30 s" ou "3 séries". */
export function resumirPadroes({ series_padrao, repeticoes_padrao, duracao_segundos_padrao }) {
  const series = Number(series_padrao) || 0;
  if (repeticoes_padrao != null && repeticoes_padrao !== '') {
    return `${series} × ${repeticoes_padrao}`;
  }
  const duracao = formatarDuracao(duracao_segundos_padrao);
  if (duracao) {
    return `${series} × ${duracao}`;
  }
  return `${series} ${series === 1 ? 'série' : 'séries'}`;
}

/** Texto anunciado com o total da busca. */
export function resumirResultado(total) {
  if (!total) {
    return 'Nenhum exercício encontrado';
  }
  return total === 1 ? '1 exercício encontrado' : `${total} exercícios encontrados`;
}
