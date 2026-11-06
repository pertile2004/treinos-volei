import { describe, expect, it } from 'vitest';
import {
  ACOES,
  FASES,
  LIMITES,
  criarAcaoIniciar,
  criarEstadoInicial,
  deveVibrar,
  estadoEhValido,
  reducerDoTreino,
  selecionarExercicioAtual,
  selecionarProgresso,
  selecionarProximoExercicio,
  selecionarResumo,
  selecionarRotuloDaSerie,
  selecionarRotuloDoExercicio,
  selecionarSegundosAtivos,
  selecionarSegundosDaSerie,
  selecionarSegundosDeDescanso,
} from './maquinaDoTreino.js';
import { T0, aplicar, estadoIniciado, estadoNoResumo, seg, treinoDeExemplo } from './apoioDeTeste.js';

const iso = (ms) => new Date(ms).toISOString();

describe('criarEstadoInicial', () => {
  it('começa na preparação com o retrato dos itens do treino', () => {
    const estado = criarEstadoInicial(treinoDeExemplo());

    expect(estado.versao).toBe(1);
    expect(estado.fase).toBe(FASES.PREPARACAO);
    expect(estado.treino_id).toBe(12);
    expect(estado.treino.nome).toBe('Recepção básica');
    expect(estado.treino.itens).toHaveLength(2);
    expect(estado.id_cliente).toBeNull();
    expect(estado.series_feitas).toEqual([]);
    expect(estado.vibrar).toBe(false);
  });

  it('aceita o exercício aninhado no item e corrige valores fora do limite', () => {
    const estado = criarEstadoInicial({
      id: 3,
      nome: 'Saque',
      itens: [
        {
          exercicio: { id: 9, nome: 'Saque por baixo', removido: true },
          series: 99,
          repeticoes: 5000,
          descanso_segundos: -3,
        },
      ],
    });

    expect(estado.treino.itens[0]).toEqual({
      exercicio_id: 9,
      nome: 'Saque por baixo',
      removido: true,
      etapa: null,
      series: LIMITES.SERIES_MAX,
      repeticoes: LIMITES.REPETICOES_MAX,
      duracao_segundos: null,
      descanso_segundos: 0,
    });
  });

  it('não inicia um treino sem exercícios', () => {
    const vazio = criarEstadoInicial({ id: 1, nome: 'Vazio', itens: [] });

    expect(reducerDoTreino(vazio, { tipo: ACOES.INICIAR, agora: T0 })).toBe(vazio);
  });
});

