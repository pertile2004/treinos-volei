import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
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

// Substituto de window.matchMedia só para o teste: o jsdom não tem matchMedia.
function simularLargura(aPartirDe1024) {
  vi.stubGlobal('matchMedia', () => ({ matches: aPartirDe1024, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => vi.unstubAllGlobals());

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

  it('abaixo de 1024 px (e sem matchMedia) a navegacao é a barra inferior fixa', async () => {
    renderizarRotas(rotasDeTeste, '/');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(nav).toHaveClass('fixed', 'bottom-0');
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    cleanup();

    simularLargura(false);
    renderizarRotas(rotasDeTeste, '/');
    expect(await screen.findByRole('navigation', { name: 'Navegação principal' })).toHaveClass('fixed', 'bottom-0');
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  it('a partir de 1024 px a navegacao é a barra lateral, e continua sendo uma só', async () => {
    simularLargura(true);
    renderizarRotas(rotasDeTeste, '/biblioteca');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(nav).not.toHaveClass('fixed');
    expect(within(nav).getByRole('list')).toHaveClass('flex-col');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Início', 'Biblioteca', 'Treino', 'Evolução']);
    expect(within(nav).getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ['barra inferior', false],
    ['barra lateral', true],
  ])('na %s cada item tem icone decorativo e alvo de 44 px', async (nome, aPartirDe1024) => {
    simularLargura(aPartirDe1024);
    renderizarRotas(rotasDeTeste, '/');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    for (const link of within(nav).getAllByRole('link')) {
      expect(link).toHaveClass('min-h-11');
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it.each([
    ['barra inferior', false],
    ['barra lateral', true],
  ])('com a %s não tem violações de acessibilidade', async (nome, aPartirDe1024) => {
    simularLargura(aPartirDe1024);
    renderizarRotas(rotasDeTeste, '/');
    await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
