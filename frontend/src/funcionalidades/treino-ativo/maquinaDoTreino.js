// Máquina de estados da tela de treino ativo (PR-16): reducer puro, sem efeitos.
// O relógio entra de fora, pela ação (campo `agora`); nada aqui lê Date.now() nem cria temporizador.
// O estado é o mesmo JSON gravado no localStorage (ver armazenamentoDoTreino.js).

export const VERSAO_DO_ESTADO = 1;

export const FASES = Object.freeze({
  PREPARACAO: 'preparacao',
  EXERCICIO: 'exercicio',
  DESCANSO: 'descanso',
  PROXIMO: 'proximo',
  RESUMO: 'resumo',
});

export const ACOES = Object.freeze({
  INICIAR: 'INICIAR',
  MAIS_ACERTO: 'MAIS_ACERTO',
  MAIS_ERRO: 'MAIS_ERRO',
  DESFAZER: 'DESFAZER',
  AJUSTAR_SERIES: 'AJUSTAR_SERIES',
  AJUSTAR_REPETICOES: 'AJUSTAR_REPETICOES',
  PAUSAR: 'PAUSAR',
  RETOMAR: 'RETOMAR',
  CONCLUIR_SERIE: 'CONCLUIR_SERIE',
  MAIS_15: 'MAIS_15',
  PULAR: 'PULAR',
  TIQUE: 'TIQUE',
  COMECAR_PROXIMO: 'COMECAR_PROXIMO',
  DEFINIR_OBSERVACAO: 'DEFINIR_OBSERVACAO',
  ALTERNAR_VIBRAR: 'ALTERNAR_VIBRAR',
  DEFINIR_ID_CLIENTE: 'DEFINIR_ID_CLIENTE',
  FINALIZAR: 'FINALIZAR',
});

export const LIMITES = Object.freeze({
  SERIES_MIN: 1,
  SERIES_MAX: 10,
  REPETICOES_MAX: 999,
  MARCACOES_MAX: 999,
  DURACAO_MAX_SEGUNDOS: 86400,
  DESCANSO_MAX_SEGUNDOS: 600,
  ACRESCIMO_DE_DESCANSO_SEGUNDOS: 15,
  OBSERVACAO_MAX: 1000,
});

const MARCACAO_ACERTO = 'acerto';
const MARCACAO_ERRO = 'erro';
const FIM_POR_CONTAGEM = 'contagem';
const FIM_POR_PULO = 'pulo';

// ---------- utilidades ----------