describe('fluxo completo', () => {
  it('preparação → exercício → descanso → exercício → próximo → resumo', () => {
    let estado = estadoIniciado();
    expect(estado.fase).toBe(FASES.EXERCICIO);
    expect(estado.indice_exercicio).toBe(0);
    expect(estado.serie_atual).toBe(1);
    expect(estado.iniciada_em).toBe(iso(T0));
    expect(estado.id_cliente).toBe('id-do-teste');
    expect(estado.atual).toEqual({ repeticoes: 10, acertos: 0, erros: 0, desfazer: [] });

    estado = aplicar(
      estado,
      { tipo: ACOES.MAIS_ACERTO },
      { tipo: ACOES.MAIS_ACERTO },
      { tipo: ACOES.MAIS_ERRO },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(95) },
    );
    expect(estado.fase).toBe(FASES.DESCANSO);
    expect(estado.serie_atual).toBe(1);
    expect(estado.descanso_termina_em).toBe(iso(seg(140)));
    expect(estado.ativo_acumulado_ms).toBe(95000);
    expect(estado.ativo_desde).toBeNull();
    expect(estado.series_feitas).toEqual([
      { exercicio_id: 5, numero: 1, repeticoes: 10, acertos: 2, erros: 1, duracao_segundos: 95 },
    ]);
    expect(estado.atual).toEqual({ repeticoes: 10, acertos: 0, erros: 0, desfazer: [] });

    estado = aplicar(estado, { tipo: ACOES.TIQUE, agora: seg(139) });
    expect(estado.fase).toBe(FASES.DESCANSO);
    expect(selecionarSegundosDeDescanso(estado)).toBe(1);

    estado = aplicar(estado, { tipo: ACOES.TIQUE, agora: seg(140) });
    expect(estado.fase).toBe(FASES.EXERCICIO);
    expect(estado.serie_atual).toBe(2);
    expect(estado.descanso_termina_em).toBeNull();
    expect(estado.descanso_encerrado_por).toBe('contagem');

    estado = aplicar(estado, { tipo: ACOES.CONCLUIR_SERIE, agora: seg(200) });
    expect(estado.fase).toBe(FASES.DESCANSO);

    estado = aplicar(estado, { tipo: ACOES.PULAR, agora: seg(205) });
    expect(estado.fase).toBe(FASES.PROXIMO);
    expect(estado.descanso_encerrado_por).toBe('pulo');
    expect(selecionarProximoExercicio(estado).nome).toBe('Prancha');
    expect(selecionarProximoExercicio(estado).removido).toBe(true);

    estado = aplicar(estado, { tipo: ACOES.COMECAR_PROXIMO, agora: seg(210) });
    expect(estado.fase).toBe(FASES.EXERCICIO);
    expect(estado.indice_exercicio).toBe(1);
    expect(estado.serie_atual).toBe(1);
    expect(estado.atual.repeticoes).toBeNull();

    estado = aplicar(estado, { tipo: ACOES.CONCLUIR_SERIE, agora: seg(240) });
    expect(estado.fase).toBe(FASES.RESUMO);
    expect(estado.series_feitas).toHaveLength(3);
    expect(estado.series_feitas[2]).toEqual({
      exercicio_id: 8,
      numero: 1,
      repeticoes: null,
      acertos: 0,
      erros: 0,
      duracao_segundos: 30,
    });
    expect(estado.ativo_acumulado_ms).toBe(185000);
    expect(estado.finalizada_em).toBeNull();

    estado = aplicar(estado, { tipo: ACOES.FINALIZAR, agora: seg(250) });
    expect(estado.fase).toBe(FASES.RESUMO);
    expect(estado.finalizada_em).toBe(iso(seg(250)));
  });

  it('a última série do último exercício vai direto ao resumo, sem descanso', () => {
    const treino = treinoDeExemplo();
    treino.itens = [{ ...treino.itens[0], series: 1 }];

    const estado = aplicar(estadoIniciado(treino), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) });

    expect(estado.fase).toBe(FASES.RESUMO);
    expect(estado.descanso_termina_em).toBeNull();
  });

  it('descanso de 0 segundos é pulado: próxima série ou próximo exercício', () => {
    const treino = treinoDeExemplo();
    treino.itens[0].descanso_segundos = 0;

    let estado = aplicar(estadoIniciado(treino), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) });
    expect(estado.fase).toBe(FASES.EXERCICIO);
    expect(estado.serie_atual).toBe(2);
    expect(estado.ativo_desde).toBe(iso(seg(10)));

    estado = aplicar(estado, { tipo: ACOES.CONCLUIR_SERIE, agora: seg(20) });
    expect(estado.fase).toBe(FASES.PROXIMO);
    expect(estado.descanso_encerrado_por).toBeNull();
  });

  it('finalizar guarda o instante só uma vez (nova tentativa não muda)', () => {
    const finalizado = aplicar(estadoNoResumo(), { tipo: ACOES.FINALIZAR, agora: seg(250) });

    expect(reducerDoTreino(finalizado, { tipo: ACOES.FINALIZAR, agora: seg(900) })).toBe(finalizado);
  });

  it('ignora ação desconhecida, ação inválida e ação fora da fase', () => {
    const preparacao = criarEstadoInicial(treinoDeExemplo());
    const exercicio = estadoIniciado();
    const resumo = estadoNoResumo();

    expect(reducerDoTreino(exercicio, { tipo: 'NAO_EXISTE' })).toBe(exercicio);
    expect(reducerDoTreino(exercicio, undefined)).toBe(exercicio);
    expect(reducerDoTreino(preparacao, { tipo: ACOES.MAIS_ACERTO })).toBe(preparacao);
    expect(reducerDoTreino(preparacao, { tipo: ACOES.CONCLUIR_SERIE, agora: T0 })).toBe(preparacao);
    expect(reducerDoTreino(preparacao, { tipo: ACOES.FINALIZAR, agora: T0 })).toBe(preparacao);
    expect(reducerDoTreino(exercicio, { tipo: ACOES.PULAR, agora: seg(1) })).toBe(exercicio);
    expect(reducerDoTreino(exercicio, { tipo: ACOES.MAIS_15, agora: seg(1) })).toBe(exercicio);
    expect(reducerDoTreino(exercicio, { tipo: ACOES.COMECAR_PROXIMO, agora: seg(1) })).toBe(exercicio);
    expect(reducerDoTreino(exercicio, { tipo: ACOES.INICIAR, agora: seg(1) })).toBe(exercicio);
    expect(reducerDoTreino(resumo, { tipo: ACOES.MAIS_ERRO })).toBe(resumo);
    expect(reducerDoTreino(resumo, { tipo: ACOES.CONCLUIR_SERIE, agora: seg(300) })).toBe(resumo);
  });
});

