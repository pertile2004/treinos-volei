// Monta o corpo do POST /api/v1/sessoes (PR-16) a partir do estado final do treino ativo.
// O id_cliente é do treino, não da tentativa: reenviar manda sempre o mesmo valor.

const ORIGEM_CRONOMETRO = 'cronometro';
const DURACAO_MAX_SEGUNDOS = 86400;

/**
 * Devolve o estado com id_cliente. Se já existe, devolve o mesmo objeto e não chama o gerador.
 * @param {object} estado
 * @param {() => string} gerarId ex.: () => crypto.randomUUID()
 */
export function garantirIdCliente(estado, gerarId) {
  if (typeof estado.id_cliente === 'string' && estado.id_cliente !== '') return estado;
  const id = typeof gerarId === 'function' ? gerarId() : null;
  if (typeof id !== 'string' || id === '') {
    throw new Error('Não foi possível gerar o identificador do treino.');
  }
  return { ...estado, id_cliente: id };
}

// O servidor recusa o par (exercicio_id, numero) repetido; se o mesmo exercício aparece
// em dois itens do treino, a numeração continua de onde parou.
function numerarPorExercicio(series) {
  const contagem = new Map();
  return series.map((serie) => {
    const numero = (contagem.get(serie.exercicio_id) ?? 0) + 1;
    contagem.set(serie.exercicio_id, numero);
    return {
      exercicio_id: serie.exercicio_id,
      numero,
      repeticoes: serie.repeticoes ?? null,
      acertos: serie.acertos,
      erros: serie.erros,
      duracao_segundos: serie.duracao_segundos ?? null,
    };
  });
}

/**
 * Corpo do POST /sessoes. Exige série concluída, FINALIZAR já aplicado e id_cliente definido.
 * @returns {{ id_cliente: string, origem: 'cronometro', treino_id: number, iniciada_em: string,
 *   finalizada_em: string, duracao_segundos: number, observacao: string|null, series: object[] }}
 */
export function montarSessao(estado) {
  if (!Array.isArray(estado.series_feitas) || estado.series_feitas.length === 0) {
    throw new Error('Conclua pelo menos uma série antes de salvar o treino.');
  }
  if (!estado.finalizada_em || !estado.iniciada_em) {
    throw new Error('O treino ainda não foi finalizado.');
  }
  if (typeof estado.id_cliente !== 'string' || estado.id_cliente === '') {
    throw new Error('O treino está sem identificador de envio.');
  }
  const observacao = String(estado.observacao ?? '').trim();
  const duracao = Math.round(estado.ativo_acumulado_ms / 1000);
  const finalizadaAntesDoInicio = Date.parse(estado.finalizada_em) < Date.parse(estado.iniciada_em);
  return {
    id_cliente: estado.id_cliente,
    origem: ORIGEM_CRONOMETRO,
    treino_id: estado.treino_id,
    iniciada_em: estado.iniciada_em,
    finalizada_em: finalizadaAntesDoInicio ? estado.iniciada_em : estado.finalizada_em,
    duracao_segundos: Math.min(DURACAO_MAX_SEGUNDOS, Math.max(0, duracao)),
    observacao: observacao === '' ? null : observacao,
    series: numerarPorExercicio(estado.series_feitas),
  };
}

/**
 * Garante o id_cliente e monta o corpo. Guarde o `estado` devolvido (despache DEFINIR_ID_CLIENTE
 * se ele mudou) para que "Tentar de novo" reenvie o mesmo id.
 * @returns {{ estado: object, corpo: object }}
 */
export function prepararEnvio(estado, gerarId) {
  const comId = garantirIdCliente(estado, gerarId);
  return { estado: comId, corpo: montarSessao(comId) };
}
