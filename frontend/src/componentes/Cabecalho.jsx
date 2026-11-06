import { Link } from 'react-router';

const classesDoVoltar =
  'flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-botao text-texto hover:bg-superficie-elevada';

function IconeVoltar() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/**
 * Cabeçalho da página: título (h1), subtítulo, voltar opcional e área de ações.
 * Voltar: `voltarPara` (rota; vira link, precisa do roteador) ou `aoVoltar` (função; vira botão).
 * `nivelDoTitulo` existe para o catálogo e para usos fora do topo da página; o padrão é o h1 único.
 */
export default function Cabecalho({
  titulo,
  subtitulo,
  voltarPara,
  aoVoltar,
  acoes,
  nivelDoTitulo = 1,
  className = '',
  ...resto
}) {
  const Titulo = `h${nivelDoTitulo}`;

  let voltar = null;
  if (voltarPara) {
    voltar = (
      <Link to={voltarPara} aria-label="Voltar" className={classesDoVoltar}>
        <IconeVoltar />
      </Link>
    );
  } else if (aoVoltar) {
    voltar = (
      <button type="button" aria-label="Voltar" onClick={aoVoltar} className={classesDoVoltar}>
        <IconeVoltar />
      </button>
    );
  }

  return (
    <header className={`flex items-center gap-3 px-4 py-3 ${className}`} {...resto}>
      {voltar}
      <div className="min-w-0 flex-1">
        <Titulo className="text-2xl font-bold break-words">{titulo}</Titulo>
        {subtitulo && <p className="text-sm text-texto-secundario">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
    </header>
  );
}