describe('marcar e desfazer', () => {
  it('soma acertos e erros e desfaz na ordem inversa', () => {
    let estado = aplicar(
      estadoIniciado(),
      { tipo: ACOES.MAIS_ACERTO },
      { tipo: ACOES.MAIS_ERRO },
      { tipo: ACOES.MAIS_ACERTO },
    );
    expect(estado.atual).toMatchObject({ acertos: 2, erros: 1 });
    expect(estado.atual.desfazer).toEqual(['acerto', 'erro', 'acerto']);

    estado = aplicar(estado, { tipo: ACOES.DESFAZER });
    expect(estado.atual).toMatchObject({ acertos: 1, erros: 1 });

    estado = aplicar(estado, { tipo: ACOES.DESFAZER });
    expect(estado.atual).toMatchObject({ acertos: 1, erros: 0 });

    estado = aplicar(estado, { tipo: ACOES.DESFAZER });
    expect(estado.atual).toEqual({ repeticoes: 10, acertos: 0, erros: 0, desfazer: [] });
  });

  it('desfazer com a pilha vazia não muda nada', () => {
    const estado = estadoIniciado();

    expect(reducerDoTreino(estado, { tipo: ACOES.DESFAZER })).toBe(estado);
  });

  it('desfazer vale só para a série atual: série concluída fica imutável', () => {
    const estado = aplicar(
      estadoIniciado(),
      { tipo: ACOES.MAIS_ACERTO },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(30) },
      { tipo: ACOES.PULAR, agora: seg(31) },
    );

    const depois = reducerDoTreino(estado, { tipo: ACOES.DESFAZER });

    expect(depois).toBe(estado);
    expect(depois.series_feitas[0].acertos).toBe(1);
  });

  it('acertos e erros param em 999 e o excedente não entra na pilha', () => {
    const base = estadoIniciado();
    const noTeto = {
      ...base,
      atual: { ...base.atual, acertos: LIMITES.MARCACOES_MAX, erros: LIMITES.MARCACOES_MAX },
    };

    expect(reducerDoTreino(noTeto, { tipo: ACOES.MAIS_ACERTO })).toBe(noTeto);
    expect(reducerDoTreino(noTeto, { tipo: ACOES.MAIS_ERRO })).toBe(noTeto);
  });
});

