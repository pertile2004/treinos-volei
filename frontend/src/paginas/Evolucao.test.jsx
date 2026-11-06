import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import AppShell from '../app/AppShell.jsx';
import { definirNavegacao } from '../lib/http.js';
import { VAZIA, registrarEstatisticas, registrarReferencias } from '../testes/exemplosDeEstatisticas.js';
import { renderizarRotas } from '../testes/renderizar.jsx';
import { servidor } from '../testes/servidor.js';
import Evolucao from './Evolucao.jsx';

// Como em produção: a página fica dentro do landmark main do AppShell.
const rotasDeTeste = [
  {
    Component: AppShell,
    children: [
      { path: 'evolucao', Component: Evolucao },
      { path: 'treino', Component: () => <h1>Treino</h1> },
    ],
  },
  { path: '/entrar', Component: () => <h1>Entrar</h1> },
];

function erroDaApi(status, extra = {}) {
  servidor.use(
    rede.get('/api/v1/estatisticas', () =>
      HttpResponse.json({ message: 'Erro interno do servidor.', request_id: 'req-abc-123', ...extra }, { status }),
    ),
  );
}

beforeEach(() => registrarReferencias());
afterEach(() => definirNavegacao((destino) => window.location.assign(destino)));

describe('Evolucao', () => {
  it('abre na aba Semana, mostra carregando e depois os tres cartoes com os numeros da API', async () => {
    const pedidos = registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    expect(screen.getByRole('heading', { level: 1, name: 'Evolução' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando sua evolução…');
    expect(await screen.findByText(/Total no período: 1 h 45 min/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Semana' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'Volume de treino (min)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Performance por fundamento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequência' })).toBeInTheDocument();
    expect(screen.getByText('2 de 3 dias nesta semana')).toBeInTheDocument();
    expect(pedidos).toEqual(['semana']);
  });

  it('as abas sao Semana, Mes, 3 Meses e Ano, e trocar de aba chama a API com o periodo certo', async () => {
    const usuario = userEvent.setup();
    const pedidos = registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByText(/Total no período: 1 h 45 min/);
    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Semana', 'Mês', '3 Meses', 'Ano']);

    await usuario.click(screen.getByRole('tab', { name: 'Mês' }));
    expect(await screen.findByText(/Total no período: 4 h 50 min/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mês' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'aba-mes');

    await usuario.click(screen.getByRole('tab', { name: '3 Meses' }));
    await waitFor(() => expect(pedidos).toEqual(['semana', 'mes', '3meses']));
    await usuario.click(screen.getByRole('tab', { name: 'Ano' }));
    expect(await screen.findByText(/Total no período: 20 h/)).toBeInTheDocument();
    expect(pedidos).toEqual(['semana', 'mes', '3meses', 'ano']);
  });

  it('as abas respondem ao teclado', async () => {
    const usuario = userEvent.setup();
    const pedidos = registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByText(/Total no período: 1 h 45 min/);
    screen.getByRole('tab', { name: 'Semana' }).focus();
    await usuario.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Mês' })).toHaveFocus();
    await waitFor(() => expect(pedidos).toEqual(['semana', 'mes']));
  });

  it('mostra "sem dados" para fundamento sem tentativas e nunca 0%', async () => {
    registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByText(/Total no período: 1 h 45 min/);
    const itens = screen.getAllByRole('listitem');
    const levantamento = itens.find((item) => within(item).queryByText('Levantamento'));
    expect(levantamento).toHaveTextContent(/sem dados/i);
    expect(levantamento).not.toHaveTextContent('0%');
    const recepcao = itens.find((item) => within(item).queryByText('Recepção'));
    expect(recepcao).toHaveTextContent('70%');
  });

  it('erro da API mostra a mensagem com o codigo do erro e "Tentar de novo" recarrega', async () => {
    const usuario = userEvent.setup();
    erroDaApi(500);
    renderizarRotas(rotasDeTeste, '/evolucao');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar sua evolução. Tente novamente.');
    expect(alerta).toHaveTextContent('req-abc-123');

    registrarEstatisticas();
    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText(/Total no período: 1 h 45 min/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sem sessao (401) explica que precisa entrar, com link para /entrar', async () => {
    definirNavegacao(vi.fn());
    erroDaApi(401, { message: 'Não autenticado.' });
    renderizarRotas(rotasDeTeste, '/evolucao');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Você precisa entrar para ver sua evolução.');
    expect(within(alerta).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
  });

  it('periodo sem nenhuma sessao mostra o estado vazio com link para registrar um treino', async () => {
    registrarEstatisticas(VAZIA);
    renderizarRotas(rotasDeTeste, '/evolucao');
    expect(await screen.findByText('Você ainda não tem treinos neste período.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar um treino' })).toHaveAttribute('href', '/treino');
    expect(screen.queryByRole('heading', { level: 2, name: 'Volume de treino (min)' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ver como tabela' })).toBeNull();
  });

  it('"Ver como tabela" troca os graficos pelas tabelas com os mesmos valores, e volta', async () => {
    const usuario = userEvent.setup();
    registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByText(/Total no período: 1 h 45 min/);
    const botao = screen.getByRole('button', { name: 'Ver como tabela' });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(botao).toHaveClass('min-h-11');
    expect(screen.queryByRole('table')).toBeNull();

    await usuario.click(botao);
    const alternar = screen.getByRole('button', { name: 'Ver gráficos' });
    expect(alternar).toHaveAttribute('aria-pressed', 'true');
    const volume = screen.getByRole('table', { name: 'Volume de treino (min)' });
    expect(within(volume).getByRole('rowheader', { name: 'Quarta-feira, 04/11' })).toBeInTheDocument();
    expect(
      within(volume)
        .getAllByRole('cell')
        .map((celula) => celula.textContent),
    ).toEqual(['45', '0', '60', '0', '0', '0', '0']);
    const performance = screen.getByRole('table', { name: 'Performance por fundamento' });
    const recepcao = within(performance).getByRole('rowheader', { name: 'Recepção' }).closest('tr');
    expect(recepcao).toHaveTextContent('42');
    expect(recepcao).toHaveTextContent('18');
    expect(recepcao).toHaveTextContent('70%');
    expect(within(performance).getByRole('rowheader', { name: 'Levantamento' }).closest('tr')).toHaveTextContent(
      'sem dados',
    );
    expect(screen.getByText('2 de 3 dias nesta semana')).toBeInTheDocument();

    await usuario.click(alternar);
    expect(screen.getByRole('button', { name: 'Ver como tabela' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Volume de treino (min)' })).toBeInTheDocument();
  });

  it('a escolha de tabela continua ao trocar de aba', async () => {
    const usuario = userEvent.setup();
    registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByText(/Total no período: 1 h 45 min/);
    await usuario.click(screen.getByRole('button', { name: 'Ver como tabela' }));
    await usuario.click(screen.getByRole('tab', { name: 'Mês' }));
    const volume = await screen.findByRole('table', { name: 'Volume de treino (min)' });
    expect(await within(volume).findByRole('rowheader', { name: '12/10 a 18/10' })).toBeInTheDocument();
  });

  it('nao tem violacoes de acessibilidade com graficos nem com tabelas', async () => {
    const usuario = userEvent.setup();
    registrarEstatisticas();
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByText(/Total no período: 1 h 45 min/);
    expect(await axe(document.body)).toHaveNoViolations();
    await usuario.click(screen.getByRole('button', { name: 'Ver como tabela' }));
    await screen.findByRole('table', { name: 'Volume de treino (min)' });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('erro e vazio tambem passam no axe', async () => {
    erroDaApi(500);
    renderizarRotas(rotasDeTeste, '/evolucao');
    await screen.findByRole('alert');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