function paraMs(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.getTime();
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string') {
    const ms = Date.parse(valor);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

const paraIso = (ms) => new Date(ms).toISOString();

function inteiroEntre(valor, minimo, maximo, padrao) {
  if (valor === null || valor === undefined || valor === '' || typeof valor === 'boolean') {
    return padrao;
  }
  const numero = Math.trunc(Number(valor));
  if (!Number.isFinite(numero)) return padrao;
  return Math.min(maximo, Math.max(minimo, numero));
}

const ehObjeto = (valor) => typeof valor === 'object' && valor !== null && !Array.isArray(valor);
const ehContagem = (valor) => Number.isInteger(valor) && valor >= 0;
const ehDataOuNulo = (valor) => valor === null || valor === undefined || paraMs(valor) !== null;

const itemAtual = (estado) => estado.treino.itens[estado.indice_exercicio] ?? null;

function totalAtivoMs(estado, agoraMs) {
  const desde = paraMs(estado.ativo_desde);
  if (desde === null || agoraMs === null) return estado.ativo_acumulado_ms;
  return estado.ativo_acumulado_ms + Math.max(0, agoraMs - desde);
}

const relogioDe = (estado, agora) => paraMs(agora) ?? paraMs(estado.atualizado_em);

// ---------- estado inicial ----------

function normalizarItem(item) {
  const exercicio = ehObjeto(item.exercicio) ? item.exercicio : {};
  return {
    exercicio_id: item.exercicio_id ?? exercicio.id ?? null,
    nome: String(item.nome ?? exercicio.nome ?? ''),
    removido: Boolean(item.removido ?? exercicio.removido ?? false),
    etapa: item.etapa ?? null,
    series: inteiroEntre(item.series, LIMITES.SERIES_MIN, LIMITES.SERIES_MAX, LIMITES.SERIES_MIN),
    repeticoes: inteiroEntre(item.repeticoes, 0, LIMITES.REPETICOES_MAX, null),
    duracao_segundos: inteiroEntre(item.duracao_segundos, 0, LIMITES.DURACAO_MAX_SEGUNDOS, null),
    descanso_segundos: inteiroEntre(item.descanso_segundos, 0, LIMITES.DESCANSO_MAX_SEGUNDOS, 0),
  };
}

const serieEmBranco = (repeticoes) => ({ repeticoes, acertos: 0, erros: 0, desfazer: [] });

/**
 * @param {{ id: number, nome: string, itens: object[] }} treino Treino com itens na ordem de execução.
 */
export function criarEstadoInicial(treino) {
  const itens = (Array.isArray(treino?.itens) ? treino.itens : []).filter(ehObjeto).map(normalizarItem);
  return {
    versao: VERSAO_DO_ESTADO,
    id_cliente: null,
    treino_id: treino?.id ?? null,
    treino: { nome: String(treino?.nome ?? ''), itens },
    fase: FASES.PREPARACAO,
    indice_exercicio: 0,
    serie_atual: 1,
    iniciada_em: null,
    finalizada_em: null,
    ativo_acumulado_ms: 0,
    ativo_desde: null,
    ativo_no_inicio_da_serie_ms: 0,
    pausado: false,
    descanso_termina_em: null,
    descanso_encerrado_por: null,
    atual: serieEmBranco(itens[0]?.repeticoes ?? null),
    series_feitas: [],
    observacao: '',
    vibrar: false,
    atualizado_em: null,
  };
}

/** Cria a ação INICIAR chamando o gerador de id uma única vez (ex.: () => crypto.randomUUID()). */
export function criarAcaoIniciar({ agora, gerarId }) {
  return { tipo: ACOES.INICIAR, agora, id_cliente: gerarId() };
}

// ---------- transições ----------

function iniciarSerie(estado, agoraMs, indice, numero) {
  const continuaNoMesmoExercicio = indice === estado.indice_exercicio && numero > 1;
  const repeticoes = continuaNoMesmoExercicio ? estado.atual.repeticoes : estado.treino.itens[indice].repeticoes;
  return {
    ...estado,
    fase: FASES.EXERCICIO,
    indice_exercicio: indice,
    serie_atual: numero,
    pausado: false,
    ativo_desde: paraIso(agoraMs),
    ativo_no_inicio_da_serie_ms: estado.ativo_acumulado_ms,
    descanso_termina_em: null,
    atual: serieEmBranco(repeticoes),
  };
}

function encerrarDescanso(estado, agoraMs, motivo) {
  const base = { ...estado, descanso_termina_em: null, descanso_encerrado_por: motivo };
  if (estado.serie_atual < itemAtual(estado).series) {
    return iniciarSerie(base, agoraMs, estado.indice_exercicio, estado.serie_atual + 1);
  }
  return { ...base, fase: FASES.PROXIMO };
}

function iniciar(estado, acao, agoraMs) {
  if (estado.fase !== FASES.PREPARACAO || agoraMs === null) return estado;
  if (estado.treino.itens.length === 0) return estado;
  const idDaAcao = typeof acao.id_cliente === 'string' && acao.id_cliente !== '' ? acao.id_cliente : null;
  const base = {
    ...estado,
    id_cliente: estado.id_cliente ?? idDaAcao,
    iniciada_em: paraIso(agoraMs),
    finalizada_em: null,
    ativo_acumulado_ms: 0,
    series_feitas: [],
  };
  return iniciarSerie(base, agoraMs, 0, 1);
}

const marcar = (campo, marcacao) => (estado) => {
  if (estado.fase !== FASES.EXERCICIO) return estado;
  if (estado.atual[campo] >= LIMITES.MARCACOES_MAX) return estado;
  return {
    ...estado,
    atual: {
      ...estado.atual,
      [campo]: estado.atual[campo] + 1,
      desfazer: [...estado.atual.desfazer, marcacao],
    },
  };
};

function desfazer(estado) {
  if (estado.fase !== FASES.EXERCICIO || estado.atual.desfazer.length === 0) return estado;
  const pilha = estado.atual.desfazer.slice(0, -1);
  const campo = estado.atual.desfazer.at(-1) === MARCACAO_ACERTO ? 'acertos' : 'erros';
  return {
    ...estado,
    atual: { ...estado.atual, [campo]: Math.max(0, estado.atual[campo] - 1), desfazer: pilha },
  };
}

function ajustarSeries(estado, acao) {
  if (estado.fase !== FASES.EXERCICIO) return estado;
  const minimo = Math.max(LIMITES.SERIES_MIN, estado.serie_atual);
  const series = inteiroEntre(acao.valor, minimo, Math.max(minimo, LIMITES.SERIES_MAX), null);
  if (series === null || series === itemAtual(estado).series) return estado;
  const itens = estado.treino.itens.map((item, indice) =>
    indice === estado.indice_exercicio ? { ...item, series } : item,
  );
  return { ...estado, treino: { ...estado.treino, itens } };
}

function ajustarRepeticoes(estado, acao) {
  if (estado.fase !== FASES.EXERCICIO) return estado;
  const repeticoes = inteiroEntre(acao.valor, 0, LIMITES.REPETICOES_MAX, null);
  if (repeticoes === null || repeticoes === estado.atual.repeticoes) return estado;
  return { ...estado, atual: { ...estado.atual, repeticoes } };
}

function pausar(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.EXERCICIO || estado.pausado || agoraMs === null) return estado;
  return {
    ...estado,
    pausado: true,
    ativo_acumulado_ms: totalAtivoMs(estado, agoraMs),
    ativo_desde: null,
  };
}

