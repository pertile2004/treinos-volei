// Reducer puro do formulário "Criar treino" (PR-12) e "Editar treino" (PR-14).
// O estado guarda os itens numa lista única, sempre agrupada na ordem das etapas
// e com `ordem` sequencial (1, 2, 3...) dentro de cada etapa.

export const ETAPAS = Object.freeze(['aquecimento', 'tecnica', 'especifico', 'volta_a_calma']);

export const MAXIMO_DE_ITENS = 30;

export const LIMITES = Object.freeze({
  series: Object.freeze({ minimo: 1, maximo: 10, opcional: false }),
  repeticoes: Object.freeze({ minimo: 1, maximo: 100, opcional: true }),
  duracao_segundos: Object.freeze({ minimo: 10, maximo: 3600, opcional: true }),
  descanso_segundos: Object.freeze({ minimo: 0, maximo: 600, opcional: false }),
});

// Usados só quando o exercício da biblioteca não traz o próprio padrão.
export const PADROES = Object.freeze({
  series: 3,
  repeticoes: 10,
  duracao_segundos: 30,
  descanso_segundos: 45,
});

const CAMPOS_DO_TREINO = ['nome', 'descricao', 'nivel', 'visibilidade'];
const MEDIDAS = ['repeticoes', 'duracao_segundos'];

export function estadoInicial() {
  return {
    nome: '',
    descricao: '',
    nivel: '',
    visibilidade: 'privado',
    itens: [],
    proximaChave: 1,
  };
}

export const acoes = Object.freeze({
  definirCampo: (campo, valor) => ({ tipo: 'definir_campo', campo, valor }),
  adicionarExercicio: (etapa, exercicio) => ({ tipo: 'adicionar_exercicio', etapa, exercicio }),
  removerItem: (chave) => ({ tipo: 'remover_item', chave }),
  subirItem: (chave) => ({ tipo: 'subir_item', chave }),
  descerItem: (chave) => ({ tipo: 'descer_item', chave }),
  ajustarItem: (chave, campo, valor) => ({ tipo: 'ajustar_item', chave, campo, valor }),
  definirMedida: (chave, medida) => ({ tipo: 'definir_medida', chave, medida }),
  carregar: (estado) => ({ tipo: 'carregar', estado }),
});

export function limitar(campo, valor) {
  const { minimo, maximo } = LIMITES[campo];
  return Math.min(maximo, Math.max(minimo, Math.round(valor)));
}

function vazio(valor) {
  return valor === null || valor === undefined || valor === '';
}

// Agrupa na ordem das etapas (mantendo a sequência atual dentro de cada uma)
// e recalcula `ordem`. Itens que já estão certos mantêm a mesma referência.
export function renumerarPorEtapa(itens) {
  return ETAPAS.flatMap((etapa) =>
    itens
      .filter((item) => item.etapa === etapa)
      .map((item, indice) => (item.ordem === indice + 1 ? item : { ...item, ordem: indice + 1 })),
  );
}

export function itensDaEtapa(estado, etapa) {
  return estado.itens.filter((item) => item.etapa === etapa);
}

export function podeAdicionar(estado) {
  return estado.itens.length < MAXIMO_DE_ITENS;
}

// Posição do vizinho da mesma etapa (-1 = anterior, +1 = seguinte) ou -1 se não houver.
function posicaoDoVizinho(itens, chave, passo) {
  const posicao = itens.findIndex((item) => item.chave === chave);
  const vizinho = posicao + passo;
  const existe = posicao !== -1 && vizinho >= 0 && vizinho < itens.length;
  return existe && itens[vizinho].etapa === itens[posicao].etapa ? vizinho : -1;
}

export function podeSubir(estado, chave) {
  return posicaoDoVizinho(estado.itens, chave, -1) !== -1;
}

export function podeDescer(estado, chave) {
  return posicaoDoVizinho(estado.itens, chave, 1) !== -1;
}

function definirCampo(estado, { campo, valor }) {
  return CAMPOS_DO_TREINO.includes(campo) ? { ...estado, [campo]: valor } : estado;
}

