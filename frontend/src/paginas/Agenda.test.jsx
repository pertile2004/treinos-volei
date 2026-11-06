import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { definirNavegacao } from '../lib/http.js';
import { renderizarRotas } from '../testes/renderizar.jsx';
import { servidor } from '../testes/servidor.js';
import Agenda from './Agenda.jsx';

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

const TREINO = { id: 5, nome: 'Saque e recepção', duracao_estimada_minutos: 40 };
const OUTRO_TREINO = { id: 8, nome: 'Bloqueio duplo', duracao_estimada_minutos: 25 };

const PENDENTE_HOJE = { id: 12, data: '2026-11-11', hora: '18:30', concluido: false, sessao_id: null, treino: TREINO };
const CONCLUIDO_ONTEM = {
  id: 11,
  data: '2026-11-10',
  hora: null,
  concluido: true,
  sessao_id: 77,
  treino: OUTRO_TREINO,
};
const PENDENTE_PASSADO = {
  id: 10,
  data: '2026-11-09',
  hora: '07:00',
  concluido: false,
  sessao_id: null,
  treino: TREINO,
};

const RESUMO_TREINO = (treino) => ({
  ...treino,
  descricao: null,
  nivel: 'intermediario',
  visibilidade: 'privado',
  total_exercicios: 6,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
});
const PAGINA_DE_TREINOS = (treinos) => ({
  data: treinos.map(RESUMO_TREINO),
  links: { first: '/api/v1/treinos?page=1', last: '/api/v1/treinos?page=1', prev: null, next: null },
  meta: { current_page: 1, per_page: 15, total: treinos.length },
});

/**
 * API falsa com estado: a lista responde ao intervalo pedido e as mutações alteram o estado.
 * Devolve os registros das chamadas para as asserções.
 */
