import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import Avatar from './Avatar.jsx';

describe('Avatar', () => {
  it('nome único vira uma letra', () => {
    render(<Avatar nome="Ana" />);
    expect(screen.getByRole('img', { name: 'Ana' })).toHaveTextContent(/^A$/);
  });

  it('vários nomes usam a primeira letra do primeiro e do último', () => {
    render(<Avatar nome="Ana Paula Souza" />);
    expect(screen.getByRole('img', { name: 'Ana Paula Souza' })).toHaveTextContent(/^AS$/);
  });

  it('ignora espaços extras e põe as iniciais em maiúsculas', () => {
    render(<Avatar nome="   érica    de  souza  " />);
    expect(screen.getByRole('img', { name: 'érica de souza' })).toHaveTextContent(/^ÉS$/);
  });

  it('sem nome mostra "?" e o texto alternativo "Sem nome"', () => {
    const { rerender } = render(<Avatar nome="   " />);
    expect(screen.getByRole('img', { name: 'Sem nome' })).toHaveTextContent(/^\?$/);
    rerender(<Avatar />);
    expect(screen.getByRole('img', { name: 'Sem nome' })).toHaveTextContent(/^\?$/);
  });

  it('decorativo fica fora da árvore de acessibilidade', () => {
    render(<Avatar nome="Ana Souza" decorativo data-testid="avatar" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).not.toHaveAttribute('aria-label');
    expect(avatar).toHaveTextContent('AS');
  });

  it('tem três tamanhos e o padrão é o médio', () => {
    const { rerender } = render(<Avatar nome="Ana" />);
    expect(screen.getByRole('img')).toHaveClass('size-10', 'rounded-full');
    rerender(<Avatar nome="Ana" tamanho="sm" />);
    expect(screen.getByRole('img')).toHaveClass('size-8');
    rerender(<Avatar nome="Ana" tamanho="lg" />);
    expect(screen.getByRole('img')).toHaveClass('size-14');
    rerender(<Avatar nome="Ana" tamanho="gigante" />);
    expect(screen.getByRole('img')).toHaveClass('size-10');
  });

  it('aceita className e outras props', () => {
    render(<Avatar nome="Ana" className="shrink-0" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('shrink-0');
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(
      <div>
        <Avatar nome="Ana Paula Souza" tamanho="sm" />
        <Avatar nome="Bruno" />
        <Avatar nome="Carla Dias" tamanho="lg" />
        <p>
          <Avatar nome="Diego Lima" decorativo /> Diego Lima
        </p>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
