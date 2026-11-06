import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Paginacao from './Paginacao.jsx';

describe('Paginacao', () => {
  it('mostra Pagina X de Y e desabilita as pontas', async () => {
    const aoMudar = vi.fn();
    const { rerender } = render(<Paginacao atual={1} total={3} aoMudar={aoMudar} />);
    const nav = screen.getByRole('navigation', { name: 'Paginação' });
    expect(nav).toHaveTextContent('Página 1 de 3');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled();

    rerender(<Paginacao atual={3} total={3} aoMudar={aoMudar} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  });

  it('chama aoMudar com a pagina vizinha', async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Paginacao atual={2} total={3} aoMudar={aoMudar} />);
    await usuario.click(screen.getByRole('button', { name: 'Anterior' }));
    await usuario.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(aoMudar.mock.calls).toEqual([[1], [3]]);
  });

  it('com uma pagina so nao renderiza nada', () => {
    const { container } = render(<Paginacao atual={1} total={1} aoMudar={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('os botoes tem alvo de 44 px e nao ha violacoes', async () => {
    const { container } = render(<Paginacao atual={2} total={3} aoMudar={() => {}} />);
    for (const botao of screen.getAllByRole('button')) {
      expect(botao).toHaveClass('min-h-11');
    }
    expect(await axe(container)).toHaveNoViolations();
  });
});