function montarApi({ agendamentos = [], meus = [TREINO, OUTRO_TREINO], destaque = [] } = {}) {
  const estado = { agendamentos: [...agendamentos], proximoId: 100 };
  const registros = { consultas: [], posts: [], patches: [], deletes: [] };
  servidor.use(
    rede.get('/api/v1/agendamentos', ({ request }) => {
      const query = Object.fromEntries(new URL(request.url).searchParams);
      registros.consultas.push(query);
      const data = estado.agendamentos.filter((a) => a.data >= query.de && a.data <= query.ate);
      return HttpResponse.json({ data });
    }),
    rede.post('/api/v1/agendamentos', async ({ request }) => {
      const corpo = await request.json();
      registros.posts.push(corpo);
      const treino = [...meus, ...destaque].find((t) => t.id === corpo.treino_id);
      const novo = {
        id: estado.proximoId++,
        data: corpo.data,
        hora: corpo.hora,
        concluido: false,
        sessao_id: null,
        treino,
      };
      estado.agendamentos.push(novo);
      return HttpResponse.json({ data: novo }, { status: 201 });
    }),
    rede.patch('/api/v1/agendamentos/:id', async ({ params, request }) => {
      const corpo = await request.json();
      registros.patches.push([params.id, corpo]);
      const alvo = estado.agendamentos.find((a) => a.id === Number(params.id));
      Object.assign(alvo, corpo);
      return HttpResponse.json({ data: alvo });
    }),
    rede.delete('/api/v1/agendamentos/:id', ({ params }) => {
      registros.deletes.push(params.id);
      estado.agendamentos = estado.agendamentos.filter((a) => a.id !== Number(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
    rede.get('/api/v1/treinos', ({ request }) => {
      const escopo = new URL(request.url).searchParams.get('escopo');
      return HttpResponse.json(PAGINA_DE_TREINOS(escopo === 'destaque' ? destaque : meus));
    }),
  );
  return registros;
}

// No app a página fica dentro do <main> do AppShell; aqui o landmark entra pelo teste.
function AgendaNoMain() {
  return (
    <main>
      <Agenda />
    </main>
  );
}

const rotas = [
  { path: '/agenda', Component: AgendaNoMain },
  { path: '/treinar/:treinoId', Component: () => <h1>Treino ativo</h1> },
  { path: '/biblioteca', Component: () => <h1>Biblioteca</h1> },
];

function abrir() {
  return renderizarRotas(rotas, '/agenda');
}

async function esperarSemana(texto) {
  return screen.findByText(texto);
}

function secaoDoDia(nome) {
  return screen.getByRole('region', { name: new RegExp(`^${nome}`) });
}

// Quarta-feira, 11/11/2026, 15h em São Paulo. Só o Date é falso: os timers continuam reais.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));
  window.sessionStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe('Agenda · semana', () => {
  it('mostra a semana atual de segunda a domingo, destaca hoje e pede de/ate corretos', async () => {
    const registros = montarApi({ agendamentos: [PENDENTE_HOJE] });
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda' })).toBeInTheDocument();
    await esperarSemana('Semana de 9 a 15 de novembro');
    expect(registros.consultas).toEqual([{ de: '2026-11-09', ate: '2026-11-15' }]);

    const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    for (const dia of dias) expect(titulos.some((t) => t.startsWith(dia))).toBe(true);
    expect(secaoDoDia('Quarta-feira')).toHaveAttribute('aria-current', 'date');
    expect(secaoDoDia('Segunda-feira')).not.toHaveAttribute('aria-current');
    expect(within(secaoDoDia('Quarta-feira')).getByText('Saque e recepção')).toBeInTheDocument();
  });

  it('Semana anterior, Proxima semana e Hoje trocam o intervalo', async () => {
    const usuario = userEvent.setup();
    const registros = montarApi();
    abrir();
    await esperarSemana('Semana de 9 a 15 de novembro');

    await usuario.click(screen.getByRole('button', { name: 'Próxima semana' }));
    await esperarSemana('Semana de 16 a 22 de novembro');
    await waitFor(() => expect(registros.consultas.at(-1)).toEqual({ de: '2026-11-16', ate: '2026-11-22' }));

    await usuario.click(screen.getByRole('button', { name: 'Semana anterior' }));
    await usuario.click(screen.getByRole('button', { name: 'Semana anterior' }));
    await esperarSemana('Semana de 2 a 8 de novembro');
    await waitFor(() => expect(registros.consultas.at(-1)).toEqual({ de: '2026-11-02', ate: '2026-11-08' }));
    expect(document.querySelector('[aria-current="date"]')).toBeNull();

    await usuario.click(screen.getByRole('button', { name: 'Hoje' }));
    await esperarSemana('Semana de 9 a 15 de novembro');
  });
});

describe('Agenda · estados', () => {
  it('carregando com aria-busy, depois a lista', async () => {
    montarApi({ agendamentos: [PENDENTE_HOJE] });
    abrir();
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Carregando agenda…');
    expect(status.closest('[aria-busy="true"]')).not.toBeNull();
    expect(await screen.findByText('Saque e recepção')).toBeInTheDocument();
    expect(screen.queryByText('Carregando agenda…')).not.toBeInTheDocument();
  });

  it('erro mostra a mensagem, o codigo e Tentar de novo recarrega', async () => {
    let falhar = true;
    servidor.use(
      rede.get('/api/v1/agendamentos', () => {
        if (falhar) {
          return HttpResponse.json({ message: 'Erro interno do servidor.', request_id: 'req-55' }, { status: 500 });
        }
        return HttpResponse.json({ data: [PENDENTE_HOJE] });
      }),
      rede.get('/api/v1/treinos', () => HttpResponse.json(PAGINA_DE_TREINOS([TREINO]))),
    );
    const usuario = userEvent.setup();
    abrir();
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar a agenda.');
    expect(alerta).toHaveTextContent('Código do erro: req-55');
    falhar = false;
    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Saque e recepção')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('401 tem mensagem clara (e o http pede a tela de entrar)', async () => {
    const navegar = vi.fn();
    definirNavegacao(navegar);
    servidor.use(
      rede.get('/api/v1/agendamentos', () => HttpResponse.json({ message: 'Não autenticado.' }, { status: 401 })),
    );
    abrir();
    expect(await screen.findByRole('alert')).toHaveTextContent('Entre na sua conta para ver a agenda.');
    expect(navegar).toHaveBeenCalledWith(expect.stringMatching(/^\/entrar\?voltar=/));
  });

  it('403 tem mensagem clara', async () => {
    servidor.use(
      rede.get('/api/v1/agendamentos', () => HttpResponse.json({ message: 'Ação não autorizada.' }, { status: 403 })),
    );
    abrir();
    expect(await screen.findByRole('alert')).toHaveTextContent('Você não tem permissão para ver esta agenda.');
  });

  it('vazio mostra o texto e o botao Agendar treino continua disponivel', async () => {
    montarApi();
    abrir();
    expect(await screen.findByText('Nenhum treino agendado nesta semana.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agendar treino' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Segunda-feira/ })).not.toBeInTheDocument();
  });
});

describe('Agenda · agendar', () => {
  it('valida treino e data em pt-BR, envia o POST e a lista atualiza', async () => {
    const usuario = userEvent.setup();
    const registros = montarApi({
      destaque: [{ id: 30, nome: 'Treino pronto de saque', duracao_estimada_minutos: 30 }],
    });
    abrir();
    await screen.findByText('Nenhum treino agendado nesta semana.');

    await usuario.click(screen.getByRole('button', { name: 'Agendar treino' }));
    const formulario = await screen.findByRole('form', { name: 'Agendar treino' });
    const treino = within(formulario).getByRole('combobox', { name: /Treino/ });
    await waitFor(() => expect(within(treino).getByRole('option', { name: 'Saque e recepção' })).toBeInTheDocument());
    expect(within(treino).getByRole('option', { name: 'Treino pronto de saque' })).toBeInTheDocument();

    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));
    expect(await within(formulario).findByText('Escolha um treino.')).toBeInTheDocument();
    expect(within(formulario).getByText('Informe a data.')).toBeInTheDocument();
    expect(registros.posts).toEqual([]);

    await usuario.selectOptions(treino, '5');
    await usuario.type(within(formulario).getByLabelText(/Data/), '2026-11-10');
    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));
    expect(await within(formulario).findByText('A data não pode ser anterior a hoje.')).toBeInTheDocument();
    expect(registros.posts).toEqual([]);

    await usuario.clear(within(formulario).getByLabelText(/Data/));
    await usuario.type(within(formulario).getByLabelText(/Data/), '2026-11-12');
    await usuario.type(within(formulario).getByLabelText(/Hora/), '18:30');
    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(registros.posts).toEqual([{ treino_id: 5, data: '2026-11-12', hora: '18:30' }]));
    expect(await screen.findByText('Treino agendado.')).toBeInTheDocument();
    const quinta = await screen.findByRole('region', { name: /^Quinta-feira/ });
    expect(within(quinta).getByText('Saque e recepção')).toBeInTheDocument();
    expect(within(quinta).getByText('18:30')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Agendar treino' })).not.toBeInTheDocument();
  });

  it('sem hora envia null e o item mostra "Sem horário"', async () => {
    const usuario = userEvent.setup();
    const registros = montarApi();
    abrir();
    await screen.findByText('Nenhum treino agendado nesta semana.');
    await usuario.click(screen.getByRole('button', { name: 'Agendar treino' }));
    const formulario = await screen.findByRole('form', { name: 'Agendar treino' });
    const treino = within(formulario).getByRole('combobox', { name: /Treino/ });
    await waitFor(() => expect(within(treino).getByRole('option', { name: 'Bloqueio duplo' })).toBeInTheDocument());
    await usuario.selectOptions(treino, '8');
    await usuario.type(within(formulario).getByLabelText(/Data/), '2026-11-11');
    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(registros.posts).toEqual([{ treino_id: 8, data: '2026-11-11', hora: null }]));
    const quarta = await screen.findByRole('region', { name: /^Quarta-feira/ });
    expect(await within(quarta).findByText('Sem horário')).toBeInTheDocument();
  });

  it('erro 422 do servidor aparece no campo', async () => {
    const usuario = userEvent.setup();
    montarApi();
    servidor.use(
      rede.post('/api/v1/agendamentos', () =>
        HttpResponse.json(
          {
            message: 'Os dados informados são inválidos.',
            errors: { treino_id: ['O treino informado não está disponível.'] },
            request_id: 'r-1',
          },
          { status: 422 },
        ),
      ),
    );
    abrir();
    await screen.findByText('Nenhum treino agendado nesta semana.');
    await usuario.click(screen.getByRole('button', { name: 'Agendar treino' }));
    const formulario = await screen.findByRole('form', { name: 'Agendar treino' });
    const treino = within(formulario).getByRole('combobox', { name: /Treino/ });
    await waitFor(() => expect(within(treino).getByRole('option', { name: 'Saque e recepção' })).toBeInTheDocument());
    await usuario.selectOptions(treino, '5');
    await usuario.type(within(formulario).getByLabelText(/Data/), '2026-11-12');
    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));
    expect(await within(formulario).findByText('O treino informado não está disponível.')).toBeInTheDocument();
    expect(treino).toHaveAttribute('aria-invalid', 'true');
  });

  it('sem treinos para escolher orienta a criar na Biblioteca', async () => {
    const usuario = userEvent.setup();
    montarApi({ meus: [], destaque: [] });
    abrir();
    await screen.findByText('Nenhum treino agendado nesta semana.');
    await usuario.click(screen.getByRole('button', { name: 'Agendar treino' }));
    const formulario = await screen.findByRole('form', { name: 'Agendar treino' });
    expect(
      await within(formulario).findByText('Você ainda não tem treinos. Crie um na Biblioteca.'),
    ).toBeInTheDocument();
    expect(within(formulario).getByRole('link', { name: 'Ir para a Biblioteca' })).toHaveAttribute(
      'href',
      '/biblioteca',
    );
  });

  it('Cancelar fecha o formulario e devolve o foco ao botao', async () => {
    const usuario = userEvent.setup();
    montarApi();
    abrir();
    await screen.findByText('Nenhum treino agendado nesta semana.');
    const agendar = screen.getByRole('button', { name: 'Agendar treino' });
    await usuario.click(agendar);
    const formulario = await screen.findByRole('form', { name: 'Agendar treino' });
    await usuario.click(within(formulario).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('form', { name: 'Agendar treino' })).not.toBeInTheDocument();
    expect(agendar).toHaveFocus();
  });
});

