import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import BarraDeProgresso from './BarraDeProgresso.jsx';

const barra = () => screen.getByRole('progressbar', { name: 'Progresso do treino' });
const preenchimento = (container) => container.querySelector('[data-preenchimento]');

describe('BarraDeProgresso', () => {
  it('tem role progressbar com rotulo e valores aria, e mostra o rotulo e o percentual', () => {
    const { container } = render(<BarraDeProgresso rotulo="Progresso do treino" valor={45} />);
    expect(barra()).toHaveAttribute('aria-valuenow', '45');
    expect(barra()).toHaveAttribute('aria-valuemin', '0');
    expect(barra()).toHaveAttribute('aria-valuemax', '100');
    expect(barra()).toHaveAttribute('aria-valuetext', '45%');
    expect(screen.getByText('Progresso do treino')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(preenchimento(container)).toHaveStyle({ width: '45%' });
  });

  it('usa o max informado e calcula o percentual sobre ele', () => {
    const { container } = render(<BarraDeProgresso rotulo="Progresso do treino" valor={3} max={5} />);
    expect(barra()).toHaveAttribute('aria-valuenow', '3');
    expect(barra()).toHaveAttribute('aria-valuemax', '5');
    expect(barra()).toHaveAttribute('aria-valuetext', '60%');
    expect(preenchimento(container)).toHaveStyle({ width: '60%' });
  });

  it('limita o valor entre 0 e max', () => {
    const { container, rerender } = render(<BarraDeProgresso rotulo="Progresso do treino" valor={-5} />);
    expect(barra()).toHaveAttribute('aria-valuenow', '0');
    expect(preenchimento(container)).toHaveStyle({ width: '0%' });
    rerender(<BarraDeProgresso rotulo="Progresso do treino" valor={150} />);
    expect(barra()).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(preenchimento(container)).toHaveStyle({ width: '100%' });
  });

  it('max invalido (zero ou negativo) cai no padrao 100 em vez de dividir por zero', () => {
    render(<BarraDeProgresso rotulo="Progresso do treino" valor={50} max={0} />);
    expect(barra()).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('completa mostra 100%', () => {
    render(<BarraDeProgresso rotulo="Progresso do treino" valor={8} max={8} />);
    expect(barra()).toHaveAttribute('aria-valuenow', '8');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('valor nulo mostra "Sem dados", nunca 0% (RN-02)', () => {
    const { container } = render(<BarraDeProgresso rotulo="Progresso do treino" valor={null} />);
    expect(barra()).not.toHaveAttribute('aria-valuenow');
    expect(barra()).toHaveAttribute('aria-valuetext', 'Sem dados');
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(preenchimento(container)).not.toBeInTheDocument();
  });

  it('valor ausente ou que nao e numero tambem e "Sem dados"', () => {
    const { rerender } = render(<BarraDeProgresso rotulo="Progresso do treino" />);
    expect(barra()).toHaveAttribute('aria-valuetext', 'Sem dados');
    rerender(<BarraDeProgresso rotulo="Progresso do treino" valor={Number.NaN} />);
    expect(barra()).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('mostrarTexto={false} esconde o rotulo e o percentual visiveis, mas mantem o aria', () => {
    render(<BarraDeProgresso rotulo="Progresso do treino" valor={45} mostrarTexto={false} />);
    expect(barra()).toHaveAttribute('aria-valuenow', '45');
    expect(screen.queryByText('Progresso do treino')).not.toBeInTheDocument();
    expect(screen.queryByText('45%')).not.toBeInTheDocument();
  });

  it('mostrarTexto={false} com valor nulo continua mostrando "Sem dados"', () => {
    render(<BarraDeProgresso rotulo="Progresso do treino" valor={null} mostrarTexto={false} />);
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('aceita className e repassa as demais props ao elemento raiz', () => {
    render(
      <BarraDeProgresso
        rotulo="Progresso do treino"
        valor={2}
        max={4}
        className="mt-4"
        aria-valuetext="2 de 4 séries"
      />,
    );
    expect(barra()).toHaveClass('mt-4');
    expect(barra()).toHaveAttribute('aria-valuetext', '2 de 4 séries');
  });

  it.each([
    ['parcial', { valor: 45 }],
    ['completa', { valor: 100 }],
    ['sem dados', { valor: null }],
    ['sem texto', { valor: 45, mostrarTexto: false }],
  ])('nao tem violacoes de acessibilidade (%s)', async (_nome, props) => {
    const { container } = render(<BarraDeProgresso rotulo="Progresso do treino" {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
