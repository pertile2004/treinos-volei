import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../app/rotas.jsx';
import {
  aplicar,
  estadoIniciado,
  estadoNoResumo,
  treinoDeExemplo,
} from '../funcionalidades/treino-ativo/apoioDeTeste.js';
import { chaveDoTreinoAtivo } from '../funcionalidades/treino-ativo/armazenamentoDoTreino.js';
import { ACOES, criarEstadoInicial } from '../funcionalidades/treino-ativo/maquinaDoTreino.js';
import { USUARIO_DO_ARMAZENAMENTO } from '../funcionalidades/treino-ativo/navegador.js';
import { renderizarRotas } from '../testes/renderizar.jsx';
import { servidor } from '../testes/servidor.js';

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

const CHAVE = chaveDoTreinoAtivo(USUARIO_DO_ARMAZENAMENTO);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Resposta de GET /treinos/{id} no formato do PR-13.
const TREINO = {
  id: 12,
  nome: 'Recepção básica',
  descricao: null,
  nivel: 'iniciante',
  visibilidade: 'privado',
  duracao_estimada_minutos: 9,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
  itens: [
    {
      id: 40,
      etapa: 'tecnica',
      ordem: 1,
      series: 2,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
      exercicio: { id: 5, nome: 'Manchete na parede', fundamento: 'recepcao', nivel: 'iniciante', removido: false },
    },
    {
      id: 41,
      etapa: 'volta_a_calma',
      ordem: 1,
      series: 1,
      repeticoes: null,
      duracao_segundos: 30,
      descanso_segundos: 0,
      exercicio: { id: 8, nome: 'Prancha', fundamento: 'preparo_fisico', nivel: 'iniciante', removido: true },
    },
  ],
};

// Resposta de POST /sessoes (contrato do PR-16).
const SESSAO = {
  id: 40,
  id_cliente: '0b8f6c1e-3f0a-4a57-9d0e-2a4c6c1f7b11',
  origem: 'cronometro',
  treino: { id: 12, nome: 'Recepção básica' },
  iniciada_em: '2026-11-06T21:00:00Z',
  finalizada_em: '2026-11-06T21:38:10Z',
  duracao_segundos: 2100,
  observacao: null,
  series: [
    {
      id: 301,
      exercicio: { id: 5, nome: 'Manchete na parede', removido: false },
      fundamento: 'recepcao',
      numero: 1,
      repeticoes: 10,
      acertos: 7,
      erros: 3,
      duracao_segundos: 95,
    },
  ],
};

function prepararTreino(treino = TREINO, id = 12) {
  const chamadas = { get: 0 };
  servidor.use(
    rede.get(`/api/v1/treinos/${id}`, () => {
      chamadas.get += 1;
      return HttpResponse.json({ data: treino });
    }),
    rede.get('/api/v1/treinos', () => HttpResponse.json({ data: [], links: {}, meta: {} })),
  );
  return chamadas;
}

/** POST /sessoes respondendo os status na ordem (o último se repete). */
function prepararPost(...status) {
  const recebidos = [];
  servidor.use(
    rede.post('/api/v1/sessoes', async ({ request }) => {
      recebidos.push(await request.json());
      const codigo = status[Math.min(recebidos.length, status.length) - 1] ?? 201;
      if (codigo >= 400) {
        return HttpResponse.json({ message: 'Erro interno.', request_id: 'req-500' }, { status: codigo });
      }
      return HttpResponse.json({ data: SESSAO }, { status: codigo });
    }),
  );
  return recebidos;
}

const lerSalvo = () => JSON.parse(localStorage.getItem(CHAVE));
const guardar = (estado) => localStorage.setItem(CHAVE, JSON.stringify(estado));
const botao = (nome) => screen.getByRole('button', { name: nome });
const titulo = (nome) => screen.getByRole('heading', { level: 2, name: nome });
const contador = (nome) => screen.getByRole('status', { name: nome });
const anuncio = () => screen.getByTestId('anuncio-da-fase');

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

function usarRelogioFalso() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function abrirEIniciar(usuario) {
  const chamadas = prepararTreino();
  const roteador = renderizarRotas(rotas, '/treinar/12');
  await usuario.click(await screen.findByRole('button', { name: 'Iniciar treino' }));
  await screen.findByText('Série 1 de 2');
  return { roteador, chamadas };
}

