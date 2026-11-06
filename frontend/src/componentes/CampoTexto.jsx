import { useId, useState } from 'react';

const CAMPO =
  'min-h-11 w-full rounded-botao border bg-superficie px-3 text-base text-texto placeholder:text-texto-secundario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria disabled:cursor-not-allowed disabled:opacity-50';

const TRACO = {
  'aria-hidden': 'true',
  focusable: 'false',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Olho aberto; com `cortado`, olho riscado. Decorativo: o botão que o usa tem aria-label. */
function IconeOlho({ cortado }) {
  return (
    <svg {...TRACO} className="size-5">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {cortado && <path d="M4 4l16 16" />}
    </svg>
  );
}

/** Círculo com exclamação. Decorativo: o texto ao lado carrega a mensagem de erro. */
function IconeAlerta() {
  return (
    <svg {...TRACO} className="size-4 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

/**
 * Campo de texto com rótulo visível, ajuda e erro. As props que não são do componente (ref, onChange, onBlur,
 * autoComplete…) vão para o <input>, então `{...register('campo')}` do React Hook Form funciona direto.
 */
export default function CampoTexto({
  rotulo,
  nome,
  tipo = 'text',
  erro,
  ajuda,
  obrigatorio = false,
  disabled = false,
  id: idInformado,
  className = '',
  'aria-describedby': descritoPor,
  ...resto
}) {
  const idGerado = useId();
  const id = idInformado ?? idGerado;
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const ehSenha = tipo === 'password';
  const descricoes = [descritoPor, ajuda && idAjuda, erro && idErro].filter(Boolean).join(' ');

  // O contorno comum usa borda-controle (3:1 ou mais): a cor "borda" não serve de único contorno de um campo.
  const classesDoCampo = [CAMPO, erro ? 'border-perigo' : 'border-borda-controle', ehSenha && 'pr-12']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex flex-col gap-1 ${className}`.trim()}>
      <div className="flex items-baseline gap-2">
        <label htmlFor={id} className="text-sm font-bold text-texto">
          {rotulo}
        </label>
        {obrigatorio && (
          <span aria-hidden="true" className="text-xs text-texto-secundario">
            (obrigatório)
          </span>
        )}
      </div>

      <div className="relative">
        <input
          name={nome}
          {...resto}
          id={id}
          type={ehSenha && senhaVisivel ? 'text' : tipo}
          disabled={disabled}
          required={obrigatorio || undefined}
          aria-invalid={erro ? 'true' : undefined}
          aria-describedby={descricoes || undefined}
          className={classesDoCampo}
        />
        {ehSenha && (
          <button
            type="button"
            aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={senhaVisivel}
            aria-controls={id}
            disabled={disabled}
            onClick={() => setSenhaVisivel((visivel) => !visivel)}
            className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center rounded-botao text-texto-secundario hover:text-texto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primaria disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconeOlho cortado={senhaVisivel} />
          </button>
        )}
      </div>

      {ajuda && (
        <p id={idAjuda} className="text-sm text-texto-secundario">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className="flex items-center gap-1 text-sm text-perigo">
          <IconeAlerta />
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}
