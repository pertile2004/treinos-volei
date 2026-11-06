import { describe, expect, it } from 'vitest';
import {
  SEM_DADOS,
  formatarCronometro,
  formatarDuracao,
  formatarMinutos,
  formatarPercentual,
  formatarPercentualDeAcerto,
  iniciais,
  primeiroNome,
  saudacao,
} from './formatos.js';

describe('primeiroNome', () => {
  it('pega a primeira palavra do nome', () => {
    expect(primeiroNome('Guto Silva')).toBe('Guto');
    expect(primeiroNome('Guto')).toBe('Guto');
  });

  it('tolera espaços extras', () => {
    expect(primeiroNome('   Ana   Maria  de Souza ')).toBe('Ana');
  });

  it('devolve vazio quando não há nome', () => {
    expect(primeiroNome('')).toBe('');
    expect(primeiroNome('    ')).toBe('');
    expect(primeiroNome(null)).toBe('');
    expect(primeiroNome(undefined)).toBe('');
  });
});

describe('saudacao', () => {
  it('monta "Fala, <primeiro nome>!"', () => {
    expect(saudacao('Guto Silva')).toBe('Fala, Guto!');
    expect(saudacao('  Maria  Clara ')).toBe('Fala, Maria!');
  });

  it('sem nome não deixa vírgula solta', () => {
    expect(saudacao('')).toBe('Fala!');
    expect(saudacao(undefined)).toBe('Fala!');
  });
});

describe('iniciais', () => {
  it('usa a primeira letra do primeiro e do último nome', () => {
    expect(iniciais('Guto Silva')).toBe('GS');
    expect(iniciais('Ana Maria de Souza')).toBe('AS');
  });

  it('nome de uma palavra tem uma inicial', () => {
    expect(iniciais('Guto')).toBe('G');
  });

  it('tolera espaços extras no começo, no meio e no fim', () => {
    expect(iniciais('  guto    silva  ')).toBe('GS');
    expect(iniciais('\tGuto\n')).toBe('G');
  });

  it('põe em maiúscula, inclusive letra acentuada', () => {
    expect(iniciais('érica álvares')).toBe('ÉÁ');
  });

  it('nunca passa de 2 letras', () => {
    expect(iniciais('João Pedro da Silva Santos')).toBe('JS');
  });

  it('devolve vazio quando não há nome', () => {
    expect(iniciais('')).toBe('');
    expect(iniciais('   ')).toBe('');
    expect(iniciais(null)).toBe('');
  });
});

describe('formatarMinutos', () => {
  it('abaixo de 1 hora mostra só minutos', () => {
    expect(formatarMinutos(45)).toBe('45 min');
    expect(formatarMinutos(0)).toBe('0 min');
    expect(formatarMinutos(59)).toBe('59 min');
  });

  it('a partir de 1 hora mostra horas e minutos com 2 dígitos', () => {
    expect(formatarMinutos(65)).toBe('1 h 05 min');
    expect(formatarMinutos(75)).toBe('1 h 15 min');
    expect(formatarMinutos(135)).toBe('2 h 15 min');
  });

  it('hora cheia não mostra "00 min"', () => {
    expect(formatarMinutos(60)).toBe('1 h');
    expect(formatarMinutos(120)).toBe('2 h');
  });

  it('arredonda fração de minuto', () => {
    expect(formatarMinutos(44.6)).toBe('45 min');
    expect(formatarMinutos(59.5)).toBe('1 h');
  });

  it('valor ausente, negativo ou inválido vira 0 min', () => {
    expect(formatarMinutos(null)).toBe('0 min');
    expect(formatarMinutos(undefined)).toBe('0 min');
    expect(formatarMinutos(-5)).toBe('0 min');
    expect(formatarMinutos(Number.NaN)).toBe('0 min');
  });
});

