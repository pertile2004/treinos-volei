import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderizarRotas } from '../../../testes/renderizar.jsx';
import { servidor } from '../../../testes/servidor.js';
import AgendaDoDia from './AgendaDoDia.jsx';

const TREINO = { id: 5, nome: 'Saque e recepção', duracao_estimada_minutos: 40 };
const PENDENTE = { id: 12, data: '2026-11-11', hora: '18:30', concluido: false, sessao_id: null, treino: TREINO };
const CONCLUIDO = {
  id: 11,
  data: '2026-11-11',
  hora: null,
  concluido: true,
  sessao_id: 7,
  treino: { id: 8, nome: 'Bloqueio duplo', duracao_estimada_minutos: 25 },
};

function Pagina() {
  return (
    <main>
      <h1>Início</h1>
      <AgendaDoDia />
      <p>Resto da página</p>
    </main>
  );
}

const rotas = [
  { path: '/', Component: Pagina },
  { path: '/agenda', Component: () => <h1>Agenda</h1> },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('AgendaDoDia', () => {
  it('lista os agendamentos de hoje com hora, nome e estado', async () => {
    const consultas = [];
    servidor.use(
      rede.get('/api/v1/agendamentos', ({ request }) => {
        consultas.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json({ data: [CONCLUIDO, PENDENTE] });
      }),
    );
    renderizarRotas(rotas, '/');
    const secao = await screen.findByRole('region', { name: 'Agenda do dia' });
    const itens = await within(secao).findAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('Sem horário');
    expect(itens[0]).toHaveTextContent('Bloqueio duplo');
    expect(itens[0]).toHaveTextContent('Concluído');
    expect(itens[1]).toHaveTextContent('18:30');
    expect(itens[1]).toHaveTextContent('Saque e recepção');
    expect(itens[1]).toHaveTextContent('Pendente');
    expect(within(secao).getByRole('link', { name: 'Abrir agenda' })).toHaveAttribute('href', '/agenda');
    expect(consultas).toEqual([{ de: '2026-11-11', ate: '2026-11-11' }]);
  });

  it('vazio mostra o texto e o link para a Agenda, que navega', async () => {
    const usuario = userEvent.setup();
    servidor.use(rede.get('/api/v1/agendamentos', () => HttpResponse.json({ data: [] })));
    renderizarRotas(rotas, '/');
    const secao = await screen.findByRole('region', { name: 'Agenda do dia' });
    expect(await within(secao).findByText('Nada agendado para hoje.')).toBeInTheDocument();
    await usuario.click(within(secao).getByRole('link', { name: 'Abrir agenda' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda' })).toBeInTheDocument();
  });

  it('carregando tem status proprio', async () => {
    servidor.use(rede.get('/api/v1/agendamentos', () => HttpResponse.json({ data: [] })));
    renderizarRotas(rotas, '/');
    const secao = await screen.findByRole('region', { name: 'Agenda do dia' });
    expect(within(secao).getByRole('status')).toHaveTextContent('Carregando agenda do dia…');
  });

  it('erro mostra a mensagem da secao e nao derruba o resto da pagina', async () => {
    servidor.use(
      rede.get('/api/v1/agendamentos', () =>
        HttpResponse.json({ message: 'Erro interno do servidor.', request_id: 'r-9' }, { status: 500 }),
      ),
    );
    renderizarRotas(rotas, '/');
    const secao = await screen.findByRole('region', { name: 'Agenda do dia' });
    const alerta = await within(secao).findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar a agenda do dia.');
    expect(alerta).toHaveTextContent('Código do erro: r-9');
    expect(within(alerta).getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(screen.getByText('Resto da página')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
  });

  it('sem violacoes de acessibilidade', async () => {
    servidor.use(rede.get('/api/v1/agendamentos', () => HttpResponse.json({ data: [PENDENTE, CONCLUIDO] })));
    renderizarRotas(rotas, '/');
    const secao = await screen.findByRole('region', { name: 'Agenda do dia' });
    await within(secao).findAllByRole('listitem');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
