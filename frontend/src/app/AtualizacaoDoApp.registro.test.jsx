import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarRotas } from '../testes/renderizar.jsx';
import AtualizacaoDoApp from './AtualizacaoDoApp.jsx';
import { rotas } from './rotas.jsx';

// Usa o substituto de src/testes/pwa-registro-desligado.js (alias de virtual:pwa-register/react em vite.config.js),
// que imita o registro vazio de dev. O módulo virtual real do plugin só é conferido no build + preview.
describe('AtualizacaoDoApp com o registro desligado (dev e testes)', () => {
  it('o app monta sem erro, sem aviso e sem tocar em navigator.serviceWorker', async () => {
    expect('serviceWorker' in navigator).toBe(false);
    renderizarRotas([{ Component: AtualizacaoDoApp }, ...rotas], '/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Nova versão disponível.')).not.toBeInTheDocument();
  });
});
