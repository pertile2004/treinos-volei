import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../../../app/rotas.jsx';
import { renderizarRotas } from '../../../testes/renderizar.jsx';
import LinkMetricas from './LinkMetricas.jsx';

describe('LinkMetricas', () => {
  it('e um link de documento inteiro para /pulse, na mesma aba', () => {
    render(<LinkMetricas />);
    const link = screen.getByRole('link', { name: 'Métricas' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/pulse');
    expect(link).not.toHaveAttribute('target');
    expect(link).toHaveClass('min-h-11');
    expect(link).toHaveClass('focus-visible:outline-2');
  });

  it('explica que o painel abre fora do app', () => {
    render(<LinkMetricas />);
    expect(screen.getByText(/painel de métricas do servidor/i)).toBeInTheDocument();
  });

  it('aparece na area do admin', async () => {
    renderizarRotas(rotas, '/admin/exercicios');
    await screen.findByRole('heading', { level: 1, name: 'Exercícios (admin)' });
    expect(screen.getByRole('link', { name: 'Métricas' })).toHaveAttribute('href', '/pulse');
  });

  it('nao tem violacoes de acessibilidade', async () => {
    const { container } = render(<LinkMetricas />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
