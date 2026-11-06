import { Link } from 'react-router';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-botao border font-bold transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2';

// Passar o mouse muda a borda (ou o fundo, no fantasma): nenhuma cor fora dos tokens e nenhuma opacidade no texto.
// Sobre fundo primaria ou perigo o contorno de foco é texto; nos demais, primaria.
const VARIANTES = {
  primario: 'border-transparent bg-primaria text-sobre-primaria hover:border-texto focus-visible:outline-texto',
  secundario:
    'border-borda-controle bg-superficie-elevada text-texto hover:border-texto focus-visible:outline-primaria',
  fantasma: 'border-transparent bg-transparent text-primaria hover:bg-superficie focus-visible:outline-primaria',
  // Texto escuro: texto branco sobre perigo fica em 3,05:1 e reprova no AA.
  perigo: 'border-transparent bg-perigo text-sobre-primaria hover:border-texto focus-visible:outline-texto',
};

// md = 44 px (botões principais); sm = 32 px (acima do alvo mínimo de 24 px).
const TAMANHOS = {
  md: 'min-h-11 min-w-11 px-4 text-base',
  sm: 'min-h-8 min-w-8 px-3 text-sm',
};

/** Arco de três quartos que gira enquanto o botão está carregando. Decorativo. */
function IconeCarregando() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="size-5 shrink-0 animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

export default function Botao({
  variante = 'primario',
  tamanho = 'md',
  carregando = false,
  disabled = false,
  larguraTotal = false,
  icone,
  type = 'button',
  para,
  className = '',
  onClick,
  children,
  ...resto
}) {
  const inativo = disabled || carregando;

  const classes = [
    BASE,
    VARIANTES[variante] ?? VARIANTES.primario,
    TAMANHOS[tamanho] ?? TAMANHOS.md,
    larguraTotal && 'w-full',
    disabled && 'pointer-events-none opacity-50',
    carregando && 'cursor-progress',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  function aoClicar(evento) {
    if (inativo) {
      // Carregando continua focável (aria-disabled), então o clique e o envio do formulário são barrados aqui.
      evento.preventDefault();
      return;
    }
    onClick?.(evento);
  }

  const conteudo = (
    <>
      {carregando ? (
        <IconeCarregando />
      ) : (
        icone && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {icone}
          </span>
        )
      )}
      {children}
    </>
  );

  if (para !== undefined) {
    return (
      <Link
        to={para}
        className={classes}
        aria-busy={carregando || undefined}
        aria-disabled={inativo || undefined}
        onClick={aoClicar}
        {...resto}
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={carregando || undefined}
      aria-disabled={carregando || undefined}
      onClick={aoClicar}
      {...resto}
    >
      {conteudo}
    </button>
  );
}
