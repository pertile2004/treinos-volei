import { useId } from 'react';

const CAMPO =
  'min-h-11 w-full rounded-botao border bg-superficie px-3 text-base text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Campo de seleção com rótulo visível, ajuda e erro, no mesmo desenho do CampoTexto.
 * As props que não são do componente (ref, onChange, onBlur…) vão para o <select>: `{...register('campo')}` funciona.
 */
export default function CampoSelecao({
  rotulo,
  nome,
  erro,
  ajuda,
  obrigatorio = false,
  disabled = false,
  id: idInformado,
  className = '',
  children,
  ...resto
}) {
  const idGerado = useId();
  const id = idInformado ?? idGerado;
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  const descricoes = [ajuda && idAjuda, erro && idErro].filter(Boolean).join(' ');

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
      <select
        name={nome}
        {...resto}
        id={id}
        disabled={disabled}
        required={obrigatorio || undefined}
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={descricoes || undefined}
        className={`${CAMPO} ${erro ? 'border-perigo' : 'border-borda-controle'}`}
      >
        {children}
      </select>
      {ajuda && (
        <p id={idAjuda} className="text-sm text-texto-secundario">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-sm text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}