describe('ajustes de séries e repetições', () => {
  it('ajusta as séries do exercício atual entre a série atual e o máximo', () => {
    let estado = aplicar(estadoIniciado(), { tipo: ACOES.AJUSTAR_SERIES, valor: 4 });
    expect(selecionarExercicioAtual(estado).series).toBe(4);
    expect(estado.treino.itens[1].series).toBe(1);

    estado = aplicar(estado, { tipo: ACOES.AJUSTAR_SERIES, valor: 50 });
    expect(selecionarExercicioAtual(estado).series).toBe(LIMITES.SERIES_MAX);

    estado = aplicar(estado, { tipo: ACOES.AJUSTAR_SERIES, valor: 0 });
    expect(selecionarExercicioAtual(estado).series).toBe(1);
  });

  it('não deixa as séries descerem abaixo da série atual', () => {
    const naSerie2 = aplicar(
      estadoIniciado(),
      { tipo: ACOES.AJUSTAR_SERIES, valor: 3 },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) },
      { tipo: ACOES.PULAR, agora: seg(11) },
    );
    expect(naSerie2.serie_atual).toBe(2);

    const estado = aplicar(naSerie2, { tipo: ACOES.AJUSTAR_SERIES, valor: 1 });

    expect(selecionarExercicioAtual(estado).series).toBe(2);
  });

  it('reduzir as séries até a atual faz a próxima conclusão encerrar o exercício', () => {
    const estado = aplicar(
      estadoIniciado(),
      { tipo: ACOES.AJUSTAR_SERIES, valor: 1 },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) },
      { tipo: ACOES.PULAR, agora: seg(11) },
    );

    expect(estado.fase).toBe(FASES.PROXIMO);
  });

  it('ajusta as repetições entre 0 e 999 e leva o ajuste para a próxima série', () => {
    let estado = aplicar(estadoIniciado(), { tipo: ACOES.AJUSTAR_REPETICOES, valor: -5 });
    expect(estado.atual.repeticoes).toBe(0);

    estado = aplicar(estado, { tipo: ACOES.AJUSTAR_REPETICOES, valor: 5000 });
    expect(estado.atual.repeticoes).toBe(LIMITES.REPETICOES_MAX);

    estado = aplicar(
      estado,
      { tipo: ACOES.AJUSTAR_REPETICOES, valor: 12 },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) },
      { tipo: ACOES.PULAR, agora: seg(11) },
    );
    expect(estado.series_feitas[0].repeticoes).toBe(12);
    expect(estado.atual.repeticoes).toBe(12);
  });

  it('ignora ajuste sem número ou com o mesmo valor', () => {
    const estado = estadoIniciado();

    expect(reducerDoTreino(estado, { tipo: ACOES.AJUSTAR_SERIES, valor: 'abc' })).toBe(estado);
    expect(reducerDoTreino(estado, { tipo: ACOES.AJUSTAR_SERIES })).toBe(estado);
    expect(reducerDoTreino(estado, { tipo: ACOES.AJUSTAR_SERIES, valor: 2 })).toBe(estado);
    expect(reducerDoTreino(estado, { tipo: ACOES.AJUSTAR_REPETICOES, valor: null })).toBe(estado);
    expect(reducerDoTreino(estado, { tipo: ACOES.AJUSTAR_REPETICOES, valor: 10 })).toBe(estado);
  });
});

describe('relógio e descanso', () => {
  const noDescanso = () => aplicar(estadoIniciado(), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(60) });

  it('tique sem instante avança 1 segundo', () => {
    const estado = aplicar(estadoIniciado(), { tipo: ACOES.TIQUE }, { tipo: ACOES.TIQUE });

    expect(estado.atualizado_em).toBe(iso(seg(2)));
    expect(selecionarSegundosAtivos(estado)).toBe(2);
    expect(selecionarSegundosDaSerie(estado)).toBe(2);
  });

  it('tique na preparação, sem instante, não muda nada', () => {
    const estado = criarEstadoInicial(treinoDeExemplo());

    expect(reducerDoTreino(estado, { tipo: ACOES.TIQUE })).toBe(estado);
  });

  it('a contagem regressiva chega a zero tique a tique e avança sozinha', () => {
    let estado = noDescanso();
    expect(selecionarSegundosDeDescanso(estado)).toBe(45);

    for (let i = 0; i < 44; i += 1) estado = aplicar(estado, { tipo: ACOES.TIQUE });
    expect(estado.fase).toBe(FASES.DESCANSO);
    expect(selecionarSegundosDeDescanso(estado)).toBe(1);

    estado = aplicar(estado, { tipo: ACOES.TIQUE });
    expect(estado.fase).toBe(FASES.EXERCICIO);
    expect(estado.serie_atual).toBe(2);
    expect(selecionarSegundosDeDescanso(estado)).toBe(0);
  });

  it('+15 s soma 15 segundos ao fim do descanso', () => {
    const estado = aplicar(noDescanso(), { tipo: ACOES.MAIS_15, agora: seg(70) });

    expect(estado.descanso_termina_em).toBe(iso(seg(120)));
    expect(selecionarSegundosDeDescanso(estado)).toBe(50);
  });

  it('+15 s não deixa o descanso restante passar do teto', () => {
    let estado = noDescanso();
    for (let i = 0; i < 100; i += 1) estado = aplicar(estado, { tipo: ACOES.MAIS_15 });

    expect(selecionarSegundosDeDescanso(estado)).toBe(LIMITES.DESCANSO_MAX_SEGUNDOS);
    expect(reducerDoTreino(estado, { tipo: ACOES.MAIS_15 })).toBe(estado);
  });

  it('pular avança na hora e o tempo de descanso não conta como ativo', () => {
    const estado = aplicar(noDescanso(), { tipo: ACOES.PULAR, agora: seg(80) }, { tipo: ACOES.TIQUE, agora: seg(90) });

    expect(estado.fase).toBe(FASES.EXERCICIO);
    expect(selecionarSegundosAtivos(estado)).toBe(70);
    expect(selecionarSegundosDaSerie(estado)).toBe(10);
  });

  it('pausar congela o tempo ativo e retomar volta a contar', () => {
    let estado = aplicar(
      estadoIniciado(),
      { tipo: ACOES.PAUSAR, agora: seg(20) },
      { tipo: ACOES.TIQUE, agora: seg(50) },
    );
    expect(estado.pausado).toBe(true);
    expect(selecionarSegundosAtivos(estado)).toBe(20);

    estado = aplicar(estado, { tipo: ACOES.RETOMAR, agora: seg(60) }, { tipo: ACOES.CONCLUIR_SERIE, agora: seg(70) });
    expect(estado.pausado).toBe(false);
    expect(estado.series_feitas[0].duracao_segundos).toBe(30);
    expect(estado.ativo_acumulado_ms).toBe(30000);
  });

  it('relógio do aparelho voltando no tempo não gera duração negativa', () => {
    const estado = aplicar(estadoIniciado(), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(-500) });

    expect(estado.series_feitas[0].duracao_segundos).toBe(0);
    expect(estado.ativo_acumulado_ms).toBe(0);
  });

  it('aceita o instante como número, Date ou texto ISO', () => {
    const comDate = aplicar(estadoIniciado(), { tipo: ACOES.TIQUE, agora: new Date(seg(7)) });
    const comTexto = aplicar(estadoIniciado(), { tipo: ACOES.TIQUE, agora: iso(seg(7)) });

    expect(comDate.atualizado_em).toBe(iso(seg(7)));
    expect(comTexto.atualizado_em).toBe(iso(seg(7)));
  });
});

