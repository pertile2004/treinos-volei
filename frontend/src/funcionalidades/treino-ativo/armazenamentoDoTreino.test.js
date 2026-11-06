import { describe, expect, it } from 'vitest';
import {
  VERSAO_DO_ARMAZENAMENTO,
  chaveDoTreinoAtivo,
  limparTreino,
  precisaGravar,
  restaurarTreino,
  salvarTreino,
} from './armazenamentoDoTreino.js';
import {
  ACOES,
  FASES,
  criarEstadoInicial,
  reducerDoTreino,
  selecionarSegundosAtivos,
  selecionarSegundosDeDescanso,
} from './maquinaDoTreino.js';
import { aplicar, criarStorageFalso, estadoIniciado, estadoNoResumo, seg, treinoDeExemplo } from './apoioDeTeste.js';

const USUARIO = 7;
const CHAVE = 'volleypro:treino-ativo:v1:7';

describe('chave', () => {
  it('é separada por usuário e carrega a versão', () => {
    expect(VERSAO_DO_ARMAZENAMENTO).toBe(1);
    expect(chaveDoTreinoAtivo(USUARIO)).toBe(CHAVE);
    expect(chaveDoTreinoAtivo(8)).not.toBe(CHAVE);
  });
});

describe('salvar e restaurar', () => {
  it('grava JSON com a versão e restaura um estado igual', () => {
    const storage = criarStorageFalso();
    const estado = aplicar(estadoIniciado(), { tipo: ACOES.MAIS_ACERTO }, { tipo: ACOES.MAIS_ERRO });

    expect(salvarTreino(storage, USUARIO, estado)).toBe(true);

    expect(JSON.parse(storage.getItem(CHAVE)).versao).toBe(1);
    expect(restaurarTreino(storage, USUARIO)).toEqual(estado);
  });

  it('não mistura o treino de um usuário com o de outro', () => {
    const storage = criarStorageFalso();
    salvarTreino(storage, USUARIO, estadoIniciado());

    expect(restaurarTreino(storage, 8)).toBeNull();
  });

  it('sem nada salvo devolve null', () => {
    expect(restaurarTreino(criarStorageFalso(), USUARIO)).toBeNull();
  });

  it('limpar remove a chave', () => {
    const storage = criarStorageFalso();
    salvarTreino(storage, USUARIO, estadoIniciado());

    expect(limparTreino(storage, USUARIO)).toBe(true);
    expect(restaurarTreino(storage, USUARIO)).toBeNull();
    expect(storage.tamanho).toBe(0);
  });
});

describe('retomada após recarregar', () => {
  // Simula recarregar a página: o estado passa pelo storage e a máquina continua dele.
  const recarregar = (estado) => {
    const storage = criarStorageFalso();
    salvarTreino(storage, USUARIO, estado);
    return restaurarTreino(storage, USUARIO);
  };

  it('mantém fase, série, contadores e a pilha de desfazer', () => {
    const antes = aplicar(
      estadoIniciado(),
      { tipo: ACOES.CONCLUIR_SERIE, agora: seg(60) },
      { tipo: ACOES.PULAR, agora: seg(65) },
      { tipo: ACOES.MAIS_ACERTO },
      { tipo: ACOES.MAIS_ERRO },
    );

    const depois = recarregar(antes);

    expect(depois.fase).toBe(FASES.EXERCICIO);
    expect(depois.serie_atual).toBe(2);
    expect(depois.id_cliente).toBe('id-do-teste');
    expect(depois.atual).toMatchObject({ acertos: 1, erros: 1 });

    const desfeito = reducerDoTreino(depois, { tipo: ACOES.DESFAZER });
    expect(desfeito.atual).toMatchObject({ acertos: 1, erros: 0 });
  });

  it('exercício em andamento continua contando: recarregar não pausa', () => {
    const depois = recarregar(aplicar(estadoIniciado(), { tipo: ACOES.TIQUE, agora: seg(20) }));

    const retomado = reducerDoTreino(depois, { tipo: ACOES.TIQUE, agora: seg(80) });

    expect(selecionarSegundosAtivos(retomado)).toBe(80);
  });

  it('descanso ainda não vencido continua a contagem de onde estava', () => {
    const depois = recarregar(aplicar(estadoIniciado(), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(60) }));

    const retomado = reducerDoTreino(depois, { tipo: ACOES.TIQUE, agora: seg(90) });

    expect(retomado.fase).toBe(FASES.DESCANSO);
    expect(selecionarSegundosDeDescanso(retomado)).toBe(15);
  });

  it('descanso vencido enquanto a página estava fechada avança sozinho no primeiro tique', () => {
    const depois = recarregar(aplicar(estadoIniciado(), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(60) }));

    const retomado = reducerDoTreino(depois, { tipo: ACOES.TIQUE, agora: seg(3600) });

    expect(retomado.fase).toBe(FASES.EXERCICIO);
    expect(retomado.serie_atual).toBe(2);
    // O tempo fora não vira tempo ativo: a série nova começa no instante da volta.
    expect(selecionarSegundosAtivos(retomado)).toBe(60);
  });

  it('o resumo recarregado mantém as séries feitas para o envio', () => {
    const depois = recarregar(estadoNoResumo());

    expect(depois.fase).toBe(FASES.RESUMO);
    expect(depois.series_feitas).toHaveLength(3);
  });
});