function retomar(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.EXERCICIO || !estado.pausado || agoraMs === null) return estado;
  return { ...estado, pausado: false, ativo_desde: paraIso(agoraMs) };
}

function concluirSerie(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.EXERCICIO || agoraMs === null) return estado;
  const item = itemAtual(estado);
  const ativoMs = totalAtivoMs(estado, agoraMs);
  const duracao = Math.round((ativoMs - estado.ativo_no_inicio_da_serie_ms) / 1000);
  const feita = {
    exercicio_id: item.exercicio_id,
    numero: estado.serie_atual,
    repeticoes: estado.atual.repeticoes,
    acertos: estado.atual.acertos,
    erros: estado.atual.erros,
    duracao_segundos: Math.min(LIMITES.DURACAO_MAX_SEGUNDOS, Math.max(0, duracao)),
  };
  const base = {
    ...estado,
    pausado: false,
    ativo_acumulado_ms: ativoMs,
    ativo_desde: null,
    descanso_termina_em: null,
    descanso_encerrado_por: null,
    series_feitas: [...estado.series_feitas, feita],
    atual: serieEmBranco(estado.atual.repeticoes),
  };
  const eraAUltimaSerie = estado.serie_atual >= item.series;
  const eraOUltimoExercicio = estado.indice_exercicio >= estado.treino.itens.length - 1;
  if (eraAUltimaSerie && eraOUltimoExercicio) return { ...base, fase: FASES.RESUMO };
  if (item.descanso_segundos <= 0) return encerrarDescanso(base, agoraMs, null);
  return {
    ...base,
    fase: FASES.DESCANSO,
    descanso_termina_em: paraIso(agoraMs + item.descanso_segundos * 1000),
  };
}

