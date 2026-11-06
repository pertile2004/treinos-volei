import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { SEMANA, VAZIA } from '../../../testes/exemplosDeEstatisticas.js';
import CartaoFrequencia from './CartaoFrequencia.jsx';

describe('CartaoFrequencia', () => {
  it('mostra os dias treinados contra a meta em texto e na barra', () => {
    render(<CartaoFrequencia frequencia={SEMANA.frequencia} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Frequência' })).toBeInTheDocument();
    expect(screen.getByText('2 de 3 dias nesta semana')).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Dias treinados nesta semana' });
    expect(barra).toHaveAttribute('aria-valuenow', '2');
    expect(barra).toHaveAttribute('aria-valuemax', '3');
  });

  it('semana sem treino mostra 0 de 3 (zero de frequencia e dado real)', () => {
    render(<CartaoFrequencia frequencia={VAZIA.frequencia} />);
    expect(screen.getByText('0 de 3 dias nesta semana')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('meta alcancada ou superada nao passa de 100%', () => {
    render(<CartaoFrequencia frequencia={{ ...SEMANA.frequencia, dias_treinados: 4, meta: 3 }} />);
    expect(screen.getByText('4 de 3 dias nesta semana')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '100%');
  });

  it('nao tem violacoes de acessibilidade', async () => {
    const { container } = render(<CartaoFrequencia frequencia={SEMANA.frequencia} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