describe('tolerância a dado ruim', () => {
  it('JSON corrompido é descartado e a chave é removida', () => {
    const storage = criarStorageFalso({ [CHAVE]: '{"versao":1,"fase":"desc' });

    expect(restaurarTreino(storage, USUARIO)).toBeNull();
    expect(storage.getItem(CHAVE)).toBeNull();
  });

  it('versão antiga ou futura é descartada', () => {
    const antiga = JSON.stringify({ ...estadoIniciado(), versao: 0 });
    const futura = JSON.stringify({ ...estadoIniciado(), versao: 2 });
    const semVersao = JSON.stringify({ fase: 'exercicio' });

    for (const texto of [antiga, futura, semVersao]) {
      const storage = criarStorageFalso({ [CHAVE]: texto });
      expect(restaurarTreino(storage, USUARIO)).toBeNull();
      expect(storage.getItem(CHAVE)).toBeNull();
    }
  });

  it('JSON válido com formato errado é descartado', () => {
    for (const texto of ['null', '42', '"oi"', '[]', '{}', '{"versao":1}']) {
      const storage = criarStorageFalso({ [CHAVE]: texto });
      expect(restaurarTreino(storage, USUARIO)).toBeNull();
    }
  });

  it('storage que lança erro não quebra a tela', () => {
    const quebrado = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };

    expect(restaurarTreino(quebrado, USUARIO)).toBeNull();
    expect(salvarTreino(quebrado, USUARIO, estadoIniciado())).toBe(false);
    expect(limparTreino(quebrado, USUARIO)).toBe(false);
  });

  it('dado corrompido em storage que não deixa remover também devolve null', () => {
    const storage = {
      getItem: () => 'isto não é JSON',
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };

    expect(restaurarTreino(storage, USUARIO)).toBeNull();
  });

  it('storage ausente (navegador sem localStorage) devolve null e false', () => {
    expect(restaurarTreino(undefined, USUARIO)).toBeNull();
    expect(salvarTreino(null, USUARIO, estadoIniciado())).toBe(false);
    expect(limparTreino(undefined, USUARIO)).toBe(false);
  });

  it('não grava estado inválido', () => {
    const storage = criarStorageFalso();

    expect(salvarTreino(storage, USUARIO, { fase: 'exercicio' })).toBe(false);
    expect(storage.tamanho).toBe(0);
  });
});

describe('precisaGravar', () => {
  it('tique que só mexe no relógio não pede gravação', () => {
    const antes = estadoIniciado();
    const depois = reducerDoTreino(antes, { tipo: ACOES.TIQUE });

    expect(depois).not.toBe(antes);
    expect(precisaGravar(antes, depois)).toBe(false);
  });

  it('ação que muda o treino pede gravação', () => {
    const antes = estadoIniciado();

    expect(precisaGravar(antes, reducerDoTreino(antes, { tipo: ACOES.MAIS_ACERTO }))).toBe(true);
    expect(precisaGravar(antes, antes)).toBe(false);
    expect(precisaGravar(null, antes)).toBe(true);
  });

  it('tique que encerra o descanso pede gravação', () => {
    const antes = aplicar(estadoIniciado(), { tipo: ACOES.CONCLUIR_SERIE, agora: seg(60) });
    const depois = reducerDoTreino(antes, { tipo: ACOES.TIQUE, agora: seg(200) });

    expect(precisaGravar(antes, depois)).toBe(true);
  });

  it('a preparação (antes de iniciar) não precisa ser gravada', () => {
    const preparacao = criarEstadoInicial(treinoDeExemplo());

    expect(precisaGravar(null, preparacao)).toBe(false);
  });
});