describe('/treinar/:treinoId — carregar o treino', () => {
  it('mostra carregando e depois a preparação com o retrato do treino', async () => {
    prepararTreino();
    renderizarRotas(rotas, '/treinar/12');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando treino…');
    expect(await screen.findByRole('heading', { level: 2, name: 'Recepção básica' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Treino ativo' })).toBeInTheDocument();
    expect(document.title).toBe('Treino ativo · VOLLEY PRO');
    const itens = within(screen.getByRole('main')).getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('Manchete na parede');
    expect(itens[0]).toHaveTextContent('2 séries × 10 repetições · descanso 45 s');
    expect(itens[1]).toHaveTextContent('Prancha');
    expect(itens[1]).toHaveTextContent('removido da biblioteca');
    expect(itens[1]).toHaveTextContent('1 série × 30 s · sem descanso');
    expect(botao('Iniciar treino')).toHaveClass('min-h-11');
    expect(screen.getByRole('checkbox', { name: 'Vibrar ao fim do descanso' })).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/treino');
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('404 mostra "Treino não encontrado." com o Voltar', async () => {
    servidor.use(
      rede.get('/api/v1/treinos/12', () =>
        HttpResponse.json({ message: 'Não encontrado.', request_id: 'r-404' }, { status: 404 }),
      ),
    );
    renderizarRotas(rotas, '/treinar/12');
    expect(await screen.findByRole('heading', { level: 2, name: 'Treino não encontrado.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/treino');
    expect(screen.getByRole('heading', { level: 1, name: 'Treino ativo' })).toBeInTheDocument();
  });

  it('erro de rede mostra a mensagem com Tentar de novo, que recarrega', async () => {
    const usuario = userEvent.setup();
    let falhar = true;
    servidor.use(
      rede.get('/api/v1/treinos/12', () => {
        if (falhar) return HttpResponse.json({ message: 'Erro.', request_id: 'r-500' }, { status: 500 });
        return HttpResponse.json({ data: TREINO });
      }),
    );
    renderizarRotas(rotas, '/treinar/12');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar o treino.');
    expect(alerta).toHaveTextContent('Código do erro: r-500');
    falhar = false;
    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('button', { name: 'Iniciar treino' })).toBeInTheDocument();
  });

  it('treino sem exercícios mostra o vazio com Voltar', async () => {
    prepararTreino({ ...TREINO, itens: [] });
    renderizarRotas(rotas, '/treinar/12');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Este treino não tem exercícios.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/treino');
  });
});

describe('/treinar/:treinoId — sequência do treino', () => {
  it('percorre preparação → exercício → descanso → exercício → próximo → resumo e salva a sessão', async () => {
    const usuario = usarRelogioFalso();
    const recebidos = prepararPost(201);
    const { roteador } = await abrirEIniciar(usuario);

    // Exercício 1, série 1: título com foco, progresso e cronômetro.
    expect(screen.getByText('Exercício 1 de 2')).toBeInTheDocument();
    expect(titulo('Manchete na parede')).toHaveFocus();
    expect(screen.getByRole('progressbar', { name: 'Progresso do treino' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('timer', { name: 'Tempo da série' })).toHaveTextContent('00:00');
    expect(anuncio()).toHaveTextContent('Exercício 1 de 2, Série 1 de 2: Manchete na parede');

    // Acertos, erros e desfazer.
    expect(botao('Desfazer')).toBeDisabled();
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('+ Erro'));
    expect(contador('Acertos')).toHaveTextContent('2');
    expect(contador('Erros')).toHaveTextContent('1');
    await usuario.click(botao('Desfazer'));
    expect(contador('Erros')).toHaveTextContent('0');
    await usuario.click(botao('Desfazer'));
    await usuario.click(botao('Desfazer'));
    expect(contador('Acertos')).toHaveTextContent('0');
    expect(botao('Desfazer')).toBeDisabled();
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('+ Erro'));
    for (const nome of ['+ Acerto', '+ Erro', 'Concluir série']) expect(botao(nome)).toHaveClass('min-h-11');

    // Séries não descem abaixo da série atual; repetições ajustam a série.
    const series = screen.getByRole('group', { name: 'Séries' });
    await usuario.click(within(series).getByRole('button', { name: 'Diminuir Séries' }));
    expect(within(series).getByRole('status')).toHaveTextContent('1');
    expect(within(series).getByRole('button', { name: 'Diminuir Séries' })).toBeDisabled();
    await usuario.click(within(series).getByRole('button', { name: 'Aumentar Séries' }));
    expect(screen.getByText('Série 1 de 2')).toBeInTheDocument();
    const repeticoes = screen.getByRole('group', { name: 'Repetições' });
    await usuario.click(within(repeticoes).getByRole('button', { name: 'Aumentar Repetições' }));
    expect(within(repeticoes).getByRole('status')).toHaveTextContent('11');

    // Pausar congela o relógio.
    await usuario.click(botao('Pausar'));
    expect(botao('Continuar')).toHaveAttribute('aria-pressed', 'true');
    await usuario.click(botao('Continuar'));

    // Descanso: 45 s, +15 s e pular.
    await usuario.click(botao('Concluir série'));
    expect(titulo('Descanso')).toHaveFocus();
    expect(screen.getByRole('timer', { name: 'Descanso' })).toHaveTextContent('00:45');
    expect(screen.getByText('A seguir: Série 2 de 2 de Manchete na parede')).toBeInTheDocument();
    for (const nome of ['Pular', '+15 s']) expect(botao(nome)).toHaveClass('min-h-11');
    await usuario.click(botao('+15 s'));
    expect(screen.getByRole('timer', { name: 'Descanso' })).toHaveTextContent('01:00');
    await usuario.click(botao('Pular'));
    expect(screen.getByText('Série 2 de 2')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Repetições' })).getByRole('status')).toHaveTextContent('11');
    expect(screen.getByRole('progressbar', { name: 'Progresso do treino' })).toHaveAttribute('aria-valuenow', '33');
    expect(anuncio()).not.toHaveTextContent('Descanso encerrado');

    // Última série do exercício 1 → descanso → próximo exercício (removido, mas executável).
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('Concluir série'));
    expect(screen.getByText('A seguir: Prancha')).toBeInTheDocument();
    await usuario.click(botao('Pular'));
    expect(titulo('Próximo exercício')).toHaveFocus();
    expect(screen.getByText('Prancha')).toBeInTheDocument();
    expect(screen.getByText('removido da biblioteca')).toBeInTheDocument();
    expect(screen.getByText('1 série × 30 s · sem descanso')).toBeInTheDocument();
    await usuario.click(botao('Começar'));
    expect(screen.getByText('Exercício 2 de 2')).toBeInTheDocument();
    expect(titulo(/^Prancha/)).toHaveFocus();
    expect(titulo(/^Prancha/)).toHaveTextContent('removido da biblioteca');
    expect(screen.queryByRole('group', { name: 'Repetições' })).not.toBeInTheDocument();
    expect(screen.getByText('Duração prevista: 30 s')).toBeInTheDocument();

    // Última série do último exercício → resumo direto, sem descanso.
    await usuario.click(botao('Concluir série'));
    expect(titulo('Resumo do treino')).toHaveFocus();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    const linhas = within(screen.getByRole('main')).getAllByRole('listitem');
    expect(linhas[0]).toHaveTextContent('Manchete na parede');
    expect(linhas[0]).toHaveTextContent('2 séries · 3 acertos · 1 erro');
    expect(linhas[1]).toHaveTextContent('Prancha');
    expect(linhas[1]).toHaveTextContent('removido da biblioteca');
    expect(linhas[1]).toHaveTextContent('1 série · 0 acertos · 0 erros');
    expect(screen.queryByText(/ponto|medalha|sequência/i)).not.toBeInTheDocument();
    await usuario.type(screen.getByRole('textbox', { name: 'Observação (opcional)' }), 'Bom treino');
    expect(lerSalvo().observacao).toBe('Bom treino');

    // Salvar: corpo do contrato, limpeza do storage e volta para a página Treino.
    await usuario.click(botao('Finalizar e salvar treino'));
    expect(await screen.findByRole('status')).toHaveTextContent('Treino salvo.');
    expect(roteador.state.location.pathname).toBe('/treino');
    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(recebidos).toHaveLength(1);
    const corpo = recebidos[0];
    expect(corpo.id_cliente).toMatch(UUID);
    expect(corpo).toMatchObject({ origem: 'cronometro', treino_id: 12, observacao: 'Bom treino' });
    expect(Date.parse(corpo.iniciada_em)).not.toBeNaN();
    expect(Date.parse(corpo.finalizada_em)).toBeGreaterThanOrEqual(Date.parse(corpo.iniciada_em));
    expect(Number.isInteger(corpo.duracao_segundos)).toBe(true);
    expect(corpo.series.map((serie) => [serie.exercicio_id, serie.numero, serie.acertos, serie.erros])).toEqual([
      [5, 1, 2, 1],
      [5, 2, 1, 0],
      [8, 1, 0, 0],
    ]);
    expect(corpo.series[0]).toMatchObject({ repeticoes: 11 });
    expect(corpo.series[2]).toMatchObject({ repeticoes: null });
    for (const serie of corpo.series) expect(Number.isInteger(serie.duracao_segundos)).toBe(true);
  });

  it('o descanso termina sozinho, anuncia "Descanso encerrado" e vibra só com a opção ligada', async () => {
    const usuario = usarRelogioFalso();
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true });
    try {
      await abrirEIniciar(usuario);
      await usuario.click(botao('Concluir série'));
      act(() => vi.advanceTimersByTime(46_000));
      expect(screen.getByText('Série 2 de 2')).toBeInTheDocument();
      expect(anuncio()).toHaveTextContent('Descanso encerrado. Exercício 1 de 2, Série 2 de 2: Manchete na parede');
      expect(vibrate).not.toHaveBeenCalled();

      // Volta ao descanso ajustando as séries para 3 e ligando a vibração.
      await usuario.click(
        within(screen.getByRole('group', { name: 'Séries' })).getByRole('button', { name: 'Aumentar Séries' }),
      );
      await usuario.click(botao('Concluir série'));
      await usuario.click(screen.getByRole('checkbox', { name: 'Vibrar ao fim do descanso' }));
      expect(lerSalvo().vibrar).toBe(true);
      act(() => vi.advanceTimersByTime(46_000));
      expect(screen.getByText('Série 3 de 3')).toBeInTheDocument();
      expect(vibrate).toHaveBeenCalledTimes(1);
    } finally {
      delete navigator.vibrate;
    }
  });

  it('o aria-live do cronômetro muda uma vez por minuto, não a cada segundo', async () => {
    const usuario = usarRelogioFalso();
    await abrirEIniciar(usuario);
    const regiao = screen.getByText('Tempo da série: menos de 1 minuto');
    expect(regiao).toHaveAttribute('aria-live', 'polite');
    act(() => vi.advanceTimersByTime(59_000));
    expect(regiao).toHaveTextContent('Tempo da série: menos de 1 minuto');
    expect(screen.getByRole('timer', { name: 'Tempo da série' })).toHaveTextContent(/^00:5[89]$/);
    expect(screen.getByRole('timer', { name: 'Tempo da série' })).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(2000));
    expect(regiao).toHaveTextContent('Tempo da série: 1 minuto');
    expect(screen.getByRole('timer', { name: 'Tempo da série' })).toHaveTextContent(/^01:0[01]$/);
  });

  it('Sair do treino pede confirmação, limpa o storage e volta para a página Treino', async () => {
    const usuario = usarRelogioFalso();
    const { roteador } = await abrirEIniciar(usuario);
    await usuario.click(botao('+ Acerto'));
    expect(lerSalvo()).not.toBeNull();
    await usuario.click(botao('Sair do treino'));
    const dialogo = screen.getByRole('dialog', { name: 'Sair do treino?' });
    await usuario.click(within(dialogo).getByRole('button', { name: 'Continuar treinando' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(lerSalvo()).not.toBeNull();
    await usuario.click(botao('Sair do treino'));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' }));
    expect(roteador.state.location.pathname).toBe('/treino');
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});

describe('/treinar/:treinoId — estado guardado no aparelho', () => {
  it('cada ação grava no localStorage e recarregar a página restaura fase, série e contadores sem rede', async () => {
    const usuario = usarRelogioFalso();
    const { chamadas } = await abrirEIniciar(usuario);
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('+ Acerto'));
    await usuario.click(botao('+ Erro'));
    await usuario.click(botao('Concluir série'));
    await usuario.click(botao('Pular'));
    await usuario.click(botao('+ Acerto'));
    expect(lerSalvo()).toMatchObject({ fase: 'exercicio', serie_atual: 2, atual: { acertos: 1, erros: 0 } });
    expect(chamadas.get).toBe(1);
    cleanup();

    renderizarRotas(rotas, '/treinar/12');
    expect(screen.getByText('Série 2 de 2')).toBeInTheDocument();
    expect(contador('Acertos')).toHaveTextContent('1');
    expect(screen.queryByText('Carregando treino…')).not.toBeInTheDocument();
    expect(chamadas.get).toBe(1);
  });

  it('JSON corrompido no storage é descartado e a tela começa da preparação', async () => {
    localStorage.setItem(CHAVE, '{isso nao e json');
    prepararTreino();
    renderizarRotas(rotas, '/treinar/12');
    expect(await screen.findByRole('button', { name: 'Iniciar treino' })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('falha no POST mantém o estado; Tentar de novo reenvia o mesmo id_cliente; o sucesso limpa a chave', async () => {
    const usuario = userEvent.setup();
    const recebidos = prepararPost(500, 201);
    servidor.use(rede.get('/api/v1/treinos', () => HttpResponse.json({ data: [], links: {}, meta: {} })));
    guardar(estadoNoResumo());
    const roteador = renderizarRotas(rotas, '/treinar/12');

    expect(titulo('Resumo do treino')).toBeInTheDocument();
    await usuario.click(botao('Finalizar e salvar treino'));
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível salvar. Seu treino continua guardado neste aparelho.');
    expect(alerta).toHaveTextContent('Código do erro: req-500');
    expect(lerSalvo()).toMatchObject({ fase: 'resumo', id_cliente: 'id-do-teste' });
    expect(roteador.state.location.pathname).toBe('/treinar/12');

    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Treino salvo.');
    expect(recebidos).toHaveLength(2);
    expect(recebidos[1]).toEqual(recebidos[0]);
    expect(recebidos[0].id_cliente).toBe('id-do-teste');
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('com outro treino em andamento, oferece Retomar ou Descartar e iniciar este', async () => {
    const usuario = userEvent.setup();
    prepararTreino({ ...TREINO, id: 13, nome: 'Saque' }, 13);
    guardar(estadoIniciado());
    const roteador = renderizarRotas(rotas, '/treinar/13');
    const dialogo = await screen.findByRole('dialog', { name: 'Você tem um treino em andamento' });
    expect(dialogo).toHaveTextContent('"Recepção básica" ainda não foi finalizado.');
    expect(screen.queryByRole('button', { name: 'Iniciar treino' })).not.toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole('button', { name: 'Retomar' }));
    expect(roteador.state.location.pathname).toBe('/treinar/12');
    expect(await screen.findByText('Série 1 de 2')).toBeInTheDocument();
    expect(lerSalvo().treino_id).toBe(12);
    cleanup();

    prepararTreino({ ...TREINO, id: 13, nome: 'Saque' }, 13);
    renderizarRotas(rotas, '/treinar/13');
    const segundoDialogo = await screen.findByRole('dialog', { name: 'Você tem um treino em andamento' });
    await usuario.click(within(segundoDialogo).getByRole('button', { name: 'Descartar e iniciar este' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Saque' })).toBeInTheDocument();
    expect(botao('Iniciar treino')).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});

describe('/treinar/:treinoId — acessibilidade', () => {
  const agora = Date.now();
  const inicio = { tipo: ACOES.INICIAR, agora, id_cliente: 'id-do-teste' };
  const fases = [
    ['exercício', () => aplicar(criarEstadoInicial(treinoDeExemplo()), inicio, { tipo: ACOES.MAIS_ACERTO })],
    [
      'descanso',
      () => aplicar(criarEstadoInicial(treinoDeExemplo()), inicio, { tipo: ACOES.CONCLUIR_SERIE, agora: agora + 1000 }),
    ],
    [
      'próximo exercício',
      () =>
        aplicar(
          criarEstadoInicial(treinoDeExemplo()),
          inicio,
          { tipo: ACOES.CONCLUIR_SERIE, agora: agora + 1000 },
          { tipo: ACOES.PULAR, agora: agora + 2000 },
          { tipo: ACOES.CONCLUIR_SERIE, agora: agora + 3000 },
        ),
    ],
    ['resumo', () => estadoNoResumo()],
  ];

  it('a preparação não tem violações', async () => {
    prepararTreino();
    renderizarRotas(rotas, '/treinar/12');
    await screen.findByRole('button', { name: 'Iniciar treino' });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it.each(fases)('a fase %s não tem violações', async (nome, criar) => {
    guardar(criar());
    renderizarRotas(rotas, '/treinar/12');
    await screen.findByRole('heading', { level: 1, name: 'Treino ativo' });
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('o modal de sair não tem violações', async () => {
    const usuario = userEvent.setup();
    guardar(fases[0][1]());
    renderizarRotas(rotas, '/treinar/12');
    await usuario.click(await screen.findByRole('button', { name: 'Sair do treino' }));
    expect(screen.getByRole('dialog', { name: 'Sair do treino?' })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
