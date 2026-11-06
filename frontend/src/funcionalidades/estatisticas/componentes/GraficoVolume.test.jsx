import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { ANO, MES, SEMANA, VAZIA } from '../../../testes/exemplosDeEstatisticas.js';
import GraficoVolume, { resumoDoVolume, rotuloCurto } from './GraficoVolume.jsx';

describe('rotuloCurto', () => {
  it('abrevia o inicio do balde conforme a granularidade', () => {
    expect(rotuloCurto('2026-11-02', 'dia')).toBe('Seg 02/11');
    expect(rotuloCurto('2026-11-08', 'dia')).toBe('Dom 08/11');
    expect(rotuloCurto('2026-10-12', 'semana')).toBe('12/10');
    expect(rotuloCurto('2026-11-01', 'mes')).toBe('nov/26');
  });
});

describe('resumoDoVolume', () => {
  it('descreve o total e o balde de maior volume', () => {
    expect(resumoDoVolume(SEMANA.volume)).toBe(
      'Total no período: 1 h 45 min. Maior volume em Quarta-feira, 04/11, com 1 h.',
    );
    expect(resumoDoVolume(MES.volume)).toBe(
      'Total no período: 4 h 50 min. Maior volume em 02/11 a 08/11, com 1 h 45 min.',
    );
  });

  it('sem volume diz so o total zerado', () => {
    expect(resumoDoVolume(VAZIA.volume)).toBe('Total no período: 0 min.');
  });
});

describe('GraficoVolume', () => {
  it('tem titulo, resumo em texto e o desenho fica fora da arvore de acessibilidade', () => {
    const { container } = render(<GraficoVolume volume={SEMANA.volume} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Volume de treino (min)' })).toBeInTheDocument();
    expect(screen.getByText(/Total no período: 1 h 45 min/)).toBeInTheDocument();
    const desenho = container.querySelector('[data-grafico="volume"]');
    expect(desenho).toHaveAttribute('aria-hidden', 'true');
    expect(desenho.querySelector('[tabindex="0"]')).toBeNull();
  });

  it('desenha um ponto por balde quando tem largura', () => {
    const { container } = render(<GraficoVolume volume={ANO.volume} />);
    const desenho = container.querySelector('[data-grafico="volume"]');
    expect(desenho.querySelectorAll('.recharts-line-dot')).toHaveLength(12);
  });

  it('nao tem violacoes de acessibilidade', async () => {
    const { container } = render(<GraficoVolume volume={SEMANA.volume} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