function mais15(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.DESCANSO || agoraMs === null) return estado;
  const fimAtual = paraMs(estado.descanso_termina_em) ?? agoraMs;
  const teto = agoraMs + LIMITES.DESCANSO_MAX_SEGUNDOS * 1000;
  const novoFim = Math.min(teto, Math.max(fimAtual, agoraMs) + LIMITES.ACRESCIMO_DE_DESCANSO_SEGUNDOS * 1000);
  if (novoFim <= fimAtual) return estado;
  return { ...estado, descanso_termina_em: paraIso(novoFim) };
}

function pular(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.DESCANSO || agoraMs === null) return estado;
  return encerrarDescanso(estado, agoraMs, FIM_POR_PULO);
}

function tique(estado, _acao, agoraMs) {
  if (agoraMs === null) return estado;
  const fim = paraMs(estado.descanso_termina_em);
  if (estado.fase === FASES.DESCANSO && (fim === null || agoraMs >= fim)) {
    return encerrarDescanso(estado, agoraMs, FIM_POR_CONTAGEM);
  }
  return { ...estado };
}

function comecarProximo(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.PROXIMO || agoraMs === null) return estado;
  const indice = estado.indice_exercicio + 1;
  if (indice >= estado.treino.itens.length) return estado;
  return iniciarSerie(estado, agoraMs, indice, 1);
}

function definirObservacao(estado, acao) {
  if (estado.fase !== FASES.RESUMO) return estado;
  const observacao = String(acao.valor ?? '').slice(0, LIMITES.OBSERVACAO_MAX);
  return observacao === estado.observacao ? estado : { ...estado, observacao };
}

function alternarVibrar(estado, acao) {
  const vibrar = acao.valor === undefined ? !estado.vibrar : Boolean(acao.valor);
  return vibrar === estado.vibrar ? estado : { ...estado, vibrar };
}

function definirIdCliente(estado, acao) {
  if (estado.id_cliente) return estado;
  if (typeof acao.id_cliente !== 'string' || acao.id_cliente === '') return estado;
  return { ...estado, id_cliente: acao.id_cliente };
}

function finalizar(estado, _acao, agoraMs) {
  if (estado.fase !== FASES.RESUMO || agoraMs === null || estado.finalizada_em) return estado;
  const inicio = paraMs(estado.iniciada_em) ?? agoraMs;
  return { ...estado, finalizada_em: paraIso(Math.max(inicio, agoraMs)) };
}

const TRATADORES = {
  [ACOES.INICIAR]: iniciar,
  [ACOES.MAIS_ACERTO]: marcar('acertos', MARCACAO_ACERTO),
  [ACOES.MAIS_ERRO]: marcar('erros', MARCACAO_ERRO),
  [ACOES.DESFAZER]: desfazer,
  [ACOES.AJUSTAR_SERIES]: ajustarSeries,
  [ACOES.AJUSTAR_REPETICOES]: ajustarRepeticoes,
  [ACOES.PAUSAR]: pausar,
  [ACOES.RETOMAR]: retomar,
  [ACOES.CONCLUIR_SERIE]: concluirSerie,
  [ACOES.MAIS_15]: mais15,
  [ACOES.PULAR]: pular,
  [ACOES.TIQUE]: tique,
  [ACOES.COMECAR_PROXIMO]: comecarProximo,
  [ACOES.DEFINIR_OBSERVACAO]: definirObservacao,
  [ACOES.ALTERNAR_VIBRAR]: alternarVibrar,
  [ACOES.DEFINIR_ID_CLIENTE]: definirIdCliente,
  [ACOES.FINALIZAR]: finalizar,
};

