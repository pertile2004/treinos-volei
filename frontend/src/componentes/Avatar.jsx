const TAMANHOS = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-xl',
};

function primeiraLetra(palavra) {
  return Array.from(palavra)[0].toLocaleUpperCase('pt-BR');
}

function iniciaisDe(palavras) {
  if (palavras.length === 0) return '?';
  if (palavras.length === 1) return primeiraLetra(palavras[0]);
  return primeiraLetra(palavras[0]) + primeiraLetra(palavras.at(-1));
}

/**
 * Círculo com as iniciais do nome. Sozinho, é uma imagem com o nome como texto alternativo;
 * com `decorativo` (nome já escrito ao lado), sai da árvore de acessibilidade.
 */
export default function Avatar({ nome = '', tamanho = 'md', decorativo = false, className = '', ...resto }) {
  const palavras = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const acessibilidade = decorativo
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': palavras.join(' ') || 'Sem nome' };

  return (
    <span
      {...resto}
      {...acessibilidade}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-borda bg-superficie-elevada font-bold text-texto select-none ${Object.hasOwn(TAMANHOS, tamanho) ? TAMANHOS[tamanho] : TAMANHOS.md} ${className}`.trim()}
    >
      {iniciaisDe(palavras)}
    </span>
  );
}
