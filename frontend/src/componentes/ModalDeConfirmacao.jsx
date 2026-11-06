import { useEffect, useId, useRef } from 'react';
import Botao from './Botao.jsx';

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal de confirmação. Controlado por `aberto`: quem usa fecha em `aoConfirmar` e `aoCancelar`.
 * Esc (e o cancelamento nativo do <dialog>) chama `aoCancelar`.
 */
export default function ModalDeConfirmacao({
  aberto = false,
  titulo,
  descricao,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  perigo = false,
  carregando = false,
  aoConfirmar,
  aoCancelar,
  className = '',
  ...resto
}) {
  const refDialogo = useRef(null);
  const idTitulo = useId();
  const idDescricao = useId();

  useEffect(() => {
    if (!aberto) return undefined;
    const dialogo = refDialogo.current;
    const acionador = document.activeElement;
    if (!dialogo.open) dialogo.showModal();
    dialogo.querySelector('[data-foco-inicial]')?.focus();

    return () => {
      if (dialogo.open) dialogo.close();
      if (acionador instanceof HTMLElement && acionador.isConnected) acionador.focus();
    };
  }, [aberto]);

  if (!aberto) return null;

  function cancelar(evento) {
    evento.preventDefault();
    aoCancelar?.();
  }

  function aoPressionarTecla(evento) {
    if (evento.key === 'Escape') {
      cancelar(evento);
      return;
    }
    if (evento.key !== 'Tab') return;

    const dialogo = evento.currentTarget;
    const focaveis = [...dialogo.querySelectorAll(FOCAVEIS)];
    if (focaveis.length === 0) {
      evento.preventDefault();
      return;
    }
    const primeiro = focaveis[0];
    const ultimo = focaveis.at(-1);
    const atual = document.activeElement;
    const fora = !dialogo.contains(atual);
    if (evento.shiftKey && (atual === primeiro || fora)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && (atual === ultimo || fora)) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  return (
    <dialog
      {...resto}
      ref={refDialogo}
      aria-labelledby={idTitulo}
      aria-describedby={descricao ? idDescricao : undefined}
      onCancel={cancelar}
      onKeyDown={aoPressionarTecla}
      className={`m-auto w-full max-w-md bg-transparent p-4 text-texto backdrop:bg-fundo/80 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 rounded-cartao border border-borda bg-superficie-elevada p-6">
        <h2 id={idTitulo} className="text-xl font-bold">
          {titulo}
        </h2>
        {descricao && (
          <p id={idDescricao} className="text-texto-secundario">
            {descricao}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Botao variante="secundario" data-foco-inicial={perigo ? '' : undefined} onClick={() => aoCancelar?.()}>
            {rotuloCancelar}
          </Botao>
          <Botao
            variante={perigo ? 'perigo' : 'primario'}
            carregando={carregando}
            data-foco-inicial={perigo ? undefined : ''}
            onClick={() => aoConfirmar?.()}
          >
            {rotuloConfirmar}
          </Botao>
        </div>
      </div>
    </dialog>
  );
}
