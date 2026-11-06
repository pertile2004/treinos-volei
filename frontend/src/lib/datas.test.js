import { describe, expect, it } from 'vitest';
import { FUSO, dataLocal, diasDaSemana, formatarHojePorExtenso, inicioDaSemana, somarDias } from './datas.js';

// São Paulo está em UTC-3 o ano todo (sem horário de verão desde 2019).
const QUINTA_MEIO_DIA = new Date('2026-10-15T15:00:00Z'); // 15/10/2026 12:00 em SP
const SEXTA_MEIO_DIA = new Date('2026-11-06T15:00:00Z'); // 06/11/2026 12:00 em SP

describe('FUSO', () => {
  it('é America/Sao_Paulo', () => {
    expect(FUSO).toBe('America/Sao_Paulo');
  });
});

describe('dataLocal', () => {
  it('devolve a data de São Paulo em AAAA-MM-DD', () => {
    expect(dataLocal(QUINTA_MEIO_DIA)).toBe('2026-10-15');
  });

  it('perto da meia-noite usa o dia de São Paulo, não o de UTC', () => {
    expect(dataLocal(new Date('2026-10-16T01:30:00Z'))).toBe('2026-10-15'); // 22h30 em SP
    expect(dataLocal(new Date('2026-10-16T02:59:59Z'))).toBe('2026-10-15'); // 23h59min59 em SP
    expect(dataLocal(new Date('2026-10-16T03:00:00Z'))).toBe('2026-10-16'); // 00h00 em SP
  });

  it('na virada de ano continua no ano anterior até a meia-noite de São Paulo', () => {
    expect(dataLocal(new Date('2026-01-01T02:00:00Z'))).toBe('2025-12-31'); // 23h em SP
    expect(dataLocal(new Date('2026-01-01T03:00:00Z'))).toBe('2026-01-01');
  });

  it('aceita carimbo em milissegundos', () => {
    expect(dataLocal(QUINTA_MEIO_DIA.getTime())).toBe('2026-10-15');
  });

  it('recusa data inválida', () => {
    expect(() => dataLocal(new Date('nada'))).toThrow(TypeError);
    expect(() => dataLocal(undefined)).toThrow(TypeError);
  });
});

