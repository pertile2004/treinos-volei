import { describe, expect, it } from 'vitest';
import {
  ETAPAS,
  LIMITES,
  MAXIMO_DE_ITENS,
  acoes,
  estadoInicial,
  itensDaEtapa,
  montadorDeTreino,
  podeAdicionar,
  podeDescer,
  podeSubir,
} from './montadorDeTreino.js';

const manchete = {
  id: 15,
  nome: 'Recepção em manchete',
  fundamento: 'recepcao',
  series_padrao: 3,
  repeticoes_padrao: 10,
  duracao_segundos_padrao: null,
  descanso_segundos: 45,
};
const deslocamento = {
  id: 7,
  nome: 'Deslocamento lateral',
  fundamento: 'preparo_fisico',
  series_padrao: 2,
  repeticoes_padrao: null,
  duracao_segundos_padrao: 60,
  descanso_segundos: 30,
};
const saque = { ...manchete, id: 21, nome: 'Saque por baixo', fundamento: 'saque' };

function congelar(valor) {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

function aplicar(estado, ...lista) {
  return lista.reduce((atual, acao) => montadorDeTreino(congelar(atual), acao), estado);
}

function nomes(estado, etapa) {
  return itensDaEtapa(estado, etapa).map((item) => item.exercicio.nome);
}

function ordens(estado, etapa) {
  return itensDaEtapa(estado, etapa).map((item) => item.ordem);
}

describe('constantes', () => {
  it('tem as 4 etapas na ordem do treino', () => {
    expect(ETAPAS).toEqual(['aquecimento', 'tecnica', 'especifico', 'volta_a_calma']);
  });

  it('tem os limites do card', () => {
    expect(MAXIMO_DE_ITENS).toBe(30);
    expect(LIMITES.series).toMatchObject({ minimo: 1, maximo: 10 });
    expect(LIMITES.repeticoes).toMatchObject({ minimo: 1, maximo: 100 });
    expect(LIMITES.duracao_segundos).toMatchObject({ minimo: 10, maximo: 3600 });
    expect(LIMITES.descanso_segundos).toMatchObject({ minimo: 0, maximo: 600 });
  });
});

describe('estado inicial e campos', () => {
  it('começa vazio e privado', () => {
    expect(estadoInicial()).toEqual({
      nome: '',
      descricao: '',
      nivel: '',
      visibilidade: 'privado',
      itens: [],
      proximaChave: 1,
    });
  });

  it('define nome, descrição, nível e visibilidade', () => {
    const estado = aplicar(
      estadoInicial(),
      acoes.definirCampo('nome', 'Terça'),
      acoes.definirCampo('descricao', 'Passe'),
      acoes.definirCampo('nivel', 'iniciante'),
      acoes.definirCampo('visibilidade', 'atletas'),
    );
    expect(estado).toMatchObject({
      nome: 'Terça',
      descricao: 'Passe',
      nivel: 'iniciante',
      visibilidade: 'atletas',
    });
  });

  it('ignora campo desconhecido e ação desconhecida', () => {
    const estado = estadoInicial();
    expect(montadorDeTreino(estado, acoes.definirCampo('itens', 'x'))).toBe(estado);
    expect(montadorDeTreino(estado, { tipo: 'nao_existe' })).toBe(estado);
  });
});

describe('adicionar exercício', () => {
  it('entra na etapa com os padrões do exercício (repetições)', () => {
    const estado = aplicar(estadoInicial(), acoes.adicionarExercicio('tecnica', manchete));
    expect(estado.itens).toEqual([
      {
        chave: 1,
        etapa: 'tecnica',
        ordem: 1,
        exercicio: { id: 15, nome: 'Recepção em manchete', fundamento: 'recepcao', removido: false },
        series: 3,
        repeticoes: 10,
        duracao_segundos: null,
        descanso_segundos: 45,
      },
    ]);
    expect(estado.proximaChave).toBe(2);
  });

  it('entra com os padrões do exercício (duração)', () => {
    const estado = aplicar(estadoInicial(), acoes.adicionarExercicio('aquecimento', deslocamento));
    expect(estado.itens[0]).toMatchObject({
      series: 2,
      repeticoes: null,
      duracao_segundos: 60,
      descanso_segundos: 30,
    });
  });

  it('usa padrões seguros quando o exercício não traz os dele e aplica os limites', () => {
    const semPadrao = { id: 1, nome: 'Sem padrão' };
    const foraDoLimite = { ...manchete, series_padrao: 50, repeticoes_padrao: 500, descanso_segundos: 9999 };
    const estado = aplicar(
      estadoInicial(),
      acoes.adicionarExercicio('tecnica', semPadrao),
      acoes.adicionarExercicio('tecnica', foraDoLimite),
    );
    expect(estado.itens[0]).toMatchObject({
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
    });
    expect(estado.itens[1]).toMatchObject({ series: 10, repeticoes: 100, descanso_segundos: 600 });
  });

  it('mantém os itens agrupados na ordem das etapas, com ordem sequencial por etapa', () => {
    const estado = aplicar(
      estadoInicial(),
      acoes.adicionarExercicio('volta_a_calma', saque),
      acoes.adicionarExercicio('tecnica', manchete),
      acoes.adicionarExercicio('aquecimento', deslocamento),
      acoes.adicionarExercicio('tecnica', saque),
    );
    expect(estado.itens.map((item) => [item.etapa, item.ordem])).toEqual([
      ['aquecimento', 1],
      ['tecnica', 1],
      ['tecnica', 2],
      ['volta_a_calma', 1],
    ]);
    expect(nomes(estado, 'tecnica')).toEqual(['Recepção em manchete', 'Saque por baixo']);
    expect(itensDaEtapa(estado, 'especifico')).toEqual([]);
  });

  it('aceita o mesmo exercício duas vezes, com chaves diferentes', () => {
    const estado = aplicar(
      estadoInicial(),
      acoes.adicionarExercicio('tecnica', manchete),
      acoes.adicionarExercicio('tecnica', manchete),
    );
    expect(estado.itens.map((item) => item.chave)).toEqual([1, 2]);
  });

  it('ignora etapa inválida e exercício sem id', () => {
    const estado = estadoInicial();
    expect(montadorDeTreino(estado, acoes.adicionarExercicio('alongamento', manchete))).toBe(estado);
    expect(montadorDeTreino(estado, acoes.adicionarExercicio('tecnica', null))).toBe(estado);
    expect(montadorDeTreino(estado, acoes.adicionarExercicio('tecnica', { nome: 'x' }))).toBe(estado);
  });

  it('para no máximo de 30 itens', () => {
    let estado = estadoInicial();
    for (let i = 0; i < 30; i += 1) {
      expect(podeAdicionar(estado)).toBe(true);
      estado = aplicar(estado, acoes.adicionarExercicio(ETAPAS[i % 4], manchete));
    }
    expect(estado.itens).toHaveLength(30);
    expect(podeAdicionar(estado)).toBe(false);
    expect(montadorDeTreino(estado, acoes.adicionarExercicio('tecnica', saque))).toBe(estado);
  });
});

describe('remover item', () => {
  it('remove e renumera só a etapa afetada', () => {
    const base = aplicar(
      estadoInicial(),
      acoes.adicionarExercicio('aquecimento', deslocamento),
      acoes.adicionarExercicio('tecnica', manchete),
      acoes.adicionarExercicio('tecnica', saque),
      acoes.adicionarExercicio('tecnica', deslocamento),
    );
    const estado = aplicar(base, acoes.removerItem(2));
    expect(nomes(estado, 'tecnica')).toEqual(['Saque por baixo', 'Deslocamento lateral']);
    expect(ordens(estado, 'tecnica')).toEqual([1, 2]);
    expect(ordens(estado, 'aquecimento')).toEqual([1]);
  });

  it('não reaproveita a chave de um item removido', () => {
    const estado = aplicar(
      estadoInicial(),
      acoes.adicionarExercicio('tecnica', manchete),
      acoes.removerItem(1),
      acoes.adicionarExercicio('tecnica', saque),
    );
    expect(estado.itens.map((item) => item.chave)).toEqual([2]);
  });

  it('chave inexistente não muda nada', () => {
    const estado = aplicar(estadoInicial(), acoes.adicionarExercicio('tecnica', manchete));
    expect(montadorDeTreino(estado, acoes.removerItem(99))).toBe(estado);
  });
});

describe('reordenar com subir e descer', () => {
  function tresNaTecnica() {
    return aplicar(
      estadoInicial(),
      acoes.adicionarExercicio('aquecimento', deslocamento),
      acoes.adicionarExercicio('tecnica', manchete),
      acoes.adicionarExercicio('tecnica', saque),
      acoes.adicionarExercicio('tecnica', deslocamento),
      acoes.adicionarExercicio('especifico', saque),
    );
  }

  it('descer troca com o próximo da mesma etapa e recalcula a ordem', () => {
    const estado = aplicar(tresNaTecnica(), acoes.descerItem(2));
    expect(nomes(estado, 'tecnica')).toEqual(['Saque por baixo', 'Recepção em manchete', 'Deslocamento lateral']);
    expect(ordens(estado, 'tecnica')).toEqual([1, 2, 3]);
  });

  it('subir troca com o anterior da mesma etapa e recalcula a ordem', () => {
    const estado = aplicar(tresNaTecnica(), acoes.subirItem(4));
    expect(nomes(estado, 'tecnica')).toEqual(['Recepção em manchete', 'Deslocamento lateral', 'Saque por baixo']);
    expect(ordens(estado, 'tecnica')).toEqual([1, 2, 3]);
  });

  it('subir o primeiro da etapa não muda nada nem invade a etapa anterior', () => {
    const base = tresNaTecnica();
    expect(podeSubir(base, 2)).toBe(false);
    expect(montadorDeTreino(base, acoes.subirItem(2))).toBe(base);
  });

  it('descer o último da etapa não muda nada nem invade a etapa seguinte', () => {
    const base = tresNaTecnica();
    expect(podeDescer(base, 4)).toBe(false);
    expect(montadorDeTreino(base, acoes.descerItem(4))).toBe(base);
  });

  it('item único na etapa não sobe nem desce', () => {
    const base = tresNaTecnica();
    expect(podeSubir(base, 1)).toBe(false);
    expect(podeDescer(base, 1)).toBe(false);
    expect(montadorDeTreino(base, acoes.subirItem(1))).toBe(base);
    expect(montadorDeTreino(base, acoes.descerItem(1))).toBe(base);
  });

  it('podeSubir e podeDescer acompanham a posição', () => {
    const base = tresNaTecnica();
    expect([podeSubir(base, 3), podeDescer(base, 3)]).toEqual([true, true]);
    expect([podeSubir(base, 2), podeDescer(base, 2)]).toEqual([false, true]);
    expect([podeSubir(base, 4), podeDescer(base, 4)]).toEqual([true, false]);
    expect([podeSubir(base, 99), podeDescer(base, 99)]).toEqual([false, false]);
  });

  it('subir e depois descer volta ao estado anterior', () => {
    const base = tresNaTecnica();
    expect(aplicar(base, acoes.subirItem(3), acoes.descerItem(3))).toEqual(base);
  });

  it('chave inexistente não muda nada', () => {
    const base = tresNaTecnica();
    expect(montadorDeTreino(base, acoes.subirItem(99))).toBe(base);
    expect(montadorDeTreino(base, acoes.descerItem(99))).toBe(base);
  });

  it('não muda as outras etapas', () => {
    const base = tresNaTecnica();
    const estado = aplicar(base, acoes.descerItem(2));
    expect(itensDaEtapa(estado, 'aquecimento')).toEqual(itensDaEtapa(base, 'aquecimento'));
    expect(itensDaEtapa(estado, 'especifico')).toEqual(itensDaEtapa(base, 'especifico'));
  });
});

describe('ajustar parâmetros do item', () => {
  function comUmItem() {
    return aplicar(estadoInicial(), acoes.adicionarExercicio('tecnica', manchete));
  }
  function ajustado(campo, valor) {
    return aplicar(comUmItem(), acoes.ajustarItem(1, campo, valor)).itens[0][campo];
  }

  it.each([
    ['series', 0, 1],
    ['series', 1, 1],
    ['series', 10, 10],
    ['series', 11, 10],
    ['repeticoes', 0, 1],
    ['repeticoes', 100, 100],
    ['repeticoes', 101, 100],
    ['duracao_segundos', 9, 10],
    ['duracao_segundos', 10, 10],
    ['duracao_segundos', 3600, 3600],
    ['duracao_segundos', 3601, 3600],
    ['descanso_segundos', -1, 0],
    ['descanso_segundos', 0, 0],
    ['descanso_segundos', 600, 600],
    ['descanso_segundos', 601, 600],
  ])('%s = %s fica %s', (campo, valor, esperado) => {
    expect(ajustado(campo, valor)).toBe(esperado);
  });

  it('arredonda decimais e aceita número em texto', () => {
    expect(ajustado('series', 4.6)).toBe(5);
    expect(ajustado('repeticoes', '12')).toBe(12);
  });

  it('valor que não é número não muda nada', () => {
    const base = comUmItem();
    expect(montadorDeTreino(base, acoes.ajustarItem(1, 'series', 'abc'))).toBe(base);
    expect(montadorDeTreino(base, acoes.ajustarItem(1, 'series', Number.NaN))).toBe(base);
    expect(montadorDeTreino(base, acoes.ajustarItem(1, 'series', Infinity))).toBe(base);
  });

  it('repetições e duração podem ser esvaziadas; séries e descanso não', () => {
    const base = comUmItem();
    expect(ajustado('repeticoes', null)).toBeNull();
    expect(ajustado('repeticoes', '')).toBeNull();
    expect(ajustado('duracao_segundos', null)).toBeNull();
    expect(montadorDeTreino(base, acoes.ajustarItem(1, 'series', null))).toBe(base);
    expect(montadorDeTreino(base, acoes.ajustarItem(1, 'descanso_segundos', ''))).toBe(base);
  });

  it('campo desconhecido ou chave inexistente não mudam nada', () => {
    const base = comUmItem();
    expect(montadorDeTreino(base, acoes.ajustarItem(1, 'ordem', 5))).toBe(base);
    expect(montadorDeTreino(base, acoes.ajustarItem(99, 'series', 5))).toBe(base);
  });

  it('só muda o item pedido', () => {
    const base = aplicar(comUmItem(), acoes.adicionarExercicio('tecnica', saque));
    const estado = aplicar(base, acoes.ajustarItem(2, 'series', 7));
    expect(estado.itens[0]).toBe(base.itens[0]);
    expect(estado.itens[1].series).toBe(7);
  });

  it('definirMedida troca entre repetições e duração sem deixar os dois vazios', () => {
    const porDuracao = aplicar(comUmItem(), acoes.definirMedida(1, 'duracao_segundos'));
    expect(porDuracao.itens[0]).toMatchObject({ repeticoes: null, duracao_segundos: 30 });
    const porRepeticoes = aplicar(porDuracao, acoes.definirMedida(1, 'repeticoes'));
    expect(porRepeticoes.itens[0]).toMatchObject({ repeticoes: 10, duracao_segundos: null });
    expect(montadorDeTreino(porRepeticoes, acoes.definirMedida(1, 'series'))).toBe(porRepeticoes);
  });
});

describe('carregar', () => {
  it('substitui o estado e normaliza a ordem por etapa', () => {
    const carregado = {
      nome: 'Importado',
      descricao: '',
      nivel: 'avancado',
      visibilidade: 'privado',
      proximaChave: 9,
      itens: [
        { chave: 5, etapa: 'tecnica', ordem: 7, exercicio: { id: 1 }, series: 1 },
        { chave: 6, etapa: 'aquecimento', ordem: 3, exercicio: { id: 2 }, series: 1 },
      ],
    };
    const estado = aplicar(estadoInicial(), acoes.carregar(carregado));
    expect(estado.nome).toBe('Importado');
    expect(estado.itens.map((item) => [item.chave, item.etapa, item.ordem])).toEqual([
      [6, 'aquecimento', 1],
      [5, 'tecnica', 1],
    ]);
  });
});