// Instante da ação: o `agora` recebido; sem ele, o último instante conhecido
// (o TIQUE sem `agora` soma 1 segundo a esse instante).
function lerAgora(estado, acao) {
  const informado = paraMs(acao.agora);
  if (informado !== null) return informado;
  const conhecido = paraMs(estado.atualizado_em);
  if (conhecido === null) return null;
  return acao.tipo === ACOES.TIQUE ? conhecido + 1000 : conhecido;
}

/**
 * Reducer da tela de treino ativo.
 * Ação: { tipo, agora?, valor?, id_cliente? }. `agora` aceita milissegundos, Date ou texto ISO.
 * Ação desconhecida, inválida ou fora da fase devolve o mesmo objeto de estado.
 */
export function reducerDoTreino(estado, acao) {
  const tratador = ehObjeto(acao) && Object.hasOwn(TRATADORES, acao.tipo) ? TRATADORES[acao.tipo] : null;
  if (!tratador) return estado;
  const agoraMs = lerAgora(estado, acao);
  const proximo = tratador(estado, acao, agoraMs);
  if (proximo === estado || agoraMs === null) return proximo;
  return { ...proximo, atualizado_em: paraIso(agoraMs) };
}

/** Verdadeiro quando a contagem do descanso chegou ao fim nesta transição e a vibração está ligada. */
export function deveVibrar(anterior, atual) {
  return (
    anterior?.fase === FASES.DESCANSO &&
    atual?.fase !== FASES.DESCANSO &&
    atual?.descanso_encerrado_por === FIM_POR_CONTAGEM &&
    atual?.vibrar === true
  );
}

// ---------- seletores ----------

export const selecionarExercicioAtual = (estado) => itemAtual(estado);

export const selecionarProximoExercicio = (estado) => estado.treino.itens[estado.indice_exercicio + 1] ?? null;

export function selecionarProgresso(estado) {
  const { itens } = estado.treino;
  const seriesTotais = itens.reduce((soma, item) => soma + item.series, 0);
  const seriesFeitas = estado.series_feitas.length;
  const parcial = seriesTotais === 0 ? 0 : Math.min(1, seriesFeitas / seriesTotais);
  const fracao = estado.fase === FASES.RESUMO ? 1 : parcial;
  return {
    exercicio: itens.length === 0 ? 0 : estado.indice_exercicio + 1,
    totalDeExercicios: itens.length,
    serie: estado.serie_atual,
    totalDeSeries: itemAtual(estado)?.series ?? 0,
    seriesFeitas,
    seriesTotais,
    fracao,
    percentual: Math.round(fracao * 100),
  };
}

export function selecionarRotuloDoExercicio(estado) {
  const { exercicio, totalDeExercicios } = selecionarProgresso(estado);
  return `Exercício ${exercicio} de ${totalDeExercicios}`;
}

export function selecionarRotuloDaSerie(estado) {
  const { serie, totalDeSeries } = selecionarProgresso(estado);
  return `Série ${serie} de ${totalDeSeries}`;
}

/** Segundos que faltam no descanso (arredondado para cima); 0 fora do descanso. */
export function selecionarSegundosDeDescanso(estado, agora) {
  const fim = paraMs(estado.descanso_termina_em);
  const agoraMs = relogioDe(estado, agora);
  if (estado.fase !== FASES.DESCANSO || fim === null || agoraMs === null) return 0;
  return Math.max(0, Math.ceil((fim - agoraMs) / 1000));
}

/** Segundos de tempo ativo do treino inteiro (sem descanso e sem pausa). */
export const selecionarSegundosAtivos = (estado, agora) =>
  Math.floor(totalAtivoMs(estado, relogioDe(estado, agora)) / 1000);

/** Segundos de tempo ativo da série em andamento. */
export function selecionarSegundosDaSerie(estado, agora) {
  if (estado.fase !== FASES.EXERCICIO) return 0;
  const ativoMs = totalAtivoMs(estado, relogioDe(estado, agora));
  return Math.max(0, Math.floor((ativoMs - estado.ativo_no_inicio_da_serie_ms) / 1000));
}