describe('formatarDuracao', () => {
  it('recebe segundos e arredonda para minutos, como o servidor', () => {
    expect(formatarDuracao(2700)).toBe('45 min');
    expect(formatarDuracao(3900)).toBe('1 h 05 min');
    expect(formatarDuracao(3600)).toBe('1 h');
    expect(formatarDuracao(2729)).toBe('45 min');
    expect(formatarDuracao(2730)).toBe('46 min');
  });

  it('valor ausente ou inválido vira 0 min', () => {
    expect(formatarDuracao(0)).toBe('0 min');
    expect(formatarDuracao(null)).toBe('0 min');
    expect(formatarDuracao(-10)).toBe('0 min');
  });
});

describe('formatarCronometro', () => {
  it('mostra mm:ss com 2 dígitos', () => {
    expect(formatarCronometro(0)).toBe('00:00');
    expect(formatarCronometro(5)).toBe('00:05');
    expect(formatarCronometro(65)).toBe('01:05');
    expect(formatarCronometro(599)).toBe('09:59');
    expect(formatarCronometro(3599)).toBe('59:59');
  });

  it('a partir de 1 hora mostra h:mm:ss', () => {
    expect(formatarCronometro(3600)).toBe('1:00:00');
    expect(formatarCronometro(4530)).toBe('1:15:30');
    expect(formatarCronometro(36065)).toBe('10:01:05');
  });

  it('despreza a fração de segundo (não adianta o relógio)', () => {
    expect(formatarCronometro(59.9)).toBe('00:59');
  });

  it('valor ausente, negativo ou inválido vira 00:00', () => {
    expect(formatarCronometro(null)).toBe('00:00');
    expect(formatarCronometro(-1)).toBe('00:00');
    expect(formatarCronometro(Number.NaN)).toBe('00:00');
  });
});

describe('formatarPercentual', () => {
  it('null vira "sem dados", nunca 0%', () => {
    expect(SEM_DADOS).toBe('sem dados');
    expect(formatarPercentual(null)).toBe('sem dados');
    expect(formatarPercentual(undefined)).toBe('sem dados');
    expect(formatarPercentual(Number.NaN)).toBe('sem dados');
  });

  it('número inteiro sem casa decimal', () => {
    expect(formatarPercentual(70.0)).toBe('70%');
    expect(formatarPercentual(100)).toBe('100%');
  });

  it('zero de verdade é 0%', () => {
    expect(formatarPercentual(0)).toBe('0%');
  });

  it('1 casa decimal com vírgula', () => {
    expect(formatarPercentual(66.7)).toBe('66,7%');
    expect(formatarPercentual(33.33)).toBe('33,3%');
  });
});

describe('formatarPercentualDeAcerto', () => {
  it('42 acertos e 18 erros = 70%', () => {
    expect(formatarPercentualDeAcerto(42, 18)).toBe('70%');
  });

  it('15 acertos e 5 erros = 75%', () => {
    expect(formatarPercentualDeAcerto(15, 5)).toBe('75%');
  });

  it('sem tentativas devolve "sem dados", nunca 0%', () => {
    expect(formatarPercentualDeAcerto(0, 0)).toBe('sem dados');
    expect(formatarPercentualDeAcerto(null, null)).toBe('sem dados');
    expect(formatarPercentualDeAcerto(undefined, undefined)).toBe('sem dados');
    expect(formatarPercentualDeAcerto(0, 0)).not.toContain('0%');
  });

  it('só erros é 0% de verdade (diferente de sem dados)', () => {
    expect(formatarPercentualDeAcerto(0, 7)).toBe('0%');
  });

  it('só acertos é 100%', () => {
    expect(formatarPercentualDeAcerto(9, 0)).toBe('100%');
    expect(formatarPercentualDeAcerto(9, null)).toBe('100%');
  });

  it('arredonda para 1 casa decimal', () => {
    expect(formatarPercentualDeAcerto(2, 1)).toBe('66,7%');
    expect(formatarPercentualDeAcerto(1, 2)).toBe('33,3%');
  });

  it('contagem negativa ou inválida vira "sem dados"', () => {
    expect(formatarPercentualDeAcerto(-1, 5)).toBe('sem dados');
    expect(formatarPercentualDeAcerto(Number.NaN, 5)).toBe('sem dados');
    expect(formatarPercentualDeAcerto('abc', 5)).toBe('sem dados');
  });
});