function padraoDoExercicio(exercicio) {
  const semMedida = vazio(exercicio.repeticoes_padrao) && vazio(exercicio.duracao_segundos_padrao);
  const repeticoes = semMedida ? PADROES.repeticoes : exercicio.repeticoes_padrao;
  const duracao = exercicio.duracao_segundos_padrao;
  return {
    series: limitar('series', exercicio.series_padrao ?? PADROES.series),
    repeticoes: vazio(repeticoes) ? null : limitar('repeticoes', repeticoes),
    duracao_segundos: vazio(duracao) ? null : limitar('duracao_segundos', duracao),
    descanso_segundos: limitar('descanso_segundos', exercicio.descanso_segundos ?? PADROES.descanso_segundos),
  };
}

function adicionarExercicio(estado, { etapa, exercicio }) {
  if (!ETAPAS.includes(etapa) || vazio(exercicio?.id) || !podeAdicionar(estado)) {
    return estado;
  }
  const item = {
    chave: estado.proximaChave,
    etapa,
    ordem: 0,
    exercicio: {
      id: exercicio.id,
      nome: exercicio.nome ?? '',
      fundamento: exercicio.fundamento ?? null,
      removido: false,
    },
    ...padraoDoExercicio(exercicio),
  };
  return {
    ...estado,
    itens: renumerarPorEtapa([...estado.itens, item]),
    proximaChave: estado.proximaChave + 1,
  };
}

function removerItem(estado, { chave }) {
  const restantes = estado.itens.filter((item) => item.chave !== chave);
  if (restantes.length === estado.itens.length) {
    return estado;
  }
  return { ...estado, itens: renumerarPorEtapa(restantes) };
}

function moverItem(estado, chave, passo) {
  const destino = posicaoDoVizinho(estado.itens, chave, passo);
  if (destino === -1) {
    return estado;
  }
  const origem = destino - passo;
  const itens = [...estado.itens];
  [itens[origem], itens[destino]] = [itens[destino], itens[origem]];
  return { ...estado, itens: renumerarPorEtapa(itens) };
}

function trocarItem(estado, chave, mudar) {
  const atual = estado.itens.find((item) => item.chave === chave);
  const novo = atual ? mudar(atual) : atual;
  if (novo === atual) {
    return estado;
  }
  return { ...estado, itens: estado.itens.map((item) => (item === atual ? novo : item)) };
}

function valorAjustado(campo, valor) {
  if (vazio(valor)) {
    return LIMITES[campo].opcional ? null : undefined;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? limitar(campo, numero) : undefined;
}

function ajustarItem(estado, { chave, campo, valor }) {
  if (!Object.hasOwn(LIMITES, campo)) {
    return estado;
  }
  const novoValor = valorAjustado(campo, valor);
  if (novoValor === undefined) {
    return estado;
  }
  return trocarItem(estado, chave, (item) => (item[campo] === novoValor ? item : { ...item, [campo]: novoValor }));
}

function definirMedida(estado, { chave, medida }) {
  if (!MEDIDAS.includes(medida)) {
    return estado;
  }
  const outra = MEDIDAS.find((nome) => nome !== medida);
  return trocarItem(estado, chave, (item) => ({
    ...item,
    [medida]: item[medida] ?? PADROES[medida],
    [outra]: null,
  }));
}

function carregar(estado, { estado: novo }) {
  if (!novo || !Array.isArray(novo.itens)) {
    return estado;
  }
  const maiorChave = novo.itens.reduce((maior, item) => Math.max(maior, item.chave ?? 0), 0);
  return {
    ...estadoInicial(),
    ...novo,
    itens: renumerarPorEtapa(novo.itens),
    proximaChave: Math.max(novo.proximaChave ?? 1, maiorChave + 1),
  };
}

export function montadorDeTreino(estado, acao) {
  switch (acao?.tipo) {
    case 'definir_campo':
      return definirCampo(estado, acao);
    case 'adicionar_exercicio':
      return adicionarExercicio(estado, acao);
    case 'remover_item':
      return removerItem(estado, acao);
    case 'subir_item':
      return moverItem(estado, acao.chave, -1);
    case 'descer_item':
      return moverItem(estado, acao.chave, 1);
    case 'ajustar_item':
      return ajustarItem(estado, acao);
    case 'definir_medida':
      return definirMedida(estado, acao);
    case 'carregar':
      return carregar(estado, acao);
    default:
      return estado;
  }
}
