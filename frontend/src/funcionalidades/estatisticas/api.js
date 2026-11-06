import { http } from '../../lib/http.js';

/** Períodos de GET /estatisticas, na ordem das abas da tela Evolução. `id` é o valor enviado em `periodo`. */
export const PERIODOS = [
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: '3meses', rotulo: '3 Meses' },
  { id: 'ano', rotulo: 'Ano' },
];

export function ehPeriodoValido(periodo) {
  return PERIODOS.some((item) => item.id === periodo);
}

/**
 * GET /estatisticas?periodo=semana|mes|3meses|ano. Devolve o conteúdo de `data`:
 * { periodo, fuso, inicio, fim, volume: { granularidade, total_minutos, pontos }, desempenho: [...], frequencia }.
 * Período inválido é erro de programação (a tela só oferece os quatro), por isso lança TypeError sem chamar a API.
 */
export async function obterEstatisticas(periodo, { signal } = {}) {
  if (!ehPeriodoValido(periodo)) {
    throw new TypeError('Período inválido: use semana, mes, 3meses ou ano.');
  }
  const resposta = await http.get('/estatisticas', { params: { periodo }, signal });
  return resposta.data.data;
}

/** Verdadeiro quando o período não tem nenhuma sessão: sem minutos em nenhum balde e sem tentativas em nenhum fundamento. */
export function ehPeriodoVazio(estatisticas) {
  const pontos = estatisticas?.volume?.pontos ?? [];
  const desempenho = estatisticas?.desempenho ?? [];
  return (
    (estatisticas?.volume?.total_minutos ?? 0) === 0 &&
    pontos.every((ponto) => ponto.minutos === 0) &&
    desempenho.every((item) => (item.tentativas ?? item.acertos + item.erros) === 0)
  );
}
