import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AtualizacaoDoApp from './AtualizacaoDoApp.jsx';

// Substituto do registro do service worker (virtual:pwa-register/react) só neste teste.
const registro = vi.hoisted(() => ({ novaVersao: false, atualizar: vi.fn(), opcoes: null }));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW(opcoes) {
    registro.opcoes = opcoes;
    const [needRefresh, setNeedRefresh] = useState(registro.novaVersao);
    const [offlineReady, setOfflineReady] = useState(false);
    return {
      needRefresh: [needRefresh, setNeedRefresh],
      offlineReady: [offlineReady, setOfflineReady],
      updateServiceWorker: registro.atualizar,
    };
  },
}));

beforeEach(() => {
  registro.novaVersao = false;
  registro.atualizar = vi.fn(() => new Promise(() => {}));
  registro.opcoes = null;
});

describe('AtualizacaoDoApp', () => {
  it('sem versão nova não mostra o aviso', () => {
    render(<AtualizacaoDoApp />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('quando o registro sinaliza versão nova, mostra o aviso', () => {
    registro.novaVersao = true;
    render(<AtualizacaoDoApp />);
    expect(screen.getByRole('status')).toHaveTextContent('Nova versão disponível.');
  });

  it('Atualizar ativa o service worker novo e deixa o botão ocupado até a página recarregar', async () => {
    const usuario = userEvent.setup();
    registro.novaVersao = true;
    render(<AtualizacaoDoApp />);
    const atualizar = screen.getByRole('button', { name: 'Atualizar' });
    await usuario.click(atualizar);
    expect(registro.atualizar).toHaveBeenCalledTimes(1);
    expect(atualizar).toHaveAttribute('aria-busy', 'true');
    await usuario.click(atualizar);
    expect(registro.atualizar).toHaveBeenCalledTimes(1);
  });

  it('Depois fecha o aviso sem atualizar', async () => {
    const usuario = userEvent.setup();
    registro.novaVersao = true;
    render(<AtualizacaoDoApp />);
    await usuario.click(screen.getByRole('button', { name: 'Depois' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(registro.atualizar).not.toHaveBeenCalled();
  });

  it('registra o service worker de imediato e trata erro de registro sem derrubar o app', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AtualizacaoDoApp />);
    expect(registro.opcoes.immediate).toBe(true);
    expect(() => registro.opcoes.onRegisterError(new Error('falhou'))).not.toThrow();
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });
});
