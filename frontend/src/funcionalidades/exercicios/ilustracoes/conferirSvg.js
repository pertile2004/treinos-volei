// Conferencia das ilustracoes por fundamento (PR-08).
// Regras: rascunho ilustracoes.md (viewBox 96, traco unico em currentColor, sem texto).

// Fundamento -> texto alternativo (o mesmo do <title> de cada arquivo).
export const ILUSTRACOES = {
  recepcao: 'Jogador fazendo manchete',
  levantamento: 'Jogador fazendo toque por cima',
  ataque: 'Jogador saltando para atacar a bola junto à rede',
  saque: 'Jogador lançando a bola para sacar por cima',
  bloqueio: 'Jogador saltando para bloquear a bola sobre a rede',
  defesa: 'Jogador em posição baixa defendendo uma bola rasteira',
  preparo_fisico: 'Pessoa fazendo agachamento com salto',
};

export const ELEMENTOS_PERMITIDOS = ['svg', 'title', 'g', 'circle', 'line', 'polyline', 'path', 'rect'];

const ATRIBUTOS_DA_RAIZ = [
  'viewBox="0 0 96 96"',
  'stroke="currentColor"',
  'fill="none"',
  'stroke-width="3"',
  'stroke-linecap="round"',
  'stroke-linejoin="round"',
];

const TAG = /<(\/?)([A-Za-z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
const COR = /(?:^|\s)(stroke|fill)\s*=\s*["']([^"']*)["']/g;
const CORES_LIVRES = ['currentColor', 'none'];

function listarTags(texto) {
  return Array.from(texto.matchAll(TAG), ([, fecha, nome, atributos, autoFecha]) => ({
    nome,
    atributos,
    fecha: fecha === '/',
    autoFecha: autoFecha === '/',
  }));
}

function conferirAninhamento(tags) {
  const pilha = [];
  for (const tag of tags) {
    if (tag.autoFecha) {
      continue;
    }
    if (!tag.fecha) {
      pilha.push(tag.nome);
      continue;
    }
    const aberta = pilha.pop();
    if (aberta !== tag.nome) {
      const esperado = aberta ? `</${aberta}>` : 'nenhum fechamento';
      return [`SVG mal formado: esperava ${esperado} e encontrou </${tag.nome}>.`];
    }
  }
  if (pilha.length > 0) {
    return [`SVG mal formado: faltou fechar <${pilha[pilha.length - 1]}>.`];
  }
  return [];
}

function conferirRaiz(tags) {
  const raiz = tags[0];
  if (!raiz || raiz.nome !== 'svg') {
    return [];
  }
  const problemas = ATRIBUTOS_DA_RAIZ.filter((atributo) => !raiz.atributos.includes(atributo)).map(
    (atributo) => `A tag svg precisa ter ${atributo}.`,
  );
  if (/(?:^|\s)(?:width|height)\s*=/.test(raiz.atributos)) {
    problemas.push('A tag svg não pode ter width nem height fixos; o tamanho vem do CSS.');
  }
  return problemas;
}

function conferirElementos(tags) {
  const proibidos = tags.filter((tag) => !tag.fecha && !ELEMENTOS_PERMITIDOS.includes(tag.nome)).map((tag) => tag.nome);
  return [...new Set(proibidos)].map((nome) => `Elemento não permitido: <${nome}>.`);
}

function conferirCores(tags) {
  const fixas = tags.flatMap((tag) =>
    Array.from(tag.atributos.matchAll(COR))
      .filter(([, , valor]) => !CORES_LIVRES.includes(valor))
      .map(([, atributo, valor]) => `${atributo}="${valor}"`),
  );
  return fixas.map((trecho) => `Nenhuma cor fixa é permitida: ${trecho}.`);
}

function conferirTitulo(texto) {
  const titulos = Array.from(texto.matchAll(/<title>([^<]*)<\/title>/g));
  if (titulos.length !== 1 || titulos[0][1].trim() === '') {
    return ['O SVG precisa ter exatamente um <title> preenchido.'];
  }
  return [];
}

// Devolve a lista de problemas em pt-BR; lista vazia quer dizer que esta tudo certo.
export function conferirSvg(conteudo) {
  const texto = typeof conteudo === 'string' ? conteudo.trim() : '';
  const tags = listarTags(texto);
  const problemas = [];
  if (!/^<svg[\s>]/.test(texto)) {
    problemas.push('O arquivo precisa começar com <svg.');
  }
  if (!texto.endsWith('</svg>')) {
    problemas.push('O arquivo precisa terminar com </svg>.');
  }
  return [
    ...problemas,
    ...conferirAninhamento(tags),
    ...conferirRaiz(tags),
    ...conferirElementos(tags),
    ...conferirCores(tags),
    ...conferirTitulo(texto),
  ];
}
