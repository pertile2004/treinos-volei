import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import ModalDeConfirmacao from './ModalDeConfirmacao.jsx';

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

const base = {
  aberto: true,
  titulo: 'Finalizar treino?',
  descricao: 'O treino será salvo no seu histórico.',
};

function Exemplo({ perigo = false }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setAberto(true)}>
        Excluir treino
      </button>
      <ModalDeConfirmacao
        aberto={aberto}
        titulo="Excluir treino?"
        descricao="Esta ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        perigo={perigo}
        aoConfirmar={() => setAberto(false)}
        aoCancelar={() => setAberto(false)}
      />
      <button type="button">Fora do modal</button>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ModalDeConfirmacao', () => {
  it('fechado não mostra o diálogo', () => {
    render(<ModalDeConfirmacao {...base} aberto={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Finalizar treino?')).not.toBeInTheDocument();
  });

  it('aberto mostra um diálogo modal com o título como nome e a descrição ligada por aria', () => {
    const showModal = vi.spyOn(window.HTMLDialogElement.prototype, 'showModal');
    render(<ModalDeConfirmacao {...base} />);
    const dialogo = screen.getByRole('dialog', { name: 'Finalizar treino?' });
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialogo.tagName).toBe('DIALOG');
    expect(dialogo).toHaveAccessibleDescription('O treino será salvo no seu histórico.');
    expect(within(dialogo).getByRole('heading', { level: 2, name: 'Finalizar treino?' })).toBeInTheDocument();
  });

  it('sem descrição não aponta aria-describedby para nada', () => {
    render(<ModalDeConfirmacao aberto titulo="Sair do treino?" />);
    expect(screen.getByRole('dialog', { name: 'Sair do treino?' })).not.toHaveAttribute('aria-describedby');
  });

  it('usa os rótulos padrão e aceita rótulos próprios', () => {
    const { rerender } = render(<ModalDeConfirmacao {...base} />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    rerender(<ModalDeConfirmacao {...base} rotuloConfirmar="Finalizar" rotuloCancelar="Continuar treinando" />);
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar treinando' })).toBeInTheDocument();
  });

  it('Confirmar e Cancelar chamam os callbacks', async () => {
    const aoConfirmar = vi.fn();
    const aoCancelar = vi.fn();
    render(<ModalDeConfirmacao {...base} aoConfirmar={aoConfirmar} aoCancelar={aoCancelar} />);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(aoConfirmar).toHaveBeenCalledTimes(1);
    expect(aoCancelar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(aoCancelar).toHaveBeenCalledTimes(1);
    expect(aoConfirmar).toHaveBeenCalledTimes(1);
  });

  it('Esc chama aoCancelar uma vez', async () => {
    const aoConfirmar = vi.fn();
    const aoCancelar = vi.fn();
    render(<ModalDeConfirmacao {...base} aoConfirmar={aoConfirmar} aoCancelar={aoCancelar} />);
    await userEvent.keyboard('{Escape}');
    expect(aoCancelar).toHaveBeenCalledTimes(1);
    expect(aoConfirmar).not.toHaveBeenCalled();
  });

  it('o evento nativo cancel do dialog chama aoCancelar e não fecha por conta própria', () => {
    const aoCancelar = vi.fn();
    render(<ModalDeConfirmacao {...base} aoCancelar={aoCancelar} />);
    const evento = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), evento);
    expect(aoCancelar).toHaveBeenCalledTimes(1);
    expect(evento.defaultPrevented).toBe(true);
  });

  it('o foco inicial vai para Confirmar; na variação de perigo vai para Cancelar', () => {
    const { unmount } = render(<ModalDeConfirmacao {...base} />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus();
    unmount();
    render(<ModalDeConfirmacao {...base} perigo rotuloConfirmar="Excluir" />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('a variação de perigo usa a cor de perigo no botão de confirmar', () => {
    const { rerender } = render(<ModalDeConfirmacao {...base} />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveClass('bg-primaria');
    rerender(<ModalDeConfirmacao {...base} perigo />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveClass('bg-perigo');
    expect(screen.getByRole('button', { name: 'Confirmar' })).not.toHaveClass('bg-primaria');
  });

  it('os dois botões têm altura mínima de 44 px', () => {
    render(<ModalDeConfirmacao {...base} />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass('min-h-11');
  });

  it('abre pelo acionador, prende o foco com Tab e Shift+Tab e devolve o foco ao fechar com Esc', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);
    const acionador = screen.getByRole('button', { name: 'Excluir treino' });
    await usuario.click(acionador);

    const dialogo = screen.getByRole('dialog', { name: 'Excluir treino?' });
    const cancelar = within(dialogo).getByRole('button', { name: 'Cancelar' });
    const confirmar = within(dialogo).getByRole('button', { name: 'Excluir' });
    expect(confirmar).toHaveFocus();

    await usuario.tab();
    expect(cancelar).toHaveFocus();
    await usuario.tab();
    expect(confirmar).toHaveFocus();
    await usuario.tab();
    expect(cancelar).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(confirmar).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(cancelar).toHaveFocus();

    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(acionador).toHaveFocus();
  });

  it('devolve o foco ao acionador ao confirmar e ao cancelar pelo botão', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo perigo />);
    const acionador = screen.getByRole('button', { name: 'Excluir treino' });

    await usuario.click(acionador);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(acionador).toHaveFocus();

    await usuario.keyboard('{Enter}');
    await usuario.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(acionador).toHaveFocus();
  });

  it('carregando marca o botão de confirmar como ocupado e ignora o clique; cancelar continua valendo', async () => {
    const aoConfirmar = vi.fn();
    const aoCancelar = vi.fn();
    render(<ModalDeConfirmacao {...base} carregando aoConfirmar={aoConfirmar} aoCancelar={aoCancelar} />);
    const confirmar = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmar).toHaveAttribute('aria-busy', 'true');
    expect(confirmar).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(confirmar);
    confirmar.focus();
    await userEvent.keyboard('{Enter}');
    expect(aoConfirmar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(aoCancelar).toHaveBeenCalledTimes(1);
  });

  it('fora do carregando o botão de confirmar não fica ocupado nem desabilitado', () => {
    render(<ModalDeConfirmacao {...base} />);
    const confirmar = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmar).not.toHaveAttribute('aria-busy', 'true');
    expect(confirmar).not.toHaveAttribute('aria-disabled', 'true');
    expect(confirmar).toBeEnabled();
  });

  it('fecha o <dialog> nativo quando aberto volta a ser falso', () => {
    const close = vi.spyOn(window.HTMLDialogElement.prototype, 'close');
    const { rerender } = render(<ModalDeConfirmacao {...base} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    rerender(<ModalDeConfirmacao {...base} aberto={false} />);
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('funciona sem callbacks', async () => {
    render(<ModalDeConfirmacao {...base} />);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade aberto, em perigo e carregando', async () => {
    const { container, rerender } = render(<ModalDeConfirmacao {...base} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<ModalDeConfirmacao {...base} perigo rotuloConfirmar="Excluir" />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<ModalDeConfirmacao {...base} carregando />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
