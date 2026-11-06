import { describe, expect, it } from 'vitest';
import { agruparPorDia, intervaloDaSemana, rotuloDaSemana, rotuloDoDia } from './semana.js';

describe('intervaloDaSemana', () => {
  it('vai da segunda ao domingo da semana da data', () => {
    expect(intervaloDaSemana('2026-11-11')).toEqual({ de: '2026-11-09', ate: '2026-11-15' });
    expect(intervaloDaSemana('2026-11-09')).toEqual({ de: '2026-11-09', ate: '2026-11-15' });
    expect(intervaloDaSemana('2026-11-15')).toEqual({ de: '2026-11-09', ate: '2026-11-15' });
  });
});

describe('rotuloDaSemana', () => {
  it('mesmo mes: "Semana de 9 a 15 de novembro"', () => {
    expect(rotuloDaSemana('2026-11-09', '2026-11-15')).toBe('Semana de 9 a 15 de novembro');
  });

  it('meses diferentes repetem o mes dos dois lados', () => {
    expect(rotuloDaSemana('2026-11-30', '2026-12-06')).toBe('Semana de 30 de novembro a 6 de dezembro');
  });

  it('anos diferentes incluem o ano', () => {
    expect(rotuloDaSemana('2026-12-28', '2027-01-03')).toBe('Semana de 28 de dezembro de 2026 a 3 de janeiro de 2027');
  });
});

describe('rotuloDoDia', () => {
  it('nome do dia e data curta', () => {
    expect(rotuloDoDia('2026-11-09')).toEqual({ nome: 'Segunda-feira', curta: '09/11' });
    expect(rotuloDoDia('2026-11-15')).toEqual({ nome: 'Domingo', curta: '15/11' });
  });
});

describe('agruparPorDia', () => {
  const item = (id, data) => ({
    id,
    data,
    hora: null,
    concluido: false,
    sessao_id: null,
    treino: { id: 1, nome: 'T' },
  });

  it('devolve os 7 dias a partir de "de", com os itens na ordem recebida', () => {
    const dias = agruparPorDia([item(1, '2026-11-09'), item(2, '2026-11-11'), item(3, '2026-11-11')], '2026-11-09');
    expect(dias).toHaveLength(7);
    expect(dias.map((dia) => dia.data)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);
    expect(dias[0].itens.map((i) => i.id)).toEqual([1]);
    expect(dias[1].itens).toEqual([]);
    expect(dias[2].itens.map((i) => i.id)).toEqual([2, 3]);
    expect(dias[0].nome).toBe('Segunda-feira');
    expect(dias[0].curta).toBe('09/11');
  });

  it('ignora item fora do intervalo e aceita lista vazia', () => {
    expect(agruparPorDia([item(1, '2026-11-16')], '2026-11-09').every((dia) => dia.itens.length === 0)).toBe(true);
    expect(agruparPorDia([], '2026-11-09')).toHaveLength(7);
  });
});
