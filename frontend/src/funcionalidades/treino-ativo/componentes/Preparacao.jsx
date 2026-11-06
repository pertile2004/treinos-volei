import Botao from '../../../componentes/Botao.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import { SELO_REMOVIDO, descreverDescanso, descreverItem } from './descricoes.js';
import OpcaoVibrar from './OpcaoVibrar.jsx';
import TituloDaFase from './TituloDaFase.jsx';

/** Fase de preparação: nome do treino, lista dos exercícios e o botão de começar. */
export default function Preparacao({ estado, aoIniciar, aoAlternarVibrar }) {
  const { itens } = estado.treino;
  return (
    <section aria-labelledby="titulo-preparacao" className="flex flex-col gap-4">
      <TituloDaFase>
        <span id="titulo-preparacao">{estado.treino.nome}</span>
      </TituloDaFase>
      <p className="text-texto-secundario">
        {itens.length} {itens.length === 1 ? 'exercício' : 'exercícios'}
      </p>
      <ol className="flex flex-col gap-2">
        {itens.map((item, indice) => (
          <li
            key={`${item.exercicio_id}-${indice}`}
            className="flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-3"
          >
            <span className="flex flex-wrap items-center gap-2 font-bold">
              {item.nome}
              {item.removido && <Etiqueta>{SELO_REMOVIDO}</Etiqueta>}
            </span>
            <span className="text-sm text-texto-secundario">
              {descreverItem(item)} · {descreverDescanso(item)}
            </span>
          </li>
        ))}
      </ol>
      <OpcaoVibrar ligado={estado.vibrar} aoAlternar={aoAlternarVibrar} />
      <Botao larguraTotal onClick={aoIniciar}>
        Iniciar treino
      </Botao>
    </section>
  );
}
