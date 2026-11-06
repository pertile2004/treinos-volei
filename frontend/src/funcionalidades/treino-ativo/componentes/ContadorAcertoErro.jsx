import { useId } from 'react';
import Botao from '../../../componentes/Botao.jsx';

const BOTAO_GRANDE = 'min-h-16 flex-1 text-xl';

/**
 * Botões grandes de +acerto e +erro, os totais da série e o desfazer. Acerto e erro se distinguem por texto
 * e sinal, não só por cor; o total de cada um é um `output` (anunciado de forma educada).
 */
export default function ContadorAcertoErro({ acertos, erros, podeDesfazer, aoAcertar, aoErrar, aoDesfazer }) {
  const idAcertos = useId();
  const idErros = useId();
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-cartao border border-borda bg-superficie p-3">
          <dt className="text-sm text-texto-secundario">Acertos</dt>
          <dd>
            <output id={idAcertos} aria-label="Acertos" className="text-destaque font-bold tabular-nums">
              {acertos}
            </output>
          </dd>
        </div>
        <div className="rounded-cartao border border-borda bg-superficie p-3">
          <dt className="text-sm text-texto-secundario">Erros</dt>
          <dd>
            <output id={idErros} aria-label="Erros" className="text-destaque font-bold tabular-nums">
              {erros}
            </output>
          </dd>
        </div>
      </dl>
      <div className="flex gap-3">
        <Botao className={BOTAO_GRANDE} aria-describedby={idAcertos} onClick={aoAcertar}>
          + Acerto
        </Botao>
        <Botao variante="secundario" className={BOTAO_GRANDE} aria-describedby={idErros} onClick={aoErrar}>
          + Erro
        </Botao>
      </div>
      <Botao variante="fantasma" disabled={!podeDesfazer} onClick={aoDesfazer}>
        Desfazer
      </Botao>
    </div>
  );
}