describe('somarDias', () => {
  it('soma e subtrai dias de calendário', () => {
    expect(somarDias('2026-11-02', 6)).toBe('2026-11-08');
    expect(somarDias('2026-11-02', -1)).toBe('2026-11-01');
  });

  it('atravessa mês, ano e 29 de fevereiro', () => {
    expect(somarDias('2026-12-28', 6)).toBe('2027-01-03');
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(somarDias('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('recusa texto que não é data', () => {
    expect(() => somarDias('06/11/2026', 1)).toThrow(TypeError);
    expect(() => somarDias('2026-02-30', 1)).toThrow(TypeError);
  });
});

describe('inicioDaSemana', () => {
  it('devolve a segunda-feira da semana de uma data qualquer', () => {
    expect(inicioDaSemana(SEXTA_MEIO_DIA)).toBe('2026-11-02');
    expect(inicioDaSemana(QUINTA_MEIO_DIA)).toBe('2026-10-12');
  });

  it('segunda-feira é o início da própria semana', () => {
    expect(inicioDaSemana('2026-11-02')).toBe('2026-11-02');
  });

  it('domingo pertence à semana que começou na segunda anterior', () => {
    expect(inicioDaSemana('2026-11-08')).toBe('2026-11-02');
  });

  it('aceita data local em texto (AAAA-MM-DD) sem aplicar fuso', () => {
    expect(inicioDaSemana('2026-11-04')).toBe('2026-11-02');
  });

  it('virada de semana: domingo 23h50 em SP ainda é a semana anterior; segunda 00h10 já é a nova', () => {
    expect(inicioDaSemana(new Date('2026-11-09T02:50:00Z'))).toBe('2026-11-02'); // dom 08/11 23h50 SP
    expect(inicioDaSemana(new Date('2026-11-09T03:10:00Z'))).toBe('2026-11-09'); // seg 09/11 00h10 SP
  });

  it('virada de ano: a semana de 1º de janeiro começa em dezembro', () => {
    expect(inicioDaSemana(new Date('2027-01-01T15:00:00Z'))).toBe('2026-12-28'); // sexta 01/01/2027
    expect(inicioDaSemana(new Date('2026-01-01T02:00:00Z'))).toBe('2025-12-29'); // quarta 31/12/2025 23h SP
  });

  it('virada de mês: a semana começa no mês anterior', () => {
    expect(inicioDaSemana('2026-11-01')).toBe('2026-10-26'); // domingo 01/11
  });
});

describe('diasDaSemana', () => {
  it('devolve os 7 dias a partir da segunda, com as iniciais S T Q Q S S D', () => {
    const dias = diasDaSemana(SEXTA_MEIO_DIA);
    expect(dias).toHaveLength(7);
    expect(dias.map((dia) => dia.inicial)).toEqual(['S', 'T', 'Q', 'Q', 'S', 'S', 'D']);
    expect(dias.map((dia) => dia.data)).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
  });

  it('traz o nome completo de cada dia para distinguir os dois Q e os dois S', () => {
    expect(diasDaSemana(SEXTA_MEIO_DIA).map((dia) => dia.nome)).toEqual([
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
      'Domingo',
    ]);
  });

  it('marca só o dia de hoje', () => {
    const dias = diasDaSemana(SEXTA_MEIO_DIA);
    expect(dias.filter((dia) => dia.hoje).map((dia) => dia.data)).toEqual(['2026-11-06']);
  });

  it('marca os dias treinados a partir das datas do servidor (frequencia.datas)', () => {
    const dias = diasDaSemana(SEXTA_MEIO_DIA, ['2026-11-02', '2026-11-04']);
    expect(dias.map((dia) => dia.treinou)).toEqual([true, false, true, false, false, false, false]);
  });

  it('sem datas treinadas nenhum dia fica marcado', () => {
    expect(diasDaSemana(SEXTA_MEIO_DIA).every((dia) => dia.treinou === false)).toBe(true);
    expect(diasDaSemana(SEXTA_MEIO_DIA, null).every((dia) => dia.treinou === false)).toBe(true);
  });

  it('ignora datas treinadas de outra semana', () => {
    const dias = diasDaSemana(SEXTA_MEIO_DIA, ['2026-10-30', '2026-11-09']);
    expect(dias.some((dia) => dia.treinou)).toBe(false);
  });

  it('domingo 23h50 em SP: hoje é o último dia da semana', () => {
    const dias = diasDaSemana(new Date('2026-11-09T02:50:00Z'));
    expect(dias[0].data).toBe('2026-11-02');
    expect(dias[6]).toMatchObject({ data: '2026-11-08', inicial: 'D', hoje: true });
  });

  it('segunda 00h10 em SP: hoje é o primeiro dia da semana nova', () => {
    const dias = diasDaSemana(new Date('2026-11-09T03:10:00Z'));
    expect(dias[0]).toMatchObject({ data: '2026-11-09', inicial: 'S', hoje: true });
    expect(dias[6].data).toBe('2026-11-15');
  });

  it('virada de ano: a semana mistura dezembro e janeiro', () => {
    const dias = diasDaSemana(new Date('2027-01-01T15:00:00Z'), ['2026-12-28', '2027-01-01']);
    expect(dias.map((dia) => dia.data)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
    expect(dias[4]).toMatchObject({ nome: 'Sexta-feira', hoje: true, treinou: true });
    expect(dias[0].treinou).toBe(true);
  });
});

describe('formatarHojePorExtenso', () => {
  it('mostra "Hoje, 15 de outubro" com o mês em minúscula', () => {
    expect(formatarHojePorExtenso(QUINTA_MEIO_DIA)).toBe('Hoje, 15 de outubro');
  });

  it('virada de fuso: 01h30 UTC do dia 16 ainda é 15 de outubro em São Paulo', () => {
    expect(formatarHojePorExtenso(new Date('2026-10-16T01:30:00Z'))).toBe('Hoje, 15 de outubro');
  });

  it('à meia-noite de São Paulo o dia muda', () => {
    expect(formatarHojePorExtenso(new Date('2026-10-16T03:00:00Z'))).toBe('Hoje, 16 de outubro');
  });

  it('dia sem zero à esquerda e mês com acento', () => {
    expect(formatarHojePorExtenso(new Date('2026-03-05T15:00:00Z'))).toBe('Hoje, 5 de março');
  });

  it('virada de ano: 23h de 31 de dezembro em São Paulo', () => {
    expect(formatarHojePorExtenso(new Date('2026-01-01T02:00:00Z'))).toBe('Hoje, 31 de dezembro');
    expect(formatarHojePorExtenso(new Date('2026-01-01T03:00:00Z'))).toBe('Hoje, 1 de janeiro');
  });
});