describe('vibração, observação e id_cliente', () => {
  it('deveVibrar só no fim da contagem e com a opção ligada', () => {
    const ligado = aplicar(
      estadoIniciado(),
      { tipo: ACOES.ALTERNAR_VIBRAR },
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(60) },
    );
    expect(ligado.vibrar).toBe(true);

    const fimDaContagem = aplicar(ligado, { tipo: ACOES.TIQUE, agora: seg(105) });
    const pulado = aplicar(ligado, { tipo: ACOES.PULAR, agora: seg(70) });
    const aindaDescansando = aplicar(ligado, { tipo: ACOES.TIQUE, agora: seg(70) });
    const desligado = aplicar(ligado, { tipo: ACOES.ALTERNAR_VIBRAR, valor: false });
    const fimSemVibrar = aplicar(desligado, { tipo: ACOES.TIQUE, agora: seg(105) });

    expect(deveVibrar(ligado, fimDaContagem)).toBe(true);
    expect(deveVibrar(ligado, pulado)).toBe(false);
    expect(deveVibrar(ligado, aindaDescansando)).toBe(false);
    expect(deveVibrar(desligado, fimSemVibrar)).toBe(false);
    expect(deveVibrar(fimDaContagem, fimDaContagem)).toBe(false);
  });

  it('observação só no resumo e limitada a 1000 caracteres', () => {
    const exercicio = estadoIniciado();
    expect(reducerDoTreino(exercicio, { tipo: ACOES.DEFINIR_OBSERVACAO, valor: 'oi' })).toBe(exercicio);

    const resumo = aplicar(estadoNoResumo(), {
      tipo: ACOES.DEFINIR_OBSERVACAO,
      valor: 'x'.repeat(1500),
    });
    expect(resumo.observacao).toHaveLength(LIMITES.OBSERVACAO_MAX);
  });

  it('criarAcaoIniciar chama o gerador uma vez e o id nunca é trocado depois', () => {
    let chamadas = 0;
    const gerarId = () => `id-${(chamadas += 1)}`;

    const acao = criarAcaoIniciar({ agora: T0, gerarId });
    expect(acao).toEqual({ tipo: ACOES.INICIAR, agora: T0, id_cliente: 'id-1' });

    const estado = aplicar(criarEstadoInicial(treinoDeExemplo()), acao);
    expect(estado.id_cliente).toBe('id-1');
    expect(reducerDoTreino(estado, { tipo: ACOES.DEFINIR_ID_CLIENTE, id_cliente: 'outro' })).toBe(estado);
    expect(chamadas).toBe(1);
  });

  it('DEFINIR_ID_CLIENTE preenche o id quando o treino começou sem ele', () => {
    const semId = aplicar(criarEstadoInicial(treinoDeExemplo()), { tipo: ACOES.INICIAR, agora: T0 });
    expect(semId.id_cliente).toBeNull();

    const comId = aplicar(semId, { tipo: ACOES.DEFINIR_ID_CLIENTE, id_cliente: 'id-9' });
    expect(comId.id_cliente).toBe('id-9');
  });
});

