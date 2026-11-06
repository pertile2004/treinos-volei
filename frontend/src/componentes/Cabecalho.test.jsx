import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderizarRotas } from '../testes/renderizar.jsx';
import Cabecalho from './Cabecalho.jsx';

describe('Cabecalho', () => {
  it('mostra o titulo em h1 dentro de um header', () => {
    const { container } = render(<Cabecalho titulo="Biblioteca" />);
    const cabecalho = container.querySelector('header');
    expect(within(cabecalho).getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it('mostra o subtitulo quando informado', () => {
    render(<Cabecalho titulo="Início" subtitulo="Hoje, 15 de outubro" />);
    expect(screen.getByText('Hoje, 15 de outubro')).toBeInTheDocument();
  });

  it('sem voltarPara nem aoVoltar não há controle de voltar, nem area de acoes', () => {
    const { container } = render(<Cabecalho titulo="Início" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('header').children).toHaveLength(1);
  });

  it('com voltarPara há um link Voltar de 44 px que leva à rota', async () => {
    const roteador = renderizarRotas(
      [
        { path: 'treinos/novo', element: <Cabecalho titulo="Novo treino" voltarPara="/biblioteca" /> },
        { path: 'biblioteca', element: <Cabecalho titulo="Biblioteca" /> },
      ],
      '/treinos/novo',
    );
    const voltar = await screen.findByRole('link', { name: 'Voltar' });
    expect(voltar).toHaveAttribute('href', '/biblioteca');
    expect(voltar).toHaveClass('min-h-11', 'min-w-11');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await userEvent.click(voltar);
    expect(await screen.findByRole('heading', { level: 1, name: 'Biblioteca' })).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe('/biblioteca');
  });

  it('com aoVoltar há um botao Voltar de 44 px que chama a funcao, no clique e no teclado', async () => {
    const aoVoltar = vi.fn();
    const usuario = userEvent.setup();
    render(<Cabecalho titulo="Treino ativo" aoVoltar={aoVoltar} />);
    const voltar = screen.getByRole('button', { name: 'Voltar' });
    expect(voltar).toHaveAttribute('type', 'button');
    expect(voltar).toHaveClass('min-h-11', 'min-w-11');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await usuario.click(voltar);
    expect(aoVoltar).toHaveBeenCalledTimes(1);
    await usuario.keyboard('{Enter}');
    expect(aoVoltar).toHaveBeenCalledTimes(2);
  });

  it('o icone do voltar é decorativo', () => {
    render(<Cabecalho titulo="Treino ativo" aoVoltar={() => {}} />);
    const icone = screen.getByRole('button', { name: 'Voltar' }).querySelector('svg');
    expect(icone).toHaveAttribute('aria-hidden', 'true');
  });

  it('o voltar vem antes do titulo e as acoes vêm depois, na ordem do Tab', async () => {
    const usuario = userEvent.setup();
    render(<Cabecalho titulo="Treino de saque" aoVoltar={() => {}} acoes={<button type="button">Editar</button>} />);
    const voltar = screen.getByRole('button', { name: 'Voltar' });
    const titulo = screen.getByRole('heading', { name: 'Treino de saque' });
    const editar = screen.getByRole('button', { name: 'Editar' });
    expect(voltar.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(titulo.compareDocumentPosition(editar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await usuario.tab();
    expect(voltar).toHaveFocus();
    await usuario.tab();
    expect(editar).toHaveFocus();
  });

  it('aceita outro nivel de titulo, para uso fora do topo da pagina', () => {
    render(<Cabecalho titulo="Exemplo" nivelDoTitulo={4} />);
    expect(screen.getByRole('heading', { level: 4, name: 'Exemplo' })).toBeInTheDocument();
  });

  it('aceita className e outras props na raiz', () => {
    render(<Cabecalho titulo="Início" className="mb-4" data-testid="raiz" />);
    expect(screen.getByTestId('raiz').tagName).toBe('HEADER');
    expect(screen.getByTestId('raiz')).toHaveClass('mb-4');
  });

  it('não tem violações de acessibilidade em nenhuma variacao', async () => {
    renderizarRotas([
      {
        path: '*',
        element: (
          <main>
            <Cabecalho titulo="Só o título" />
            <Cabecalho titulo="Com subtítulo" subtitulo="Hoje, 15 de outubro" nivelDoTitulo={2} />
            <Cabecalho titulo="Com link de voltar" voltarPara="/biblioteca" nivelDoTitulo={2} />
            <Cabecalho
              titulo="Com botão de voltar e ações"
              aoVoltar={() => {}}
              acoes={<button type="button">Editar</button>}
              nivelDoTitulo={2}
            />
          </main>
        ),
      },
    ]);
    expect(await screen.findByRole('link', { name: 'Voltar' })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
