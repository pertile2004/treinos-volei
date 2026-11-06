import { describe, expect, it } from 'vitest';
import { estadoParaCorpo, respostaParaEstado } from './corpoDoTreino.js';
import { acoes, estadoInicial, montadorDeTreino } from './montadorDeTreino.js';
import { validarTreino } from './validarTreino.js';

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

// Resposta 201 do rascunho do PR-12.
const resposta = {
  data: {
    id: 12,
    nome: 'Recepção e saque — terça',
    descricao: 'Foco em passe para o levantador.',
    nivel: 'intermediario',
    visibilidade: 'privado',
    duracao_estimada_minutos: 9,
    autor: { id: 3, nome: 'Lucas' },
    itens: [
      {
        id: 40,
        etapa: 'aquecimento',
        ordem: 1,
        series: 2,
        repeticoes: null,
        duracao_segundos: 60,
        descanso_segundos: 30,
        exercicio: { id: 7, nome: 'Deslocamento lateral', fundamento: 'preparo_fisico', removido: false },
      },
      {
        id: 41,
        etapa: 'tecnica',
        ordem: 1,
        series: 3,
        repeticoes: 10,
        duracao_segundos: null,
        descanso_segundos: 45,
        exercicio: { id: 15, nome: 'Recepção em manchete', fundamento: 'recepcao', removido: false },
      },
    ],
    criado_em: '2026-11-06T14:00:00Z',
  },
};

const corpoDaResposta = {
  nome: 'Recepção e saque — terça',
  descricao: 'Foco em passe para o levantador.',
  nivel: 'intermediario',
  visibilidade: 'privado',
  itens: [
    {
      exercicio_id: 7,
      etapa: 'aquecimento',
      ordem: 1,
      series: 2,
      repeticoes: null,
      duracao_segundos: 60,
      descanso_segundos: 30,
    },
    {
      exercicio_id: 15,
      etapa: 'tecnica',
      ordem: 1,
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
    },
  ],
};

function montar(...lista) {
  return lista.reduce(montadorDeTreino, estadoInicial());
}

describe('estadoParaCorpo', () => {
  it('monta o corpo do POST /treinos com ordem sequencial por etapa', () => {
    const estado = montar(
      acoes.definirCampo('nome', '  Terça  '),
      acoes.definirCampo('descricao', '  Passe  '),
      acoes.definirCampo('nivel', 'iniciante'),
      acoes.adicionarExercicio('tecnica', manchete),
      acoes.adicionarExercicio('aquecimento', deslocamento),
      acoes.adicionarExercicio('tecnica', deslocamento),
      acoes.subirItem(3),
    );
    expect(estadoParaCorpo(estado)).toEqual({
      nome: 'Terça',
      descricao: 'Passe',
      nivel: 'iniciante',
      visibilidade: 'privado',
      itens: [
        {
          exercicio_id: 7,
          etapa: 'aquecimento',
          ordem: 1,
          series: 2,
          repeticoes: null,
          duracao_segundos: 60,
          descanso_segundos: 30,
        },
        {
          exercicio_id: 7,
          etapa: 'tecnica',
          ordem: 1,
          series: 2,
          repeticoes: null,
          duracao_segundos: 60,
          descanso_segundos: 30,
        },
        {
          exercicio_id: 15,
          etapa: 'tecnica',
          ordem: 2,
          series: 3,
          repeticoes: 10,
          duracao_segundos: null,
          descanso_segundos: 45,
        },
      ],
    });
  });

  it('descrição vazia vira null', () => {
    expect(estadoParaCorpo(montar(acoes.definirCampo('descricao', '   '))).descricao).toBeNull();
    expect(estadoParaCorpo({ ...estadoInicial(), descricao: null }).descricao).toBeNull();
  });

  it('não envia campos que são do servidor nem campos locais', () => {
    const corpo = estadoParaCorpo(montar(acoes.adicionarExercicio('tecnica', manchete)));
    expect(Object.keys(corpo).sort()).toEqual(['descricao', 'itens', 'nivel', 'nome', 'visibilidade']);
    expect(Object.keys(corpo.itens[0]).sort()).toEqual([
      'descanso_segundos',
      'duracao_segundos',
      'etapa',
      'exercicio_id',
      'ordem',
      'repeticoes',
      'series',
    ]);
  });

  it('recalcula a ordem mesmo se o estado vier com buracos, sem repetir o par (etapa, ordem)', () => {
    const estado = respostaParaEstado({
      ...resposta.data,
      itens: [
        { ...resposta.data.itens[1], ordem: 9 },
        { ...resposta.data.itens[1], id: 42, ordem: 4, exercicio: { id: 21, nome: 'Saque' } },
        { ...resposta.data.itens[0], ordem: 5 },
      ],
    });
    const pares = estadoParaCorpo(estado).itens.map((i) => [i.exercicio_id, i.etapa, i.ordem]);
    expect(pares).toEqual([
      [7, 'aquecimento', 1],
      [21, 'tecnica', 1],
      [15, 'tecnica', 2],
    ]);
  });

  it('não altera o estado recebido', () => {
    const estado = montar(acoes.adicionarExercicio('tecnica', manchete));
    const copia = structuredClone(estado);
    estadoParaCorpo(estado);
    expect(estado).toEqual(copia);
  });
});

