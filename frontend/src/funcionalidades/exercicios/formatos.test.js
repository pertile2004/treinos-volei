import { describe, expect, it } from 'vitest';
import { formatarDuracao, resumirPadroes, resumirResultado } from './formatos.js';

describe('formatarDuracao', () => {
  it.each([
    [30, '30 s'],
    [45, '45 s'],
    [60, '1 min'],
    [90, '1 min 30 s'],
    [600, '10 min'],
    [3600, '60 min'],
  ])('%i segundos vira "%s"', (segundos, esperado) => {
    expect(formatarDuracao(segundos)).toBe(esperado);
  });

  it.each([[0], [null], [undefined], [-5], ['abc']])('devolve null para %s', (valor) => {
    expect(formatarDuracao(valor)).toBeNull();
  });
});

describe('resumirPadroes', () => {
  it('com repeticoes mostra series x repeticoes', () => {
    expect(resumirPadroes({ series_padrao: 3, repeticoes_padrao: 15, duracao_segundos_padrao: null })).toBe('3 × 15');
  });

  it('com duracao mostra series x tempo', () => {
    expect(resumirPadroes({ series_padrao: 4, repeticoes_padrao: null, duracao_segundos_padrao: 30 })).toBe('4 × 30 s');
    expect(resumirPadroes({ series_padrao: 2, repeticoes_padrao: null, duracao_segundos_padrao: 90 })).toBe(
      '2 × 1 min 30 s',
    );
  });

  it('com os dois preenchidos as repeticoes vencem', () => {
    expect(resumirPadroes({ series_padrao: 3, repeticoes_padrao: 10, duracao_segundos_padrao: 30 })).toBe('3 × 10');
  });

  it('so com series mostra a quantidade de series', () => {
    expect(resumirPadroes({ series_padrao: 1, repeticoes_padrao: null, duracao_segundos_padrao: null })).toBe(
      '1 série',
    );
    expect(resumirPadroes({ series_padrao: 3 })).toBe('3 séries');
  });
});

describe('resumirResultado', () => {
  it('concorda em numero', () => {
    expect(resumirResultado(0)).toBe('Nenhum exercício encontrado');
    expect(resumirResultado(1)).toBe('1 exercício encontrado');
    expect(resumirResultado(12)).toBe('12 exercícios encontrados');
  });
});
