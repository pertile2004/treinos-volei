import { useId } from 'react';
import Botao from '../../../componentes/Botao.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import MensagemDeErro from '../../../componentes/MensagemDeErro.jsx';
import { formatarDuracao } from '../../../lib/formatos.js';
import { ACOES, LIMITES, selecionarResumo } from '../maquinaDoTreino.js';
import { SELO_REMOVIDO } from './descricoes.js';
import TituloDaFase from './TituloDaFase.jsx';

const CAMPO =
  'min-h-24 w-full rounded-botao border border-borda-controle bg-superficie p-3 text-base text-texto placeholder:text-texto-secundario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria';

const plural = (quantidade, singular, pluralDaPalavra) =>
  `${quantidade} ${quantidade === 1 ? singular : pluralDaPalavra}`;

/** Fase final: totais, linhas por exercício, observação e o botão de salvar. Sem pontos nem medalhas (RN-10). */
export default function Resumo({ estado, despachar, aoFinalizar, salvando, erro }) {
  const resumo = selecionarResumo(estado);
  const idObservacao = useId();

  return (
    <section aria-labelledby="titulo-resumo" className="flex flex-col gap-4">
      <TituloDaFase>
        <span id="titulo-resumo">Resumo do treino</span>
      </TituloDaFase>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ['Duração', formatarDuracao(resumo.duracao_segundos)],
          ['Acertos', String(resumo.acertos)],
          ['Erros', String(resumo.erros)],
        ].map(([termo, valor]) => (
          <div key={termo} className="rounded-cartao border border-borda bg-superficie p-3">
            <dt className="text-sm text-texto-secundario">{termo}</dt>
            <dd className="text-xl font-bold tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-col gap-2">
        {resumo.exercicios.map((linha) => (
          <li
            key={linha.exercicio_id}
            className="flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-3"
          >
            <span className="flex flex-wrap items-center gap-2 font-bold">
              {linha.nome}
              {linha.removido && <Etiqueta>{SELO_REMOVIDO}</Etiqueta>}
            </span>
            <span className="text-sm text-texto-secundario">
              {plural(linha.series, 'série', 'séries')} · {plural(linha.acertos, 'acerto', 'acertos')} ·{' '}
              {plural(linha.erros, 'erro', 'erros')}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1">
        <label htmlFor={idObservacao} className="text-sm font-bold">
          Observação (opcional)
        </label>
        <textarea
          id={idObservacao}
          value={estado.observacao}
          maxLength={LIMITES.OBSERVACAO_MAX}
          disabled={salvando}
          onChange={(evento) => despachar(ACOES.DEFINIR_OBSERVACAO, { valor: evento.target.value })}
          className={CAMPO}
        />
      </div>

      {erro && (
        <MensagemDeErro
          erro={erro}
          mensagem="Não foi possível salvar. Seu treino continua guardado neste aparelho."
          aoTentarDeNovo={aoFinalizar}
        />
      )}

      <Botao larguraTotal carregando={salvando} onClick={aoFinalizar}>
        {salvando ? 'Salvando…' : 'Finalizar e salvar treino'}
      </Botao>
    </section>
  );
}
