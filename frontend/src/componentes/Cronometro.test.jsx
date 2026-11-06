import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import Cronometro from './Cronometro.jsx';

const relogio = () => screen.getByRole('timer', { name: 'Tempo de treino' });
const anuncio = (container) => container.querySelector('[aria-live="polite"]');

describe('Cronometro', () => {
  it.each([
    [0, '00:00'],
    [59, '00:59'],
    [60, '01:00'],
    [754, '12:34'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3661, '1:01:01'],
    [59.9, '00:59'],
    [-5, '00:00'],
  ])('formata %s segundos como %s', (segundos, texto) => {
    render(<Cronometro rotulo="Tempo de treino" segundos={segundos} />);
    expect(relogio().textContent).toBe(texto);
  });

  it('segundos ausentes ou invalidos viram 00:00', () => {
    const { rerender } = render(<Cronometro rotulo="Tempo de treino" />);
    expect(relogio().textContent).toBe('00:00');
    rerender(<Cronometro rotulo="Tempo de treino" segundos={Number.NaN} />);
    expect(relogio().textContent).toBe('00:00');
  });

  it('o relogio tem role timer com o rotulo e nao e anunciado a cada segundo (aria-live off)', () => {
    render(<Cronometro rotulo="Tempo de treino" segundos={75} />);
    expect(relogio()).toHaveAttribute('aria-live', 'off');
    expect(relogio()).toHaveClass('tabular-nums');
  });

  it('tem uma regiao aria-live educada, fora da vista e fora do relogio, com o tempo em minutos', () => {
    const { container } = render(<Cronometro rotulo="Tempo de treino" segundos={125} />);
    expect(anuncio(container)).toHaveAttribute('aria-atomic', 'true');
    expect(anuncio(container)).toHaveClass('sr-only');
    expect(anuncio(container).textContent).toBe('Tempo de treino: 2 minutos');
    expect(relogio()).not.toContainElement(anuncio(container));
  });

  it.each([
    [0, 'menos de 1 minuto'],
    [59, 'menos de 1 minuto'],
    [60, '1 minuto'],
    [119, '1 minuto'],
    [120, '2 minutos'],
    [3600, '1 hora'],
    [3660, '1 hora e 1 minuto'],
    [7325, '2 horas e 2 minutos'],
  ])('aos %s segundos o anuncio diz "%s"', (segundos, texto) => {
    const { container } = render(<Cronometro rotulo="Descanso" segundos={segundos} />);
    expect(anuncio(container).textContent).toBe(`Descanso: ${texto}`);
  });

  it('a regiao educada so muda quando o minuto muda, nao a cada segundo', () => {
    const { container, rerender } = render(<Cronometro rotulo="Tempo de treino" segundos={58} />);
    const mudancas = [];
    const observador = new MutationObserver((registros) => mudancas.push(...registros));
    observador.observe(anuncio(container), { childList: true, characterData: true, subtree: true });
    const mudancasAte = (segundos) => {
      rerender(<Cronometro rotulo="Tempo de treino" segundos={segundos} />);
      mudancas.push(...observador.takeRecords());
      return mudancas.length;
    };

    expect(mudancasAte(59)).toBe(0);
    expect(relogio().textContent).toBe('00:59');
    expect(mudancasAte(60)).toBeGreaterThan(0);
    expect(anuncio(container).textContent).toBe('Tempo de treino: 1 minuto');

    const depoisDoMinuto = mudancas.length;
    for (let segundos = 61; segundos <= 119; segundos += 1) {
      expect(mudancasAte(segundos)).toBe(depoisDoMinuto);
    }
    expect(relogio().textContent).toBe('01:59');
    expect(mudancasAte(120)).toBeGreaterThan(depoisDoMinuto);
    expect(anuncio(container).textContent).toBe('Tempo de treino: 2 minutos');
    observador.disconnect();
  });

  it('tambem anuncia por minuto em contagem regressiva', () => {
    const { container, rerender } = render(<Cronometro rotulo="Descanso" segundos={61} />);
    expect(anuncio(container).textContent).toBe('Descanso: 1 minuto');
    rerender(<Cronometro rotulo="Descanso" segundos={59} />);
    expect(anuncio(container).textContent).toBe('Descanso: menos de 1 minuto');
  });

  it('o tamanho padrao e o grande; o medio usa a fonte menor', () => {
    const { rerender } = render(<Cronometro rotulo="Tempo de treino" segundos={10} />);
    expect(relogio()).toHaveClass('text-cronometro');
    rerender(<Cronometro rotulo="Tempo de treino" segundos={10} tamanho="medio" />);
    expect(relogio()).toHaveClass('text-2xl');
    expect(relogio()).not.toHaveClass('text-cronometro');
  });

  it('aceita className e repassa as demais props ao elemento raiz', () => {
    render(<Cronometro rotulo="Tempo de treino" segundos={10} className="mt-4" data-testid="raiz" />);
    const raiz = screen.getByTestId('raiz');
    expect(raiz).toHaveClass('mt-4');
    expect(raiz).toContainElement(relogio());
  });

  it.each([
    ['grande', { segundos: 754 }],
    ['medio', { segundos: 45, tamanho: 'medio' }],
    ['com horas', { segundos: 3725 }],
  ])('nao tem violacoes de acessibilidade (%s)', async (_nome, props) => {
    const { container } = render(<Cronometro rotulo="Tempo de treino" {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
