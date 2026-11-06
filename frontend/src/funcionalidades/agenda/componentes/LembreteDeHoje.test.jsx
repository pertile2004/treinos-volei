import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderizarRotas } from '../../../testes/renderizar.jsx';
import { servidor } from '../../../testes/servidor.js';
import LembreteDeHoje, { CHAVE_DA_DISPENSA } from './LembreteDeHoje.jsx';

const TREINO = { id: 5, nome: 'Saque e recepção', duracao_estimada_minutos: 40 };
const PENDENTE = { id: 12, data: '2026-11-11', hora: '18:30', concluido: false, sessao_id: null, treino: TREINO };
const CONCLUIDO = { id: 11, data: '2026-11-11', hora: '07:00', concluido: true, sessao_id: 7, treino: TREINO };

function atender(agendamentos) {
  const consultas = [];
  servidor.use(
    rede.get('/api/v1/agendamentos', ({ request }) => {
      consultas.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json({ data: agendamentos });
    }),
  );
  return consultas;
}

function Pagina() {
  return (
    <main>
      <LembreteDeHoje />
      <h1>Início</h1>
      <button type="button">Outro controle</button>
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
  window.sessionStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe('LembreteDeHoje', () => {
  it('aparece com treino de hoje pendente, com nome e hora, em role=status, sem roubar o foco', async () => {
    const consultas = atender([PENDENTE]);
    renderizarRotas(rotas, '/');
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Você tem treino hoje: Saque e recepção às 18:30.');
    expect(screen.getByRole('link', { name: 'Ver agenda' })).toHaveAttribute('href', '/agenda');
    expect(screen.getByRole('button', { name: 'Dispensar' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
    expect(consultas).toEqual([{ de: '2026-11-11', ate: '2026-11-11' }]);
  });

  it('sem hora omite "às"; com varios pendentes mostra a quantidade', async () => {
    atender([{ ...PENDENTE, hora: null }]);
    renderizarRotas(rotas, '/');
    expect(await screen.findByRole('status')).toHaveTextContent('Você tem treino hoje: Saque e recepção.');
  });

  it('com dois pendentes mostra a quantidade', async () => {
    atender([PENDENTE, { ...PENDENTE, id: 13, hora: '20:00' }, CONCLUIDO]);
    renderizarRotas(rotas, '/');
    expect(await screen.findByRole('status')).toHaveTextContent('Você tem 2 treinos pendentes hoje.');
  });

  it.each([
    ['sem agendamentos', []],
    ['com todos concluidos', [CONCLUIDO]],
  ])('nao aparece %s', async (nome, agendamentos) => {
    const consultas = atender(agendamentos);
    renderizarRotas(rotas, '/');
    await waitFor(() => expect(consultas).toHaveLength(1));
    await new Promise((resolver) => setTimeout(resolver, 30));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/Você tem/)).not.toBeInTheDocument();
  });

  it('nao aparece em caso de erro', async () => {
    servidor.use(
      rede.get('/api/v1/agendamentos', () =>
        HttpResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 }),
      ),
    );
    renderizarRotas(rotas, '/');
    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Dispensar esconde e vale ate o fim do dia; no dia seguinte volta', async () => {
    const usuario = userEvent.setup();
    atender([PENDENTE]);
    renderizarRotas(rotas, '/');
    await screen.findByRole('status');
    await usuario.click(screen.getByRole('button', { name: 'Dispensar' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(CHAVE_DA_DISPENSA)).toBe('2026-11-11');
  });

  it('ja dispensado hoje nao aparece; dispensa de outro dia nao conta', async () => {
    window.sessionStorage.setItem(CHAVE_DA_DISPENSA, '2026-11-11');
    const consultas = atender([PENDENTE]);
    renderizarRotas(rotas, '/');
    await waitFor(() => expect(consultas).toHaveLength(1));
    await new Promise((resolver) => setTimeout(resolver, 30));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('dispensa de ontem nao vale hoje', async () => {
    window.sessionStorage.setItem(CHAVE_DA_DISPENSA, '2026-11-10');
    atender([PENDENTE]);
    renderizarRotas(rotas, '/');
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('sem violacoes de acessibilidade', async () => {
    atender([PENDENTE]);
    renderizarRotas(rotas, '/');
    await screen.findByRole('status');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