describe('Agenda · editar, remover e concluidos', () => {
  it('Editar abre o formulario preenchido, sem o seletor de treino, e envia o PATCH', async () => {
    const usuario = userEvent.setup();
    const registros = montarApi({ agendamentos: [PENDENTE_HOJE] });
    abrir();
    const quarta = await screen.findByRole('region', { name: /^Quarta-feira/ });
    await usuario.click(within(quarta).getByRole('button', { name: 'Editar' }));
    const formulario = await screen.findByRole('form', { name: 'Editar agendamento' });
    expect(within(formulario).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(formulario).getByText('Saque e recepção')).toBeInTheDocument();
    expect(within(formulario).getByLabelText(/Data/)).toHaveValue('2026-11-11');
    expect(within(formulario).getByLabelText(/Hora/)).toHaveValue('18:30');

    await usuario.clear(within(formulario).getByLabelText(/Hora/));
    await usuario.type(within(formulario).getByLabelText(/Hora/), '20:00');
    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(registros.patches).toEqual([['12', { data: '2026-11-11', hora: '20:00' }]]));
    expect(await screen.findByText('Agendamento atualizado.')).toBeInTheDocument();
    expect(await within(quarta).findByText('20:00')).toBeInTheDocument();
  });

  it('PATCH recusado (422 em "agendamento") aparece como aviso no formulario', async () => {
    const usuario = userEvent.setup();
    montarApi({ agendamentos: [PENDENTE_HOJE] });
    servidor.use(
      rede.patch('/api/v1/agendamentos/:id', () =>
        HttpResponse.json(
          {
            message: 'Este agendamento já foi concluído.',
            errors: { agendamento: ['Este agendamento já foi concluído.'] },
            request_id: 'r-2',
          },
          { status: 422 },
        ),
      ),
    );
    abrir();
    const quarta = await screen.findByRole('region', { name: /^Quarta-feira/ });
    await usuario.click(within(quarta).getByRole('button', { name: 'Editar' }));
    const formulario = await screen.findByRole('form', { name: 'Editar agendamento' });
    await usuario.click(within(formulario).getByRole('button', { name: 'Salvar' }));
    expect(await within(formulario).findByRole('alert')).toHaveTextContent('Este agendamento já foi concluído.');
    expect(screen.queryByText('Agendamento atualizado.')).not.toBeInTheDocument();
  });

  it('Remover abre o modal, confirma, envia o DELETE e o item some', async () => {
    const usuario = userEvent.setup();
    const registros = montarApi({ agendamentos: [PENDENTE_HOJE, PENDENTE_PASSADO] });
    abrir();
    const quarta = await screen.findByRole('region', { name: /^Quarta-feira/ });
    await usuario.click(within(quarta).getByRole('button', { name: 'Remover' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Remover este agendamento?' });
    expect(within(dialogo).getByText(/Saque e recepção/)).toBeInTheDocument();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(registros.deletes).toEqual(['12']));
    await waitFor(() => expect(within(quarta).queryByText('Saque e recepção')).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('Agendamento removido.')).toBeInTheDocument();
    // O da segunda continua.
    expect(
      within(screen.getByRole('region', { name: /^Segunda-feira/ })).getByText('Saque e recepção'),
    ).toBeInTheDocument();
  });

  it('Cancelar no modal nao remove', async () => {
    const usuario = userEvent.setup();
    const registros = montarApi({ agendamentos: [PENDENTE_HOJE] });
    abrir();
    const quarta = await screen.findByRole('region', { name: /^Quarta-feira/ });
    await usuario.click(within(quarta).getByRole('button', { name: 'Remover' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(registros.deletes).toEqual([]);
    expect(within(quarta).getByText('Saque e recepção')).toBeInTheDocument();
  });

  it('item concluido mostra a etiqueta Concluído em texto e nao oferece Iniciar treino nem Editar', async () => {
    montarApi({ agendamentos: [PENDENTE_HOJE, CONCLUIDO_ONTEM, PENDENTE_PASSADO] });
    abrir();
    const terca = await screen.findByRole('region', { name: /^Terça-feira/ });
    const concluido = within(terca).getByRole('listitem');
    expect(within(concluido).getByText('Concluído')).toBeInTheDocument();
    expect(within(concluido).getByText('Sem horário')).toBeInTheDocument();
    expect(within(concluido).queryByRole('link', { name: 'Iniciar treino' })).not.toBeInTheDocument();
    expect(within(concluido).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(within(concluido).getByRole('button', { name: 'Remover' })).toBeInTheDocument();

    const quarta = screen.getByRole('region', { name: /^Quarta-feira/ });
    const pendente = within(quarta).getByRole('listitem');
    expect(within(pendente).getByText('Pendente')).toBeInTheDocument();
    expect(within(pendente).getByRole('link', { name: 'Iniciar treino' })).toHaveAttribute('href', '/treinar/5');

    // Pendente no passado: não dá para iniciar como treino de hoje.
    const segunda = screen.getByRole('region', { name: /^Segunda-feira/ });
    expect(within(segunda).queryByRole('link', { name: 'Iniciar treino' })).not.toBeInTheDocument();
    expect(within(segunda).getByText('Pendente')).toBeInTheDocument();
  });
});

describe('Agenda · acessibilidade', () => {
  it('sem violacoes com a lista, o formulario aberto e o modal fechado', async () => {
    const usuario = userEvent.setup();
    montarApi({ agendamentos: [PENDENTE_HOJE, CONCLUIDO_ONTEM] });
    abrir();
    await screen.findByText('Saque e recepção');
    expect(await axe(document.body)).toHaveNoViolations();
    await usuario.click(screen.getByRole('button', { name: 'Agendar treino' }));
    await screen.findByRole('form', { name: 'Agendar treino' });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('sem violacoes no estado vazio e no erro', async () => {
    montarApi();
    abrir();
    await screen.findByText('Nenhum treino agendado nesta semana.');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
