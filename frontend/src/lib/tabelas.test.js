import { describe, expect, it } from 'vitest';
import { linhasDeDesempenho, linhasDeVolume, rotuloDoPeriodo } from './tabelas.js';

// Conteúdo de "data" na resposta de GET /api/v1/estatisticas?periodo=semana (rascunho do PR-19).
const SEMANA = {
  periodo: 'semana',
  fuso: 'America/Sao_Paulo',
  inicio: '2026-11-02',
  fim: '2026-11-08',
  volume: {
    granularidade: 'dia',
    total_minutos: 105,
    pontos: [
      { inicio: '2026-11-02', minutos: 45 },
      { inicio: '2026-11-03', minutos: 0 },
      { inicio: '2026-11-04', minutos: 60 },
      { inicio: '2026-11-05', minutos: 0 },
      { inicio: '2026-11-06', minutos: 0 },
      { inicio: '2026-11-07', minutos: 0 },
      { inicio: '2026-11-08', minutos: 0 },
    ],
  },
  desempenho: [
    { fundamento: 'recepcao', acertos: 42, erros: 18, tentativas: 60, percentual: 70.0 },
    { fundamento: 'levantamento', acertos: 0, erros: 0, tentativas: 0, percentual: null },
    { fundamento: 'ataque', acertos: 0, erros: 0, tentativas: 0, percentual: null },
    { fundamento: 'saque', acertos: 15, erros: 5, tentativas: 20, percentual: 75.0 },
    { fundamento: 'bloqueio', acertos: 0, erros: 7, tentativas: 7, percentual: 0.0 },
    { fundamento: 'defesa', acertos: 2, erros: 1, tentativas: 3, percentual: 66.7 },
    { fundamento: 'preparo_fisico', acertos: 0, erros: 0, tentativas: 0, percentual: null },
  ],
  frequencia: {
    semana_inicio: '2026-11-02',
    semana_fim: '2026-11-08',
    dias_treinados: 2,
    meta: 3,
    datas: ['2026-11-02', '2026-11-04'],
  },
};

const ROTULOS = {
  recepcao: 'Recepção',
  levantamento: 'Levantamento',
  ataque: 'Ataque',
  saque: 'Saque',
  bloqueio: 'Bloqueio',
  defesa: 'Defesa',
  preparo_fisico: 'Preparo físico',
};

describe('rotuloDoPeriodo', () => {
  it('dia: nome do dia e data', () => {
    expect(rotuloDoPeriodo('2026-11-02', 'dia')).toBe('Segunda-feira, 02/11');
    expect(rotuloDoPeriodo('2026-11-08', 'dia')).toBe('Domingo, 08/11');
  });

  it('semana: de segunda a domingo', () => {
    expect(rotuloDoPeriodo('2026-11-02', 'semana')).toBe('02/11 a 08/11');
  });

  it('semana que atravessa o ano', () => {
    expect(rotuloDoPeriodo('2026-12-28', 'semana')).toBe('28/12 a 03/01');
  });

  it('mes: nome do mês em minúscula e ano', () => {
    expect(rotuloDoPeriodo('2026-11-01', 'mes')).toBe('novembro de 2026');
    expect(rotuloDoPeriodo('2026-03-01', 'mes')).toBe('março de 2026');
    expect(rotuloDoPeriodo('2027-01-01', 'mes')).toBe('janeiro de 2027');
  });

  it('recusa granularidade desconhecida', () => {
    expect(() => rotuloDoPeriodo('2026-11-02', 'hora')).toThrow(TypeError);
  });
});

