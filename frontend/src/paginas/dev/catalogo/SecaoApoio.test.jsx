import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import SecaoApoio from './SecaoApoio.jsx';

// O jsdom 31 não implementa showModal() nem close() do <dialog>: substituto só de teste.
const prototipoDoDialogo = window.HTMLDialogElement.prototype;
if (typeof prototipoDoDialogo.showModal !== 'function') {
  prototipoDoDialogo.showModal = function showModal() {
    this.setAttribute('open', '');
  };
}
if (typeof prototipoDoDialogo.close !== 'function') {
  prototipoDoDialogo.close = function close() {
    this.removeAttribute('open');
  };
}

const COMPONENTES = ['Avatar', 'ModalDeConfirmacao'];

function renderizar() {
  return render(
    <main>
      <h1>Catálogo de componentes</h1>
      <SecaoApoio />
    </main>,
  );
}

const bloco = (nome) => screen.getByRole('heading', { level: 3, name: nome }).parentElement;

describe('SecaoApoio', () => {
  it('é uma região "Apoio" com um h2 e um h3 com o nome exato de cada componente do pacote', () => {
    renderizar();
    const secao = screen.getByRole('region', { name: 'Apoio' });
    expect(secao.tagName).toBe('SECTION');
    expect(within(secao).getByRole('heading', { level: 2, name: 'Apoio' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(
      within(secao)
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(COMPONENTES);
  });

  it('mostra o Avatar nos três tamanhos, decorativo e sem nome', () => {
    renderizar();
    const avatares = within(bloco('Avatar'));
    expect(avatares.getByRole('img', { name: 'Ana' })).toHaveClass('size-8');
    expect(avatares.getByRole('img', { name: 'Lucas Pereira' })).toHaveClass('size-10');
    expect(avatares.getByRole('img', { name: 'Maria Clara de Souza' })).toHaveClass('size-14');
    expect(avatares.getByRole('img', { name: 'Maria Clara de Souza' })).toHaveTextContent(/^MS$/);
    expect(avatares.getByRole('img', { name: 'Sem nome' })).toHaveTextContent(/^\?$/);
    expect(bloco('Avatar').querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('abre cada variação do modal por um Botao e devolve o foco ao botão que abriu', async () => {
    const usuario = userEvent.setup();
    renderizar();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const abrirPadrao = screen.getByRole('button', { name: 'Abrir confirmação' });
    expect(abrirPadrao).toHaveClass('min-h-11');
    await usuario.click(abrirPadrao);
    expect(screen.getByRole('dialog', { name: 'Finalizar treino?' })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrirPadrao).toHaveFocus();

    const abrirPerigo = screen.getByRole('button', { name: 'Abrir confirmação de perigo' });
    await usuario.click(abrirPerigo);
    const dialogoDePerigo = screen.getByRole('dialog', { name: 'Excluir treino?' });
    expect(within(dialogoDePerigo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrirPerigo).toHaveFocus();

    await usuario.click(screen.getByRole('button', { name: 'Abrir confirmação carregando' }));
    const dialogo = screen.getByRole('dialog', { name: 'Salvar treino?' });
    expect(within(dialogo).getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-busy', 'true');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('dialog', { name: 'Salvar treino?' })).toBeInTheDocument();
  });

  it('Tab alcança os três botões que abrem o modal, na ordem do documento', async () => {
    const usuario = userEvent.setup();
    renderizar();
    for (const nome of ['Abrir confirmação', 'Abrir confirmação de perigo', 'Abrir confirmação carregando']) {
      await usuario.tab();
      expect(screen.getByRole('button', { name: nome })).toHaveFocus();
    }
  });

  it('não tem violações de acessibilidade, com o modal fechado e aberto', async () => {
    const { container } = renderizar();
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir confirmação de perigo' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
