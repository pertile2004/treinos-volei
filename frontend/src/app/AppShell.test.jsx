import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarRotas } from '../testes/renderizar.jsx';
import AppShell from './AppShell.jsx';

function Conteudo() {
  return <h1>Conteúdo de teste</h1>;
}

const rotasDeTeste = [
  {
    Component: AppShell,
    children: [
      { index: true, Component: Conteudo },
      { path: 'biblioteca', Component: Conteudo },
      { path: 'biblioteca/filtros', Component: Conteudo },
    ],
  },
];

describe('AppShell', () => {
  it('tem os quatro links da navegacao principal, na ordem e com o destino certo', async () => {
    renderizarRotas(rotasDeTeste, '/');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Biblioteca', '/biblioteca'],
      ['Treino', '/treino'],
      ['Evolução', '/evolucao'],
    ]);
  });

  it('marca só o item da rota atual com aria-current', async () => {
    renderizarRotas(rotasDeTeste, '/biblioteca');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('aria-current', 'page');
    for (const rotulo of ['Início', 'Treino', 'Evolução']) {
      expect(within(nav).getByRole('link', { name: rotulo })).not.toHaveAttribute('aria-current');
    }
  });

  it('o item Início não fica ativo em rotas filhas', async () => {
    renderizarRotas(rotasDeTeste, '/biblioteca/filtros');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('aria-current', 'page');
  });

  it('mostra a pagina dentro do landmark main, que pode receber o foco', async () => {
    renderizarRotas(rotasDeTeste, '/');
    const conteudo = await screen.findByRole('main');
    expect(conteudo).toHaveAttribute('id', 'conteudo');
    expect(conteudo).toHaveAttribute('tabindex', '-1');
    expect(within(conteudo).getByRole('heading', { level: 1, name: 'Conteúdo de teste' })).toBeInTheDocument();
  });

  it('o link de pular para o conteudo vem antes da navegacao e aponta para o main', async () => {
    renderizarRotas(rotasDeTeste, '/');
    const pular = await screen.findByRole('link', { name: 'Pular para o conteúdo' });
    expect(pular).toHaveAttribute('href', '#conteudo');
    expect(screen.getAllByRole('link')[0]).toBe(pular);
  });
});
