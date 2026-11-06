import { http } from '../../lib/http.js';

function textoPreenchido(valor) {
  if (valor == null) return undefined;
  const texto = String(valor).trim();
  return texto === '' ? undefined : texto;
}

function inteiroPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : undefined;
}

/**
 * Deixa os filtros da lista em uma forma única: filtro vazio some, a busca perde os espaços das pontas
 * e a página vira inteiro (1 quando ausente ou inválida). Filtros equivalentes geram o mesmo objeto,
 * e por isso a mesma requisição e a mesma chave de consulta.
 */
export function normalizarFiltros(filtros) {
  const { fundamento, nivel, busca, pagina, porPagina } = filtros ?? {};
  const normalizados = {
    fundamento: textoPreenchido(fundamento),
    nivel: textoPreenchido(nivel),
    busca: textoPreenchido(busca),
    pagina: inteiroPositivo(pagina) ?? 1,
    porPagina: inteiroPositivo(porPagina),
  };
  return Object.fromEntries(Object.entries(normalizados).filter(([, valor]) => valor !== undefined));
}

/**
 * GET /exercicios. Filtros (todos opcionais): fundamento, nivel, busca, pagina e porPagina.
 * Devolve o corpo da lista paginada: { data: [exercícios resumidos], links, meta }.
 */
export async function listarExercicios(filtros, { signal } = {}) {
  const { pagina, porPagina, ...demais } = normalizarFiltros(filtros);
  const resposta = await http.get('/exercicios', {
    params: { ...demais, page: pagina, por_pagina: porPagina },
    signal,
  });
  return resposta.data;
}

/** GET /exercicios/{id}. Devolve o exercício completo, já sem o envelope `data`. */
export async function obterExercicio(id, { signal } = {}) {
  const resposta = await http.get(`/exercicios/${encodeURIComponent(id)}`, { signal });
  return resposta.data.data;
}