export const selecionarPodeDesfazer = (estado) => estado.fase === FASES.EXERCICIO && estado.atual.desfazer.length > 0;

/** Totais do resumo: duração ativa, acertos, erros e uma linha por exercício executado. */
export function selecionarResumo(estado) {
  const porExercicio = new Map();
  for (const serie of estado.series_feitas) {
    const item = estado.treino.itens.find((i) => i.exercicio_id === serie.exercicio_id);
    const linha = porExercicio.get(serie.exercicio_id) ?? {
      exercicio_id: serie.exercicio_id,
      nome: item?.nome ?? '',
      removido: item?.removido ?? false,
      series: 0,
      acertos: 0,
      erros: 0,
    };
    porExercicio.set(serie.exercicio_id, {
      ...linha,
      series: linha.series + 1,
      acertos: linha.acertos + serie.acertos,
      erros: linha.erros + serie.erros,
    });
  }
  const exercicios = [...porExercicio.values()];
  return {
    duracao_segundos: selecionarSegundosAtivos(estado),
    acertos: exercicios.reduce((soma, linha) => soma + linha.acertos, 0),
    erros: exercicios.reduce((soma, linha) => soma + linha.erros, 0),
    exercicios,
  };
}

// ---------- validação (usada ao restaurar do armazenamento) ----------

const itemEhValido = (item) =>
  ehObjeto(item) &&
  Number.isInteger(item.series) &&
  item.series >= LIMITES.SERIES_MIN &&
  ehContagem(item.descanso_segundos) &&
  (item.repeticoes === null || ehContagem(item.repeticoes));

const serieFeitaEhValida = (serie) =>
  ehObjeto(serie) &&
  Number.isInteger(serie.numero) &&
  serie.numero >= 1 &&
  ehContagem(serie.acertos) &&
  ehContagem(serie.erros);

const atualEhValido = (atual) =>
  ehObjeto(atual) &&
  ehContagem(atual.acertos) &&
  ehContagem(atual.erros) &&
  Array.isArray(atual.desfazer) &&
  (atual.repeticoes === null || ehContagem(atual.repeticoes));

function datasSaoValidas(dado) {
  const campos = ['iniciada_em', 'finalizada_em', 'ativo_desde', 'descanso_termina_em', 'atualizado_em'];
  if (!campos.every((campo) => ehDataOuNulo(dado[campo]))) return false;
  if (dado.fase === FASES.PREPARACAO) return true;
  if (paraMs(dado.iniciada_em) === null || paraMs(dado.atualizado_em) === null) return false;
  return dado.fase !== FASES.DESCANSO || paraMs(dado.descanso_termina_em) !== null;
}

/** Confere se um dado lido de fora tem o formato desta versão do estado (o reducer não quebra com ele). */
export function estadoEhValido(dado) {
  if (!ehObjeto(dado) || dado.versao !== VERSAO_DO_ESTADO) return false;
  if (!Object.values(FASES).includes(dado.fase)) return false;
  if (!ehObjeto(dado.treino) || !Array.isArray(dado.treino.itens)) return false;
  const { itens } = dado.treino;
  if (itens.length === 0 || !itens.every(itemEhValido)) return false;
  if (!Number.isInteger(dado.indice_exercicio)) return false;
  if (dado.indice_exercicio < 0 || dado.indice_exercicio >= itens.length) return false;
  if (!Number.isInteger(dado.serie_atual) || dado.serie_atual < 1) return false;
  if (!atualEhValido(dado.atual)) return false;
  if (!Array.isArray(dado.series_feitas) || !dado.series_feitas.every(serieFeitaEhValida)) return false;
  if (!Number.isFinite(dado.ativo_acumulado_ms) || dado.ativo_acumulado_ms < 0) return false;
  if (!Number.isFinite(dado.ativo_no_inicio_da_serie_ms)) return false;
  return datasSaoValidas(dado);
}
