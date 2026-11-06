import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import AvisoNovaVersao from './AvisoNovaVersao.jsx';

function renderizar(props = {}) {
  const aoAtualizar = vi.fn();
  const aoAdiar = vi.fn();
  render(
    <div>
      <button type="button">Botão da página</button>
      <AvisoNovaVersao aberto aoAtualizar={aoAtualizar} aoAdiar={aoAdiar} {...props} />
    </div>,
  );
  return { aoAtualizar, aoAdiar };
}

describe('AvisoNovaVersao', () => {
  it('fechado não mostra nada', () => {
    render(<AvisoNovaVersao aberto={false} aoAtualizar={() => {}} aoAdiar={() => {}} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Nova versão disponível.')).not.toBeInTheDocument();
  });

  it('aberto é um status com a mensagem e os botões Atualizar e Depois', () => {
    renderizar();
    const aviso = screen.getByRole('status');
    expect(aviso).toHaveTextContent('Nova versão disponível.');
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Depois' })).toBeInTheDocument();
  });

  it('não rouba o foco ao aparecer e não some sozinho', () => {
    vi.useFakeTimers();
    try {
      renderizar();
      expect(document.activeElement).toBe(document.body);
      vi.advanceTimersByTime(60_000);
      expect(screen.getByRole('status')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('Atualizar chama aoAtualizar e Depois chama aoAdiar', async () => {
    const usuario = userEvent.setup();
    const { aoAtualizar, aoAdiar } = renderizar();
    await usuario.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(aoAtualizar).toHaveBeenCalledTimes(1);
    expect(aoAdiar).not.toHaveBeenCalled();
    await usuario.click(screen.getByRole('button', { name: 'Depois' }));
    expect(aoAdiar).toHaveBeenCalledTimes(1);
  });

  it('é alcançável pelo teclado: Tab chega em Atualizar e depois em Depois', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Botão da página' })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus();
  });

  it('enquanto atualiza, o botão Atualizar fica ocupado e não dispara de novo', async () => {
    const usuario = userEvent.setup();
    const { aoAtualizar } = renderizar({ atualizando: true });
    const atualizar = screen.getByRole('button', { name: 'Atualizar' });
    expect(atualizar).toHaveAttribute('aria-busy', 'true');
    await usuario.click(atualizar);
    expect(aoAtualizar).not.toHaveBeenCalled();
  });

  it('os dois botões têm alvo de 44 px', () => {
    renderizar();
    expect(screen.getByRole('button', { name: 'Atualizar' })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: 'Depois' })).toHaveClass('min-h-11');
  });

  it('não tem violações de acessibilidade', async () => {
    renderizar();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