describe('linhasDeVolume', () => {
  it('uma linha por ponto, na ordem recebida, com os mesmos minutos do gráfico', () => {
    const linhas = linhasDeVolume(SEMANA);
    expect(linhas).toHaveLength(7);
    expect(linhas[0]).toEqual({ chave: '2026-11-02', periodo: 'Segunda-feira, 02/11', minutos: 45 });
    expect(linhas[2]).toEqual({ chave: '2026-11-04', periodo: 'Quarta-feira, 04/11', minutos: 60 });
    expect(linhas.map((linha) => linha.minutos)).toEqual([45, 0, 60, 0, 0, 0, 0]);
  });

  it('a soma das linhas bate com total_minutos', () => {
    const soma = linhasDeVolume(SEMANA).reduce((total, linha) => total + linha.minutos, 0);
    expect(soma).toBe(SEMANA.volume.total_minutos);
  });

  it('zero de volume é dado real e continua 0', () => {
    expect(linhasDeVolume(SEMANA)[1].minutos).toBe(0);
  });

  it('granularidade semana (períodos mes e 3meses)', () => {
    const estatisticas = {
      volume: {
        granularidade: 'semana',
        total_minutos: 90,
        pontos: [
          { inicio: '2026-12-21', minutos: 30 },
          { inicio: '2026-12-28', minutos: 60 },
        ],
      },
    };
    expect(linhasDeVolume(estatisticas)).toEqual([
      { chave: '2026-12-21', periodo: '21/12 a 27/12', minutos: 30 },
      { chave: '2026-12-28', periodo: '28/12 a 03/01', minutos: 60 },
    ]);
  });

  it('granularidade mes (período ano), atravessando o ano', () => {
    const estatisticas = {
      volume: {
        granularidade: 'mes',
        total_minutos: 300,
        pontos: [
          { inicio: '2025-12-01', minutos: 120 },
          { inicio: '2026-01-01', minutos: 180 },
        ],
      },
    };
    expect(linhasDeVolume(estatisticas)).toEqual([
      { chave: '2025-12-01', periodo: 'dezembro de 2025', minutos: 120 },
      { chave: '2026-01-01', periodo: 'janeiro de 2026', minutos: 180 },
    ]);
  });

  it('sem resposta ou sem pontos devolve lista vazia', () => {
    expect(linhasDeVolume(undefined)).toEqual([]);
    expect(linhasDeVolume(null)).toEqual([]);
    expect(linhasDeVolume({})).toEqual([]);
    expect(linhasDeVolume({ volume: { granularidade: 'dia', pontos: [] } })).toEqual([]);
  });

  it('não altera a resposta recebida', () => {
    const copia = structuredClone(SEMANA);
    linhasDeVolume(SEMANA);
    expect(SEMANA).toEqual(copia);
  });
});

describe('linhasDeDesempenho', () => {
  it('uma linha por fundamento, na ordem do servidor, com o rótulo de /referencias', () => {
    const linhas = linhasDeDesempenho(SEMANA, ROTULOS);
    expect(linhas.map((linha) => linha.fundamento)).toEqual([
      'Recepção',
      'Levantamento',
      'Ataque',
      'Saque',
      'Bloqueio',
      'Defesa',
      'Preparo físico',
    ]);
    expect(linhas[0]).toEqual({ chave: 'recepcao', fundamento: 'Recepção', acertos: 42, erros: 18, percentual: '70%' });
    expect(linhas[3]).toEqual({ chave: 'saque', fundamento: 'Saque', acertos: 15, erros: 5, percentual: '75%' });
  });

  it('fundamento sem tentativas mostra "sem dados" e nunca 0%', () => {
    const linhas = linhasDeDesempenho(SEMANA, ROTULOS);
    const semTentativas = linhas.filter((linha) => ['levantamento', 'ataque', 'preparo_fisico'].includes(linha.chave));
    expect(semTentativas).toHaveLength(3);
    semTentativas.forEach((linha) => {
      expect(linha.percentual).toBe('sem dados');
      expect(linha.acertos).toBe(0);
      expect(linha.erros).toBe(0);
    });
  });

  it('fundamento só com erros mostra 0% (zero real)', () => {
    const bloqueio = linhasDeDesempenho(SEMANA, ROTULOS).find((linha) => linha.chave === 'bloqueio');
    expect(bloqueio.percentual).toBe('0%');
  });

  it('percentual com casa decimal usa vírgula', () => {
    const defesa = linhasDeDesempenho(SEMANA, ROTULOS).find((linha) => linha.chave === 'defesa');
    expect(defesa.percentual).toBe('66,7%');
  });

  it('sem tentativas é "sem dados" mesmo que o percentual venha 0 por engano', () => {
    const estatisticas = { desempenho: [{ fundamento: 'saque', acertos: 0, erros: 0, tentativas: 0, percentual: 0 }] };
    expect(linhasDeDesempenho(estatisticas, ROTULOS)[0].percentual).toBe('sem dados');
  });

  it('calcula o percentual quando o campo não vem na resposta', () => {
    const estatisticas = { desempenho: [{ fundamento: 'saque', acertos: 15, erros: 5 }] };
    expect(linhasDeDesempenho(estatisticas, ROTULOS)[0].percentual).toBe('75%');
  });

  it('sem rótulo conhecido usa o código do fundamento', () => {
    expect(linhasDeDesempenho(SEMANA)[0].fundamento).toBe('recepcao');
    expect(linhasDeDesempenho(SEMANA, { saque: 'Saque' })[0].fundamento).toBe('recepcao');
  });

  it('sem resposta ou sem desempenho devolve lista vazia', () => {
    expect(linhasDeDesempenho(undefined)).toEqual([]);
    expect(linhasDeDesempenho(null, ROTULOS)).toEqual([]);
    expect(linhasDeDesempenho({}, ROTULOS)).toEqual([]);
  });
});
