import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { rotas } from '../../app/rotas.jsx';
import { renderizarRotas } from '../../testes/renderizar.jsx';
import { servidor } from '../../testes/servidor.js';

const SAUDE = { status: 'ok', banco: 'ok', versao: '0.1.0', horario: '2026-11-06T12:00:00-03:00' };

function lerLista() {
  const termos = screen.getAllByRole('term').map((termo) => termo.textContent);
  const valores = screen.getAllByRole('definition').map((valor) => valor.textContent);
  return termos.map((termo, indice) => [termo, valores[indice]]);
}

describe('/dev/status', () => {
  it('mostra Carregando e depois os quatro campos da API no ar', async () => {
    servidor.use(rede.get('/api/v1/saude', () => HttpResponse.json(SAUDE)));
    renderizarRotas(rotas, '/dev/status');
    expect(await screen.findByRole('heading', { level: 1, name: 'Status da API' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
    expect(lerLista()).toEqual([
      ['Status', 'ok'],
      ['Banco', 'ok'],
      ['Versão', '0.1.0'],
      ['Horário', '2026-11-06T12:00:00-03:00'],
    ]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('aceita os campos dentro de data', async () => {
    servidor.use(rede.get('/api/v1/saude', () => HttpResponse.json({ data: SAUDE })));
    renderizarRotas(rotas, '/dev/status');
    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
    expect(lerLista()).toHaveLength(4);
  });

  it('503 com request_id mostra o alerta com a mensagem e o codigo', async () => {
    servidor.use(
      rede.get('/api/v1/saude', () =>
        HttpResponse.json({ message: 'Banco de dados indisponível.', request_id: 'abc-123' }, { status: 503 }),
      ),
    );
    renderizarRotas(rotas, '/dev/status');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Banco de dados indisponível.');
    expect(alerta).toHaveTextContent('Código do erro: abc-123');
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });

  it('sem a API no ar mostra a mensagem de sem conexao com o id enviado', async () => {
    servidor.use(rede.get('/api/v1/saude', () => HttpResponse.error()));
    renderizarRotas(rotas, '/dev/status');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível conectar ao servidor. Confira sua conexão e tente de novo.');
    expect(alerta).toHaveTextContent(/Código do erro: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });

  it('Tentar de novo refaz a consulta e mostra a API no ar', async () => {
    let chamadas = 0;
    servidor.use(
      rede.get('/api/v1/saude', () => {
        chamadas += 1;
        if (chamadas === 1) return HttpResponse.json({ message: 'Banco de dados indisponível.' }, { status: 503 });
        return HttpResponse.json(SAUDE);
      }),
    );
    renderizarRotas(rotas, '/dev/status');
    const alerta = await screen.findByRole('alert');
    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(chamadas).toBe(2);
  });
});
