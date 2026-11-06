import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderizarRotas } from '../../../testes/renderizar.jsx';
import SecaoNavegacao from './SecaoNavegacao.jsx';

const COMPONENTES = ['Abas', 'Cabecalho', 'NavInferior', 'BarraLateral'];

function Catalogo() {
  return (
    <main>
      <h1>Catálogo de componentes</h1>
      <SecaoNavegacao />
    </main>
  );
}

async function renderizar() {
  const roteador = renderizarRotas([{ path: '*', Component: Catalogo }], '/dev/componentes');
  const secao = await screen.findByRole('region', { name: 'Navegação' });
  return { roteador, secao };
}

describe('SecaoNavegacao', () => {
  it('é uma região "Navegação" com um h2 e um h3 com o nome exato de cada componente do pacote', async () => {
    const { secao } = await renderizar();
    expect(within(secao).getByRole('heading', { level: 2, name: 'Navegação' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(
      within(secao)
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(COMPONENTES);
  });

  it('as abas de exemplo funcionam e mostram o painel da aba ativa', async () => {
    await renderizar();
    expect(screen.getByRole('tab', { name: 'Semana' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Semana' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Ano' }));
    expect(screen.getByRole('tab', { name: 'Ano' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Ano' })).toBeInTheDocument();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('as duas navegacoes mostram os quatro destinos e um item atual, com nomes diferentes', async () => {
    const { secao } = await renderizar();
    expect(within(secao).getAllByRole('navigation')).toHaveLength(2);
    for (const nome of ['Exemplo de navegação inferior', 'Exemplo de barra lateral']) {
      const nav = within(secao).getByRole('navigation', { name: nome });
      const links = within(nav).getAllByRole('link');
      expect(links.map((el) => el.textContent)).toEqual(['Início', 'Biblioteca', 'Treino', 'Evolução']);
      expect(links.filter((el) => el.getAttribute('aria-current') === 'page')).toHaveLength(1);
      expect(within(nav).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    }
  });

  it('a barra inferior de exemplo não fica presa ao rodapé da tela e a lateral mostra o rodapé', async () => {
    const { secao } = await renderizar();
    const inferior = within(secao).getByRole('navigation', { name: 'Exemplo de navegação inferior' });
    expect(inferior.className.trim().split(/\s+/).at(-1)).toBe('static');
    const lateral = within(secao).getByRole('navigation', { name: 'Exemplo de barra lateral' });
    expect(within(lateral).getByText('Rodapé de exemplo')).toBeInTheDocument();
  });

  it('os exemplos de cabecalho mostram subtitulo, voltar por link, voltar por botao e acoes que respondem', async () => {
    const { roteador, secao } = await renderizar();
    expect(within(secao).getByText('Hoje, 15 de outubro')).toBeInTheDocument();
    const link = within(secao).getByRole('link', { name: 'Voltar' });
    expect(link).toHaveAttribute('href', '/dev/componentes');
    const status = within(secao).getByRole('status');
    await userEvent.click(within(secao).getByRole('button', { name: 'Voltar' }));
    expect(status).toHaveTextContent('Voltar');
    await userEvent.click(within(secao).getByRole('button', { name: 'Editar' }));
    expect(status).toHaveTextContent('Editar');
    await userEvent.click(within(secao).getByRole('button', { name: 'Duplicar' }));
    expect(status).toHaveTextContent('Duplicar');
    expect(roteador.state.location.pathname).toBe('/dev/componentes');
  });

  it('só o catalogo tem h1: os cabecalhos de exemplo usam h4', async () => {
    const { secao } = await renderizar();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const titulos = within(secao)
      .getAllByRole('heading', { level: 4 })
      .map((titulo) => titulo.textContent);
    expect(titulos).toEqual(['Biblioteca', 'Início', 'Novo treino', 'Treino de saque']);
  });

  it('não tem violações de acessibilidade', async () => {
    await renderizar();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