describe('respostaParaEstado', () => {
  it('transforma a resposta da API no estado do montador', () => {
    expect(respostaParaEstado(resposta)).toEqual({
      nome: 'Recepção e saque — terça',
      descricao: 'Foco em passe para o levantador.',
      nivel: 'intermediario',
      visibilidade: 'privado',
      proximaChave: 3,
      itens: [
        {
          chave: 1,
          etapa: 'aquecimento',
          ordem: 1,
          exercicio: { id: 7, nome: 'Deslocamento lateral', fundamento: 'preparo_fisico', removido: false },
          series: 2,
          repeticoes: null,
          duracao_segundos: 60,
          descanso_segundos: 30,
        },
        {
          chave: 2,
          etapa: 'tecnica',
          ordem: 1,
          exercicio: { id: 15, nome: 'Recepção em manchete', fundamento: 'recepcao', removido: false },
          series: 3,
          repeticoes: 10,
          duracao_segundos: null,
          descanso_segundos: 45,
        },
      ],
    });
  });

  it('aceita o treino com ou sem o envelope data', () => {
    expect(respostaParaEstado(resposta.data)).toEqual(respostaParaEstado(resposta));
  });

  it('descrição null vira texto vazio e treino sem itens vira lista vazia', () => {
    const estado = respostaParaEstado({ ...resposta.data, descricao: null, itens: undefined });
    expect(estado.descricao).toBe('');
    expect(estado.itens).toEqual([]);
    expect(estado.proximaChave).toBe(1);
  });

  it('preserva o selo de exercício removido da biblioteca', () => {
    const removido = {
      ...resposta.data.itens[1],
      exercicio: { ...resposta.data.itens[1].exercicio, removido: true },
    };
    const estado = respostaParaEstado({ ...resposta.data, itens: [removido] });
    expect(estado.itens[0].exercicio.removido).toBe(true);
  });

  it('o estado carregado continua editável pelo reducer', () => {
    const estado = montadorDeTreino(respostaParaEstado(resposta), acoes.adicionarExercicio('tecnica', manchete));
    expect(estado.itens.map((i) => i.chave)).toEqual([1, 2, 3]);
    expect(estado.itens[2]).toMatchObject({ etapa: 'tecnica', ordem: 2 });
  });
});

describe('ida e volta', () => {
  it('resposta -> estado -> corpo devolve os campos enviáveis da resposta', () => {
    expect(estadoParaCorpo(respostaParaEstado(resposta))).toEqual(corpoDaResposta);
  });

  it('estado -> corpo -> resposta -> estado preserva o estado', () => {
    const estado = montar(
      acoes.definirCampo('nome', 'Terça'),
      acoes.definirCampo('descricao', 'Passe'),
      acoes.definirCampo('nivel', 'iniciante'),
      acoes.adicionarExercicio('especifico', manchete),
      acoes.adicionarExercicio('aquecimento', deslocamento),
      acoes.adicionarExercicio('especifico', deslocamento),
      acoes.ajustarItem(1, 'series', 5),
      acoes.descerItem(1),
    );
    const corpo = estadoParaCorpo(estado);
    const exercicios = new Map(estado.itens.map((i) => [i.exercicio.id, i.exercicio]));
    const respostaDaApi = {
      data: {
        id: 1,
        ...corpo,
        duracao_estimada_minutos: 5,
        itens: corpo.itens.map(({ exercicio_id: exercicioId, ...resto }, i) => ({
          id: 100 + i,
          ...resto,
          exercicio: exercicios.get(exercicioId),
        })),
      },
    };
    const deVolta = respostaParaEstado(respostaDaApi);
    const semChave = (e) => e.itens.map((item) => ({ ...item, chave: null }));
    expect(semChave(deVolta)).toEqual(semChave(estado));
    expect(estadoParaCorpo(deVolta)).toEqual(corpo);
  });

  it('o estado vindo da resposta do rascunho passa na validação', () => {
    expect(validarTreino(respostaParaEstado(resposta))).toEqual({});
  });
});
