import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import MensagemDeErro from './MensagemDeErro.jsx';

const erroComCodigo = {
  response: {
    status: 500,
    data: { message: 'Erro interno do servidor.', request_id: '3f6c1c1e-8a0b-4c1e-9f1a-2b7d5e4c9a10' },
    headers: {},
  },
};

describe('MensagemDeErro com request_id (correlação)', () => {
  it('pede ao usuario que informe o codigo ao suporte e o mostra em texto selecionavel', () => {
    render(<MensagemDeErro erro={erroComCodigo} />);
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Se o problema continuar, informe este código ao suporte.');
    const codigo = within(alerta).getByText('3f6c1c1e-8a0b-4c1e-9f1a-2b7d5e4c9a10');
    expect(codigo.tagName).toBe('CODE');
    expect(codigo).not.toHaveClass('select-none');
  });

  it('o botao Copiar codigo copia o request_id e anuncia em aria-live', async () => {
    const usuario = userEvent.setup();
    render(<MensagemDeErro erro={erroComCodigo} />);
    const botao = screen.getByRole('button', { name: 'Copiar código' });
    expect(botao).toHaveClass('min-h-11');
    expect(botao).toHaveClass('focus-visible:outline-2');
    await usuario.click(botao);
    expect(await navigator.clipboard.readText()).toBe('3f6c1c1e-8a0b-4c1e-9f1a-2b7d5e4c9a10');
    const aviso = await screen.findByText('Código copiado.');
    expect(aviso.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('se o navegador negar a copia, orienta a copiar manualmente', async () => {
    const usuario = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('negado'));
    render(<MensagemDeErro erro={erroComCodigo} />);
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));
    const aviso = await screen.findByText('Não foi possível copiar. Selecione o código e copie manualmente.');
    expect(aviso.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('sem request_id nao mostra o botao Copiar codigo nem o pedido ao suporte', () => {
    render(<MensagemDeErro erro={{ response: { status: 500, data: {}, headers: {} } }} />);
    expect(screen.queryByRole('button', { name: 'Copiar código' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent('informe este código ao suporte');
  });

  it('nao tem violacoes de acessibilidade, com e sem Tentar de novo', async () => {
    const { container, unmount } = render(<MensagemDeErro erro={erroComCodigo} aoTentarDeNovo={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    const segundo = render(<MensagemDeErro erro={erroComCodigo} />);
    expect(await axe(segundo.container)).toHaveNoViolations();
  });
});
