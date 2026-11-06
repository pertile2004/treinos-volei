import { describe, expect, it } from 'vitest';
import { garantirIdCliente, montarSessao, prepararEnvio } from './montarSessao.js';
import { restaurarTreino, salvarTreino } from './armazenamentoDoTreino.js';
import { ACOES, criarEstadoInicial } from './maquinaDoTreino.js';
import {
  T0,
  aplicar,
  criarStorageFalso,
  estadoIniciado,
  estadoNoResumo,
  seg,
  treinoDeExemplo,
} from './apoioDeTeste.js';

const finalizado = () => aplicar(estadoNoResumo(), { tipo: ACOES.FINALIZAR, agora: seg(250) });

function criarGerador() {
  const gerador = () => {
    gerador.chamadas += 1;
    return `uuid-${gerador.chamadas}`;
  };
  gerador.chamadas = 0;
  return gerador;
}

describe('montarSessao', () => {
  it('monta o corpo do POST /sessoes a partir do estado final', () => {
    expect(montarSessao(finalizado())).toEqual({
      id_cliente: 'id-do-teste',
      origem: 'cronometro',
      treino_id: 12,
      iniciada_em: '2026-11-06T21:00:00.000Z',
      finalizada_em: '2026-11-06T21:04:10.000Z',
      duracao_segundos: 185,
      observacao: null,
      series: [
        { exercicio_id: 5, numero: 1, repeticoes: 10, acertos: 2, erros: 1, duracao_segundos: 95 },
        { exercicio_id: 5, numero: 2, repeticoes: 10, acertos: 1, erros: 0, duracao_segundos: 60 },
        { exercicio_id: 8, numero: 1, repeticoes: null, acertos: 0, erros: 0, duracao_segundos: 30 },
      ],
    });
  });

  it('envia a observação sem espaços nas pontas e null quando vazia', () => {
    const comTexto = aplicar(
      estadoNoResumo(),
      { tipo: ACOES.DEFINIR_OBSERVACAO, valor: '  Braço cansado.  ' },
      { tipo: ACOES.FINALIZAR, agora: seg(250) },
    );
    const soEspacos = aplicar(
      estadoNoResumo(),
      { tipo: ACOES.DEFINIR_OBSERVACAO, valor: '   ' },
      { tipo: ACOES.FINALIZAR, agora: seg(250) },
    );

    expect(montarSessao(comTexto).observacao).toBe('Braço cansado.');
    expect(montarSessao(soEspacos).observacao).toBeNull();
  });

  it('arredonda a duração para segundos inteiros', () => {
    const estado = { ...finalizado(), ativo_acumulado_ms: 185500 };

    expect(montarSessao(estado).duracao_segundos).toBe(186);
  });

  it('renumera as séries quando o mesmo exercício aparece em dois itens do treino', () => {
    const treino = treinoDeExemplo();
    treino.itens = [
      { ...treino.itens[0], series: 1, descanso_segundos: 0 },
      { ...treino.itens[0], series: 1, descanso_segundos: 0, etapa: 'jogo' },
    ];
    const estado = aplicar(
      estadoIniciado(treino),
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) },
      { tipo: ACOES.COMECAR_PROXIMO, agora: seg(12) },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(20) },
      { tipo: ACOES.FINALIZAR, agora: seg(21) },
    );

    const pares = montarSessao(estado).series.map((s) => [s.exercicio_id, s.numero]);

    expect(pares).toEqual([
      [5, 1],
      [5, 2],
    ]);
  });

  it('não envia a série em andamento que não foi concluída', () => {
    const noMeio = aplicar(
      estadoIniciado(),
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) },
      { tipo: ACOES.PULAR, agora: seg(11) },
      { tipo: ACOES.MAIS_ACERTO },
    );
    const estado = { ...noMeio, fase: 'resumo', finalizada_em: new Date(seg(30)).toISOString() };

    expect(montarSessao(estado).series).toHaveLength(1);
  });

  it('nunca manda finalizada_em antes de iniciada_em', () => {
    const estado = { ...finalizado(), finalizada_em: new Date(seg(-60)).toISOString() };

    expect(montarSessao(estado).finalizada_em).toBe(new Date(T0).toISOString());
  });

  it('explica o que falta quando o estado não está pronto para envio', () => {
    const preparacao = criarEstadoInicial(treinoDeExemplo());
    const semFinalizar = estadoNoResumo();
    const semId = { ...finalizado(), id_cliente: null };

    expect(() => montarSessao(preparacao)).toThrow('Conclua pelo menos uma série');
    expect(() => montarSessao(semFinalizar)).toThrow('ainda não foi finalizado');
    expect(() => montarSessao(semId)).toThrow('identificador');
  });
});

describe('idempotência do id_cliente', () => {
  it('garantirIdCliente não chama o gerador quando o treino já tem id', () => {
    const gerarId = criarGerador();
    const estado = finalizado();

    expect(garantirIdCliente(estado, gerarId)).toBe(estado);
    expect(gerarId.chamadas).toBe(0);
  });

  it('garantirIdCliente gera uma vez quando falta e não muda o estado original', () => {
    const gerarId = criarGerador();
    const semId = Object.freeze({ ...finalizado(), id_cliente: null });

    const comId = garantirIdCliente(semId, gerarId);

    expect(comId.id_cliente).toBe('uuid-1');
    expect(semId.id_cliente).toBeNull();
    expect(garantirIdCliente(comId, gerarId)).toBe(comId);
    expect(gerarId.chamadas).toBe(1);
  });

  it('"Tentar de novo" envia o mesmo id_cliente e o mesmo corpo', () => {
    const gerarId = criarGerador();
    const semId = { ...finalizado(), id_cliente: null };

    const primeira = prepararEnvio(semId, gerarId);
    const segunda = prepararEnvio(primeira.estado, gerarId);
    const terceira = prepararEnvio(segunda.estado, gerarId);

    expect(primeira.corpo.id_cliente).toBe('uuid-1');
    expect(segunda.corpo).toEqual(primeira.corpo);
    expect(terceira.corpo).toEqual(primeira.corpo);
    expect(segunda.estado).toBe(primeira.estado);
    expect(gerarId.chamadas).toBe(1);
  });

  it('o id sobrevive a recarregar a página entre uma tentativa e outra', () => {
    const gerarId = criarGerador();
    const storage = criarStorageFalso();
    const primeira = prepararEnvio({ ...finalizado(), id_cliente: null }, gerarId);
    salvarTreino(storage, 7, primeira.estado);

    const segunda = prepararEnvio(restaurarTreino(storage, 7), gerarId);

    expect(segunda.corpo).toEqual(primeira.corpo);
    expect(gerarId.chamadas).toBe(1);
  });

  it('treinos diferentes recebem ids diferentes', () => {
    const gerarId = criarGerador();

    const a = prepararEnvio({ ...finalizado(), id_cliente: null }, gerarId);
    const b = prepararEnvio({ ...finalizado(), id_cliente: null }, gerarId);

    expect(a.corpo.id_cliente).not.toBe(b.corpo.id_cliente);
  });

  it('recusa gerador que não devolve um texto', () => {
    const semId = { ...finalizado(), id_cliente: null };

    expect(() => garantirIdCliente(semId, () => '')).toThrow('identificador');
    expect(() => garantirIdCliente(semId, undefined)).toThrow('identificador');
  });
});
