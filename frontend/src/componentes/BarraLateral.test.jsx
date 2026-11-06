import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderizarRotas } from '../testes/renderizar.jsx';
import BarraLateral from './BarraLateral.jsx';

const itens = [
  { para: '/', rotulo: 'Início', exato: true, icone: <svg data-testid="icone-inicio" /> },
  { para: '/biblioteca', rotulo: 'Biblioteca', icone: <svg data-testid="icone-biblioteca" /> },
  { para: '/treino', rotulo: 'Treino', icone: <svg data-testid="icone-treino" /> },
  { para: '/evolucao', rotulo: 'Evolução', icone: <svg data-testid="icone-evolucao" /> },
];

function renderizar(caminho = '/', props = {}) {
  return renderizarRotas([{ path: '*', element: <BarraLateral itens={itens} {...props} /> }], caminho);
}

const nav = () => screen.findByRole('navigation', { name: 'Navegação principal' });
const link = (raiz, nome) => within(raiz).getByRole('link', { name: nome });

describe('BarraLateral', () => {
  it('tem os quatro links, na ordem e com o destino certo', async () => {
    renderizar();
    const links = within(await nav()).getAllByRole('link');
    expect(links.map((el) => [el.textContent, el.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Biblioteca', '/biblioteca'],
      ['Treino', '/treino'],
      ['Evolução', '/evolucao'],
    ]);
  });

  it('marca só o item da rota atual com aria-current', async () => {
    renderizar('/biblioteca');
    const raiz = await nav();
    expect(link(raiz, 'Biblioteca')).toHaveAttribute('aria-current', 'page');
    for (const rotulo of ['Início', 'Treino', 'Evolução']) {
      expect(link(raiz, rotulo)).not.toHaveAttribute('aria-current');
    }
  });

  it('o item exato (Início) não fica ativo em rotas filhas, e os outros ficam', async () => {
    renderizar('/biblioteca/filtros');
    const raiz = await nav();
    expect(link(raiz, 'Início')).not.toHaveAttribute('aria-current');
    expect(link(raiz, 'Biblioteca')).toHaveAttribute('aria-current', 'page');
  });

  it('o item atual não depende só da cor: fica em negrito', async () => {
    renderizar('/treino');
    const raiz = await nav();
    expect(link(raiz, 'Treino')).toHaveClass('font-bold');
    expect(link(raiz, 'Início')).not.toHaveClass('font-bold');
  });

  it('o clique navega e move o aria-current', async () => {
    const roteador = renderizar('/');
    const raiz = await nav();
    await userEvent.click(link(raiz, 'Treino'));
    expect(roteador.state.location.pathname).toBe('/treino');
    expect(link(raiz, 'Treino')).toHaveAttribute('aria-current', 'page');
    expect(link(raiz, 'Início')).not.toHaveAttribute('aria-current');
  });

  it('os links são alcançados pelo Tab, na ordem, e o Enter navega', async () => {
    const usuario = userEvent.setup();
    const roteador = renderizar('/');
    const raiz = await nav();
    await usuario.tab();
    expect(link(raiz, 'Início')).toHaveFocus();
    await usuario.tab();
    expect(link(raiz, 'Biblioteca')).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(roteador.state.location.pathname).toBe('/biblioteca');
  });

  it('o icone é decorativo e o nome do link é só o rotulo visível', async () => {
    renderizar();
    const raiz = await nav();
    const icone = screen.getByTestId('icone-treino');
    expect(link(raiz, 'Treino')).toContainElement(icone);
    expect(icone.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(within(link(raiz, 'Treino')).getByText('Treino')).toBeVisible();
  });

  it('funciona sem icone', async () => {
    renderizar('/', { itens: [{ para: '/perfil', rotulo: 'Perfil' }] });
    const raiz = await nav();
    expect(link(raiz, 'Perfil')).toHaveAttribute('href', '/perfil');
    expect(link(raiz, 'Perfil').querySelector('[aria-hidden]')).toBeNull();
  });

  it('mostra o rodape depois da lista de links', async () => {
    renderizar('/', { rodape: <p>Rodapé de teste</p> });
    const raiz = await nav();
    const rodape = within(raiz).getByText('Rodapé de teste');
    const lista = within(raiz).getByRole('list');
    expect(lista).not.toContainElement(rodape);
    expect(lista.compareDocumentPosition(rodape) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(lista).getAllByRole('link')).toHaveLength(4);
  });

  it('sem rodape a raiz só tem a lista de links', async () => {
    renderizar();
    expect((await nav()).children).toHaveLength(1);
  });

  it('cada link tem alvo de 44 px e os itens ficam em coluna, sem posicao fixa', async () => {
    renderizar();
    const raiz = await nav();
    for (const el of within(raiz).getAllByRole('link')) expect(el).toHaveClass('min-h-11');
    expect(within(raiz).getByRole('list')).toHaveClass('flex', 'flex-col');
    expect(raiz).not.toHaveClass('fixed');
  });

  it('aceita className (no fim) e outras props na raiz', async () => {
    renderizar('/', { className: 'max-w-64', 'data-testid': 'raiz', 'aria-label': 'Navegação de exemplo' });
    const raiz = await screen.findByRole('navigation', { name: 'Navegação de exemplo' });
    expect(raiz).toHaveAttribute('data-testid', 'raiz');
    expect(raiz.className.trim().split(/\s+/).at(-1)).toBe('max-w-64');
  });

  it('não tem violações de acessibilidade sem rodape', async () => {
    renderizar('/evolucao');
    await nav();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('não tem violações de acessibilidade com rodape', async () => {
    renderizar('/evolucao', { rodape: <p>Rodapé de teste</p> });
    await nav();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
