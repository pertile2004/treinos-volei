import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import ChipFiltro from './ChipFiltro.jsx';

describe('ChipFiltro', () => {
  it('é um botão com o rótulo e aria-pressed falso quando não selecionado', () => {
    const { container } = render(<ChipFiltro>Saque</ChipFiltro>);
    const chip = screen.getByRole('button', { name: 'Saque' });
    expect(chip).toHaveAttribute('type', 'button');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('selecionado tem aria-pressed verdadeiro e um ícone decorativo (o estado não depende só da cor)', () => {
    const { container } = render(<ChipFiltro selecionado>Saque</ChipFiltro>);
    const chip = screen.getByRole('button', { name: 'Saque' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveClass('bg-primaria', 'font-bold');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('o clique chama aoAlternar com o novo estado', async () => {
    const aoAlternar = vi.fn();
    const { rerender } = render(<ChipFiltro aoAlternar={aoAlternar}>Ataque</ChipFiltro>);
    await userEvent.click(screen.getByRole('button', { name: 'Ataque' }));
    expect(aoAlternar).toHaveBeenLastCalledWith(true);

    rerender(
      <ChipFiltro selecionado aoAlternar={aoAlternar}>
        Ataque
      </ChipFiltro>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ataque' }));
    expect(aoAlternar).toHaveBeenLastCalledWith(false);
    expect(aoAlternar).toHaveBeenCalledTimes(2);
  });

  it('Enter e Espaço alternam pelo teclado', async () => {
    const usuario = userEvent.setup();
    const aoAlternar = vi.fn();
    render(<ChipFiltro aoAlternar={aoAlternar}>Defesa</ChipFiltro>);
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Defesa' })).toHaveFocus();
    await usuario.keyboard('{Enter}');
    await usuario.keyboard(' ');
    expect(aoAlternar).toHaveBeenCalledTimes(2);
  });

  it('desabilitado não chama aoAlternar nem recebe foco', async () => {
    const usuario = userEvent.setup();
    const aoAlternar = vi.fn();
    render(
      <ChipFiltro disabled aoAlternar={aoAlternar}>
        Bloqueio
      </ChipFiltro>,
    );
    const chip = screen.getByRole('button', { name: 'Bloqueio' });
    expect(chip).toBeDisabled();
    await usuario.click(chip);
    await usuario.tab();
    expect(chip).not.toHaveFocus();
    expect(aoAlternar).not.toHaveBeenCalled();
  });

  it('funciona sem aoAlternar', async () => {
    render(<ChipFiltro>Recepção</ChipFiltro>);
    await userEvent.click(screen.getByRole('button', { name: 'Recepção' }));
    expect(screen.getByRole('button', { name: 'Recepção' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('tem formato de pílula, altura mínima de 32 px e aceita className e outras props', () => {
    render(
      <ChipFiltro className="shrink-0" data-testid="chip">
        Levantamento
      </ChipFiltro>,
    );
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveClass('rounded-full', 'min-h-8', 'shrink-0', 'border-borda-controle');
  });

  it('não tem violações de acessibilidade em nenhum estado', async () => {
    const { container } = render(
      <div>
        <ChipFiltro>Saque</ChipFiltro>
        <ChipFiltro selecionado>Ataque</ChipFiltro>
        <ChipFiltro disabled>Defesa</ChipFiltro>
        <ChipFiltro selecionado disabled>
          Bloqueio
        </ChipFiltro>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
