import {
  FASES,
  selecionarExercicioAtual,
  selecionarProximoExercicio,
  selecionarRotuloDaSerie,
  selecionarRotuloDoExercicio,
} from '../maquinaDoTreino.js';

/** Texto anunciado em cada troca de fase (não muda a cada segundo: o tempo fica com o Cronometro). */
export function textoDoAnuncio(estado) {
  const prefixo = estado.descanso_encerrado_por === 'contagem' ? 'Descanso encerrado. ' : '';
  switch (estado.fase) {
    case FASES.EXERCICIO:
      return `${prefixo}${selecionarRotuloDoExercicio(estado)}, ${selecionarRotuloDaSerie(estado)}: ${
        selecionarExercicioAtual(estado)?.nome ?? ''
      }`;
    case FASES.DESCANSO:
      return 'Descanso';
    case FASES.PROXIMO:
      return `${prefixo}Próximo exercício: ${selecionarProximoExercicio(estado)?.nome ?? ''}`;
    case FASES.RESUMO:
      return 'Treino concluído. Confira o resumo e salve.';
    default:
      return '';
  }
}

/** Região educada (aria-live) com o anúncio da fase; fica fora da vista. */
export default function AnuncioDaFase({ estado }) {
  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only" data-testid="anuncio-da-fase">
      {textoDoAnuncio(estado)}
    </p>
  );
}
