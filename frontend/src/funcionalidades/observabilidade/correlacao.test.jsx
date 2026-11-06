import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../../app/rotas.jsx';
import { renderizarRotas } from '../../testes/renderizar.jsx';
import { servidor } from '../../testes/servidor.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// A API devolve o mesmo X-Request-Id que recebeu, no header e no corpo (contrato do PR-01).
function apiComErro500() {
  const recebidos = [];
  servidor.use(
    rede.get('/api/v1/saude', ({ request }) => {
      const id = request.headers.get('x-request-id');
      recebidos.push(id);
      return HttpResponse.json(
        { message: 'Erro interno do servidor.', request_id: id },
        { status: 500, headers: { 'X-Request-Id': id } },
      );
    }),
  );
  return recebidos;
}

describe('correlação de ponta a ponta: front → header → resposta → tela', () => {
  it('o codigo mostrado na tela e o X-Request-Id que o front enviou', async () => {
    const recebidos = apiComErro500();
    renderizarRotas(rotas, '/dev/status');
    const alerta = await screen.findByRole('alert');
    expect(recebidos).toHaveLength(1);
    expect(recebidos[0]).toMatch(UUID);
    expect(alerta).toHaveTextContent('Erro interno do servidor.');
    expect(alerta).toHaveTextContent(`Código do erro: ${recebidos[0]}`);
    expect(within(alerta).getByText(recebidos[0]).tagName).toBe('CODE');
  });

  it('Copiar codigo coloca exatamente esse id na area de transferencia', async () => {
    const usuario = userEvent.setup();
    const recebidos = apiComErro500();
    renderizarRotas(rotas, '/dev/status');
    await screen.findByRole('alert');
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(await navigator.clipboard.readText()).toBe(recebidos[0]);
    expect(await screen.findByText('Código copiado.')).toBeInTheDocument();
  });

  it('a tela de erro nao tem violacoes de acessibilidade', async () => {
    apiComErro500();
    renderizarRotas(rotas, '/dev/status');
    // A /dev/status fica fora do AppShell (sem landmark main): o axe roda na seção da tela, que é o que este card entrega.
    const alerta = await screen.findByRole('alert');
    expect(await axe(alerta.closest('section'))).toHaveNoViolations();
  });
});
