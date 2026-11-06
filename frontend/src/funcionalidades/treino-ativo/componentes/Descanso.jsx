import Botao from '../../../componentes/Botao.jsx';
import Cronometro from '../../../componentes/Cronometro.jsx';
import {
  ACOES,
  selecionarExercicioAtual,
  selecionarProximoExercicio,
  selecionarRotuloDaSerie,
} from '../maquinaDoTreino.js';
import OpcaoVibrar from './OpcaoVibrar.jsx';
import TituloDaFase from './TituloDaFase.jsx';

function descreverProxima(estado) {
  const item = selecionarExercicioAtual(estado);
  if (estado.serie_atual < item.series) {
    const proximaSerie = selecionarRotuloDaSerie({ ...estado, serie_atual: estado.serie_atual + 1 });
    return `A seguir: ${proximaSerie} de ${item.nome}`;
  }
  const proximo = selecionarProximoExercicio(estado);
  return proximo ? `A seguir: ${proximo.nome}` : 'A seguir: resumo do treino';
}

/** Fase de descanso: contagem regressiva, +15 s e pular. */
export default function Descanso({ estado, segundosDeDescanso, despachar }) {
  return (
    <section aria-labelledby="titulo-descanso" className="flex flex-col gap-4">
      <TituloDaFase>
        <span id="titulo-descanso">Descanso</span>
      </TituloDaFase>
      <div className="flex justify-center py-2">
        <Cronometro rotulo="Descanso" segundos={segundosDeDescanso} />
      </div>
      <p className="text-center text-texto-secundario">{descreverProxima(estado)}</p>
      <div className="flex gap-3">
        <Botao variante="secundario" className="flex-1" onClick={() => despachar(ACOES.MAIS_15)}>
          +15 s
        </Botao>
        <Botao className="flex-1" onClick={() => despachar(ACOES.PULAR)}>
          Pular
        </Botao>
      </div>
      <OpcaoVibrar ligado={estado.vibrar} aoAlternar={(valor) => despachar(ACOES.ALTERNAR_VIBRAR, { valor })} />
    </section>
  );
}
