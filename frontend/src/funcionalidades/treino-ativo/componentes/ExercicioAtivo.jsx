import BarraDeProgresso from '../../../componentes/BarraDeProgresso.jsx';
import Botao from '../../../componentes/Botao.jsx';
import Cronometro from '../../../componentes/Cronometro.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import Stepper from '../../../componentes/Stepper.jsx';
import {
  ACOES,
  LIMITES,
  selecionarExercicioAtual,
  selecionarPodeDesfazer,
  selecionarProgresso,
  selecionarRotuloDaSerie,
  selecionarRotuloDoExercicio,
} from '../maquinaDoTreino.js';
import ContadorAcertoErro from './ContadorAcertoErro.jsx';
import { SELO_REMOVIDO } from './descricoes.js';
import TituloDaFase from './TituloDaFase.jsx';

/** Fase de exercício: progresso, cronômetro da série, ajustes de séries e repetições, acertos e erros. */
export default function ExercicioAtivo({ estado, segundosDaSerie, despachar }) {
  const item = selecionarExercicioAtual(estado);
  const progresso = selecionarProgresso(estado);
  const { atual } = estado;

  return (
    <section aria-labelledby="titulo-exercicio" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-texto-secundario">{selecionarRotuloDoExercicio(estado)}</p>
        <TituloDaFase>
          <span id="titulo-exercicio" className="flex flex-wrap items-center gap-2">
            {item.nome}
            {item.removido && <Etiqueta>{SELO_REMOVIDO}</Etiqueta>}
          </span>
        </TituloDaFase>
        <p className="font-bold">{selecionarRotuloDaSerie(estado)}</p>
      </div>

      <BarraDeProgresso rotulo="Progresso do treino" valor={progresso.percentual} />

      <div className="flex justify-center py-2">
        <Cronometro rotulo="Tempo da série" segundos={segundosDaSerie} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-texto-secundario">Séries</span>
          <Stepper
            rotulo="Séries"
            valor={item.series}
            min={estado.serie_atual}
            max={LIMITES.SERIES_MAX}
            aoMudar={(valor) => despachar(ACOES.AJUSTAR_SERIES, { valor })}
          />
        </div>
        {atual.repeticoes !== null ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-texto-secundario">Repetições</span>
            <Stepper
              rotulo="Repetições"
              valor={atual.repeticoes}
              min={0}
              max={LIMITES.REPETICOES_MAX}
              aoMudar={(valor) => despachar(ACOES.AJUSTAR_REPETICOES, { valor })}
            />
          </div>
        ) : (
          item.duracao_segundos !== null && (
            <p className="text-sm text-texto-secundario">Duração prevista: {item.duracao_segundos} s</p>
          )
        )}
      </div>

      <ContadorAcertoErro
        acertos={atual.acertos}
        erros={atual.erros}
        podeDesfazer={selecionarPodeDesfazer(estado)}
        aoAcertar={() => despachar(ACOES.MAIS_ACERTO)}
        aoErrar={() => despachar(ACOES.MAIS_ERRO)}
        aoDesfazer={() => despachar(ACOES.DESFAZER)}
      />

      <div className="flex gap-3">
        <Botao
          variante="secundario"
          className="flex-1"
          aria-pressed={estado.pausado}
          onClick={() => despachar(estado.pausado ? ACOES.RETOMAR : ACOES.PAUSAR)}
        >
          {estado.pausado ? 'Continuar' : 'Pausar'}
        </Botao>
        <Botao className="flex-1" onClick={() => despachar(ACOES.CONCLUIR_SERIE)}>
          Concluir série
        </Botao>
      </div>
    </section>
  );
}
