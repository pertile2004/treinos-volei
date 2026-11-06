const BASE =
  'inline-flex min-h-8 items-center gap-1 rounded-full border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
// O contorno usa borda-controle: o token borda não chega a 3:1 sobre o fundo (WCAG 1.4.11).
const NAO_SELECIONADO =
  'border-borda-controle bg-superficie text-texto hover:border-texto focus-visible:outline-primaria';
// Sobre o fundo primaria o contorno de foco é texto.
const SELECIONADO = 'border-primaria bg-primaria font-bold text-sobre-primaria focus-visible:outline-texto';

/** Botão de filtro em formato de pílula. `aoAlternar` recebe o novo estado (true ou false). */
export default function ChipFiltro({ selecionado = false, aoAlternar, children, className = '', ...resto }) {
  return (
    <button
      type="button"
      {...resto}
      aria-pressed={selecionado}
      onClick={() => aoAlternar?.(!selecionado)}
      className={`${BASE} ${selecionado ? SELECIONADO : NAO_SELECIONADO} ${className}`.trim()}
    >
      {selecionado && (
        // Ícone de marcado: o estado não depende só da cor.
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8.5l3.5 3.5L13 5" />
        </svg>
      )}
      {children}
    </button>
  );
}
