import Botao from '../../../componentes/Botao.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import { ACOES, selecionarProximoExercicio } from '../maquinaDoTreino.js';
import { SELO_REMOVIDO, descreverDescanso, descreverItem } from './descricoes.js';
import TituloDaFase from './TituloDaFase.jsx';

/** Fase entre exercícios: mostra o próximo e espera o "Começar". */
export default function ProximoExercicio({ estado, despachar }) {
  const proximo = selecionarProximoExercicio(estado);
  if (!proximo) return null;
  return (
    <section aria-labelledby="titulo-proximo" className="flex flex-col gap-4">
      <TituloDaFase>
        <span id="titulo-proximo">Próximo exercício</span>
      </TituloDaFase>
      <div className="flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-4">
        <p className="flex flex-wrap items-center gap-2 text-xl font-bold">
          {proximo.nome}
          {proximo.removido && <Etiqueta>{SELO_REMOVIDO}</Etiqueta>}
        </p>
        <p className="text-texto-secundario">
          {descreverItem(proximo)} · {descreverDescanso(proximo)}
        </p>
      </div>
      <Botao larguraTotal onClick={() => despachar(ACOES.COMECAR_PROXIMO)}>
        Começar
      </Botao>
    </section>
  );
}