describe('seletores', () => {
  it('mostra "Exercício N de M" e "Série X de Y" em cada fase', () => {
    const preparacao = criarEstadoInicial(treinoDeExemplo());
    expect(selecionarRotuloDoExercicio(preparacao)).toBe('Exercício 1 de 2');
    expect(selecionarRotuloDaSerie(preparacao)).toBe('Série 1 de 2');

    const serie2 = aplicar(
      estadoIniciado(),
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) },
      { tipo: ACOES.PULAR, agora: seg(11) },
    );
    expect(selecionarRotuloDoExercicio(serie2)).toBe('Exercício 1 de 2');
    expect(selecionarRotuloDaSerie(serie2)).toBe('Série 2 de 2');

    const resumo = estadoNoResumo();
    expect(selecionarRotuloDoExercicio(resumo)).toBe('Exercício 2 de 2');
    expect(selecionarRotuloDaSerie(resumo)).toBe('Série 1 de 1');
  });

  it('o progresso acompanha as séries concluídas e os ajustes de séries', () => {
    const inicio = estadoIniciado();
    expect(selecionarProgresso(inicio)).toEqual({
      exercicio: 1,
      totalDeExercicios: 2,
      serie: 1,
      totalDeSeries: 2,
      seriesFeitas: 0,
      seriesTotais: 3,
      fracao: 0,
      percentual: 0,
    });

    const umaFeita = aplicar(inicio, { tipo: ACOES.CONCLUIR_SERIE, agora: seg(10) });
    expect(selecionarProgresso(umaFeita).percentual).toBe(33);

    const comMaisSeries = aplicar(inicio, { tipo: ACOES.AJUSTAR_SERIES, valor: 4 });
    expect(selecionarProgresso(comMaisSeries).seriesTotais).toBe(5);

    expect(selecionarProgresso(estadoNoResumo())).toMatchObject({ fracao: 1, percentual: 100 });
  });

  it('não há próximo exercício no último', () => {
    expect(selecionarProximoExercicio(estadoNoResumo())).toBeNull();
  });

  it('o resumo soma duração, acertos e erros por exercício', () => {
    expect(selecionarResumo(estadoNoResumo())).toEqual({
      duracao_segundos: 185,
      acertos: 3,
      erros: 1,
      exercicios: [
        {
          exercicio_id: 5,
          nome: 'Manchete na parede',
          removido: false,
          series: 2,
          acertos: 3,
          erros: 1,
        },
        { exercicio_id: 8, nome: 'Prancha', removido: true, series: 1, acertos: 0, erros: 0 },
      ],
    });
  });
});

describe('estadoEhValido', () => {
  it('aceita todos os estados do fluxo', () => {
    expect(estadoEhValido(criarEstadoInicial(treinoDeExemplo()))).toBe(true);
    expect(estadoEhValido(estadoIniciado())).toBe(true);
    expect(estadoEhValido(estadoNoResumo())).toBe(true);
  });

  it('recusa formato quebrado', () => {
    const bom = estadoIniciado();

    expect(estadoEhValido(null)).toBe(false);
    expect(estadoEhValido('texto')).toBe(false);
    expect(estadoEhValido([])).toBe(false);
    expect(estadoEhValido({ ...bom, versao: 0 })).toBe(false);
    expect(estadoEhValido({ ...bom, fase: 'voando' })).toBe(false);
    expect(estadoEhValido({ ...bom, indice_exercicio: 7 })).toBe(false);
    expect(estadoEhValido({ ...bom, serie_atual: 0 })).toBe(false);
    expect(estadoEhValido({ ...bom, treino: { nome: 'x', itens: [] } })).toBe(false);
    expect(estadoEhValido({ ...bom, atual: null })).toBe(false);
    expect(estadoEhValido({ ...bom, series_feitas: 'nada' })).toBe(false);
    expect(estadoEhValido({ ...bom, iniciada_em: 'ontem' })).toBe(false);
    expect(estadoEhValido({ ...bom, fase: 'descanso', descanso_termina_em: null })).toBe(false);
  });
});
