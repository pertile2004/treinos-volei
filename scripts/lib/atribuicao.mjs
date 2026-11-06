// Regras únicas para detectar atribuição de IA em commits e PRs.
// Usadas por scripts/verificar-autoria.mjs (CI) e por scripts/git/commit-msg.mjs (hook).

const REGRAS_DE_LINHA = [
  {
    nome: 'linha Co-Authored-By citando Claude ou Anthropic',
    casa: (linha) => /^\s*co-authored-by\s*:/i.test(linha) && /claude|anthropic/i.test(linha),
  },
  {
    nome: 'marcador "Claude-Session"',
    casa: (linha) => /claude-session/i.test(linha),
  },
  {
    nome: '"Generated with" junto de "Claude"',
    casa: (linha) => /generated with/i.test(linha) && /claude/i.test(linha),
  },
  {
    nome: 'emoji de robô',
    casa: (linha) => linha.includes('\u{1F916}'),
  },
];

/** Devolve o nome da regra violada pela linha, ou null se a linha estiver limpa. */
export function regraDeAtribuicao(linha) {
  const regra = REGRAS_DE_LINHA.find((r) => r.casa(linha));
  return regra ? regra.nome : null;
}

/** Diz se um nome ou e-mail de autor ou de committer é de IA. */
export function identidadeDeIA(texto) {
  return /claude|anthropic/i.test(texto ?? '');
}
