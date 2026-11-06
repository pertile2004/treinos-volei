import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import Cartao from './Cartao.jsx';

describe('Cartao', () => {
  it('renderiza os filhos em uma div plana, com o raio do cartão', () => {
    render(
      <Cartao data-testid="cartao">
        <p>Volume de treino (min)</p>
      </Cartao>,
    );
    const cartao = screen.getByTestId('cartao');
    expect(cartao.tagName).toBe('DIV');
    expect(cartao).toHaveTextContent('Volume de treino (min)');
    expect(cartao).toHaveClass('rounded-cartao', 'bg-superficie', 'p-4');
    expect(cartao).not.toHaveClass('bg-superficie-elevada');
    expect(cartao).not.toHaveAttribute('tabindex');
    expect(cartao).not.toHaveAttribute('role');
  });

  it('elevado usa a superfície elevada', () => {
    render(
      <Cartao elevado data-testid="cartao">
        Conteúdo
      </Cartao>,
    );
    expect(screen.getByTestId('cartao')).toHaveClass('bg-superficie-elevada');
    expect(screen.getByTestId('cartao')).not.toHaveClass('bg-superficie');
  });

  it.each([
    ['section', 'SECTION'],
    ['article', 'ARTICLE'],
    ['div', 'DIV'],
  ])('como="%s" troca o elemento raiz', (como, tag) => {
    render(
      <Cartao como={como} data-testid="cartao">
        Conteúdo
      </Cartao>,
    );
    expect(screen.getByTestId('cartao').tagName).toBe(tag);
  });

  it('como="li" funciona dentro de uma lista', () => {
    render(
      <ul>
        <Cartao como="li">Saque</Cartao>
        <Cartao como="li">Recepção</Cartao>
      </ul>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('elemento fora da lista permitida cai em div', () => {
    render(
      <Cartao como="button" data-testid="cartao">
        Conteúdo
      </Cartao>,
    );
    expect(screen.getByTestId('cartao').tagName).toBe('DIV');
  });

  it('repassa className, ref e as demais props ao elemento raiz', () => {
    const ref = { current: null };
    render(
      <Cartao ref={ref} className="mt-4" aria-label="Resumo da semana" como="section">
        Conteúdo
      </Cartao>,
    );
    const cartao = screen.getByRole('region', { name: 'Resumo da semana' });
    expect(cartao).toHaveClass('mt-4', 'rounded-cartao');
    expect(ref.current).toBe(cartao);
  });

  it('com para, o cartão inteiro é um único link com nome, alcançável por Tab', async () => {
    render(
      <MemoryRouter>
        <Cartao para="/treinos/7" data-testid="cartao">
          <h3>Treino de saque</h3>
          <p>20 min</p>
        </Cartao>
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/treinos/7');
    expect(links[0]).toHaveAccessibleName('Treino de saque 20 min');
    expect(screen.getByTestId('cartao')).toContainElement(links[0]);
    expect(screen.getByTestId('cartao')).toHaveClass('rounded-cartao');
    expect(screen.getByTestId('cartao')).not.toHaveClass('p-4');
    expect(links[0]).toHaveClass('p-4', 'block');
    await userEvent.tab();
    expect(links[0]).toHaveFocus();
  });

  it('sem para não há link nem botão', () => {
    render(<Cartao>Conteúdo</Cartao>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('não tem violações de acessibilidade plano, elevado, em lista e clicável', async () => {
    const { container } = render(
      <MemoryRouter>
        <main>
          <Cartao>Plano</Cartao>
          <Cartao elevado como="section" aria-label="Resumo da semana">
            Elevado
          </Cartao>
          <Cartao como="article">
            <h2>Artigo</h2>
          </Cartao>
          <ul>
            <Cartao como="li">Saque</Cartao>
            <Cartao como="li" para="/treinos/7">
              Treino de saque
            </Cartao>
          </ul>
        </main>
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
