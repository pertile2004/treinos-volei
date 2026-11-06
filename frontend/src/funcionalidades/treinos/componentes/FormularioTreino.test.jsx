import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http as rede, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { definirNavegacao } from '../../../lib/http.js';
import { renderizarRotas } from '../../../testes/renderizar.jsx';
import { servidor } from '../../../testes/servidor.js';
import {
  MANCHETE,
  registrarCriarTreino,
  registrarErroAoCriar,
  registrarExercicios,
  registrarReferencias,
} from '../apoioDeTeste.js';
import FormularioTreino from './FormularioTreino.jsx';

// Na aplicação o formulário fica dentro do <main> do AppShell (o axe exige um landmark).
function renderizar(props = {}) {
  registrarReferencias();
  const aoCriar = vi.fn();
  renderizarRotas(
    [
      {
        path: '/treinos/novo',
        element: (
          <main>
            <FormularioTreino aoCriar={aoCriar} {...props} />
          </main>
        ),
      },
    ],
    '/treinos/novo',
  );
  return { aoCriar };
}

async function esperarFormulario() {
  return screen.findByLabelText('Nome do treino');
}

function secaoDaEtapa(rotulo) {
  return screen.getByRole('region', { name: rotulo });
}

function botaoAdicionarEm(rotulo) {
  return screen.getByRole('button', { name: `Adicionar exercício em ${rotulo}` });
}

/** Abre o seletor da etapa, adiciona o exercício pelo nome e fecha o seletor. */
async function adicionar(usuario, etapa, nomeDoExercicio) {
  await usuario.click(botaoAdicionarEm(etapa));
  await usuario.click(await screen.findByRole('button', { name: `Adicionar ${nomeDoExercicio}` }));
  await usuario.click(screen.getByRole('button', { name: 'Fechar seletor de exercícios' }));
}

function itensDaEtapa(rotulo) {
  return within(secaoDaEtapa(rotulo)).queryAllByRole('listitem', { name: /.+/ });
}

async function preencherCabecalho(usuario) {
  await usuario.type(screen.getByLabelText('Nome do treino'), 'Recepção e saque');
  await usuario.selectOptions(screen.getByLabelText('Nível'), 'intermediario');
}

describe('FormularioTreino — estados iniciais', () => {
  it('mostra carregando enquanto as referencias nao chegam e depois o formulario', async () => {
    servidor.use(
      rede.get('/api/v1/referencias', async () => {
        await delay(50);
        return HttpResponse.json({ data: (await import('../apoioDeTeste.js')).REFERENCIAS });
      }),
    );
    renderizarRotas([{ path: '/', element: <FormularioTreino /> }]);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
    await esperarFormulario();
    expect(screen.getByLabelText('Descrição (opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Nível')).toBeInTheDocument();
    for (const etapa of ['Aquecimento', 'Técnica', 'Específico', 'Volta à calma']) {
      expect(within(secaoDaEtapa(etapa)).getByText('Nenhum exercício nesta etapa.')).toBeInTheDocument();
      expect(botaoAdicionarEm(etapa)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Salvar treino' })).toHaveClass('min-h-11');
  });

  it('com erro ao carregar as referencias mostra a mensagem com o codigo e tenta de novo', async () => {
    let tentativas = 0;
    servidor.use(
      rede.get('/api/v1/referencias', async () => {
        tentativas += 1;
        if (tentativas === 1) {
          return HttpResponse.json({ message: 'Serviço indisponível.', request_id: 'req-503' }, { status: 503 });
        }
        return HttpResponse.json({ data: (await import('../apoioDeTeste.js')).REFERENCIAS });
      }),
    );
    renderizarRotas([{ path: '/', element: <FormularioTreino /> }]);
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar os dados do formulário.');
    expect(alerta).toHaveTextContent('Código do erro: req-503');
    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    await esperarFormulario();
  });

  it('as opcoes de nivel vem do GET /referencias', async () => {
    renderizar();
    await esperarFormulario();
    const opcoes = within(screen.getByLabelText('Nível')).getAllByRole('option');
    expect(opcoes.map((opcao) => opcao.textContent)).toEqual([
      'Escolha o nível',
      'Iniciante',
      'Intermediário',
      'Avançado',
    ]);
  });
});

describe('FormularioTreino — visibilidade conforme o papel', () => {
  it('jogador nao escolhe: ve so "Privado" sem campo', async () => {
    renderizar({ papel: 'jogador' });
    await esperarFormulario();
    expect(screen.queryByLabelText('Visibilidade')).not.toBeInTheDocument();
    expect(screen.getByText(/Visibilidade:/).parentElement).toHaveTextContent('Visibilidade: Privado');
  });

  it('treinador escolhe entre Privado e Atletas', async () => {
    renderizar({ papel: 'treinador' });
    await esperarFormulario();
    const opcoes = within(screen.getByLabelText('Visibilidade')).getAllByRole('option');
    expect(opcoes.map((opcao) => [opcao.value, opcao.textContent])).toEqual([
      ['privado', 'Privado'],
      ['atletas', 'Atletas'],
    ]);
    expect(screen.getByLabelText('Visibilidade')).toHaveValue('privado');
  });

  it('admin escolhe entre as tres; sem papel conhecido tambem (o servidor decide)', async () => {
    renderizar({ papel: 'admin' });
    await esperarFormulario();
    expect(within(screen.getByLabelText('Visibilidade')).getAllByRole('option')).toHaveLength(3);
  });

  it('sem papel conhecido mostra as tres opcoes', async () => {
    renderizar();
    await esperarFormulario();
    expect(
      within(screen.getByLabelText('Visibilidade'))
        .getAllByRole('option')
        .map((opcao) => opcao.textContent),
    ).toEqual(['Privado', 'Atletas', 'Público']);
  });
});

describe('FormularioTreino — seletor de exercicios', () => {
  it('abre o seletor da etapa com foco na busca e lista os exercicios com o padrao de cada um', async () => {
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios(undefined, { espera: 50 });
    await esperarFormulario();

    const botao = botaoAdicionarEm('Técnica');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    await usuario.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');

    const seletor = screen.getByRole('region', { name: 'Seletor de exercícios para Técnica' });
    expect(within(seletor).getByLabelText('Buscar exercício')).toHaveFocus();
    expect(within(seletor).getByRole('status')).toHaveTextContent('Carregando exercícios…');

    const lista = await within(seletor).findByRole('list', { name: 'Exercícios da biblioteca' });
    const itens = within(lista).getAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(itens[0]).toHaveTextContent('Recepção em manchete');
    expect(itens[0]).toHaveTextContent('Recepção');
    expect(itens[0]).toHaveTextContent('Iniciante');
    expect(itens[0]).toHaveTextContent('3 séries × 10 repetições · descanso 45 s');
    expect(itens[1]).toHaveTextContent('2 séries × 60 s · descanso 30 s');
    expect(within(itens[0]).getByRole('button', { name: 'Adicionar Recepção em manchete' })).toHaveClass('min-h-8');
  });

  it('so um seletor fica aberto por vez e fechar devolve o foco ao botao da etapa', async () => {
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios();
    await esperarFormulario();

    await usuario.click(botaoAdicionarEm('Aquecimento'));
    await screen.findByRole('list', { name: 'Exercícios da biblioteca' });
    await usuario.click(botaoAdicionarEm('Técnica'));
    expect(screen.getAllByRole('region', { name: /Seletor de exercícios/ })).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Seletor de exercícios para Técnica' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Fechar seletor de exercícios' }));
    expect(screen.queryByRole('region', { name: /Seletor de exercícios/ })).not.toBeInTheDocument();
    expect(botaoAdicionarEm('Técnica')).toHaveFocus();
  });

  it('busca (com espera), chips de fundamento e nivel e paginacao chamam a API com os filtros', async () => {
    const usuario = userEvent.setup();
    renderizar();
    const pedidos = registrarExercicios(undefined, { porPagina: 2 });
    await esperarFormulario();
    await usuario.click(botaoAdicionarEm('Técnica'));
    const seletor = screen.getByRole('region', { name: 'Seletor de exercícios para Técnica' });
    await within(seletor).findByRole('list', { name: 'Exercícios da biblioteca' });
    expect(pedidos.at(-1)).toEqual({ page: '1' });

    // Paginação: 3 exercícios em páginas de 2.
    const paginacao = within(seletor).getByRole('navigation', { name: 'Páginas de exercícios' });
    expect(within(paginacao).getByText('Página 1 de 2')).toBeInTheDocument();
    expect(within(paginacao).getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await usuario.click(within(paginacao).getByRole('button', { name: 'Próxima página' }));
    await within(seletor).findByText('Saque por baixo');
    expect(pedidos.at(-1)).toEqual({ page: '2' });
    expect(within(paginacao).getByRole('button', { name: 'Próxima página' })).toBeDisabled();

    // Chip de fundamento volta para a página 1.
    const fundamento = within(seletor).getByRole('group', { name: 'Fundamento' });
    expect(within(fundamento).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
    await usuario.click(within(fundamento).getByRole('button', { name: 'Recepção' }));
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ fundamento: 'recepcao', page: '1' }));
    expect(within(fundamento).getByRole('button', { name: 'Recepção' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(fundamento).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() =>
      expect(within(seletor).queryByRole('navigation', { name: 'Páginas de exercícios' })).not.toBeInTheDocument(),
    );

    // Clicar de novo no mesmo chip limpa o filtro; o chip de nível soma.
    await usuario.click(within(fundamento).getByRole('button', { name: 'Recepção' }));
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ page: '1' }));
    const nivel = within(seletor).getByRole('group', { name: 'Nível' });
    await usuario.click(within(nivel).getByRole('button', { name: 'Iniciante' }));
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ nivel: 'iniciante', page: '1' }));

    // Busca com espera: um pedido só, com o termo inteiro.
    const quantidadeAntes = pedidos.length;
    await usuario.type(within(seletor).getByLabelText('Buscar exercício'), 'manchete');
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ nivel: 'iniciante', busca: 'manchete', page: '1' }));
    expect(pedidos.length).toBe(quantidadeAntes + 1);
  });

  it('busca sem resultado mostra o vazio', async () => {
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios();
    await esperarFormulario();
    await usuario.click(botaoAdicionarEm('Técnica'));
    await screen.findByRole('list', { name: 'Exercícios da biblioteca' });
    await usuario.type(screen.getByLabelText('Buscar exercício'), 'xyz');
    expect(await screen.findByText('Nenhum exercício encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Exercícios da biblioteca' })).not.toBeInTheDocument();
  });

  it('erro ao carregar mostra a mensagem com o codigo e "Tentar de novo" refaz o pedido', async () => {
    const usuario = userEvent.setup();
    renderizar();
    let tentativas = 0;
    servidor.use(
      rede.get('/api/v1/exercicios', () => {
        tentativas += 1;
        if (tentativas === 1) {
          return HttpResponse.json({ message: 'Erro interno do servidor.', request_id: 'req-500' }, { status: 500 });
        }
        return HttpResponse.json({
          data: [MANCHETE],
          links: {},
          meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
        });
      }),
    );
    await esperarFormulario();
    await usuario.click(botaoAdicionarEm('Técnica'));
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar os exercícios.');
    expect(alerta).toHaveTextContent('Código do erro: req-500');
    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Recepção em manchete')).toBeInTheDocument();
  });
});

describe('FormularioTreino — montagem do treino', () => {
  it('adiciona um exercicio a etapa com os padroes dele e anuncia', async () => {
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios();
    await esperarFormulario();

    await usuario.click(botaoAdicionarEm('Técnica'));
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar Recepção em manchete' }));

    const [item] = itensDaEtapa('Técnica');
    expect(item).toBeInTheDocument();
    expect(within(item).getByRole('heading', { name: 'Recepção em manchete' })).toBeInTheDocument();
    expect(within(item).getByText('Recepção')).toBeInTheDocument();
    expect(within(item).getByRole('group', { name: 'Séries' })).toHaveTextContent('3');
    expect(within(item).getByRole('group', { name: 'Repetições' })).toHaveTextContent('10');
    expect(within(item).queryByRole('group', { name: 'Duração em segundos' })).not.toBeInTheDocument();
    expect(within(item).getByRole('group', { name: 'Descanso em segundos' })).toHaveTextContent('45');
    expect(within(item).getByRole('radio', { name: 'Repetições' })).toBeChecked();
    expect(screen.getByRole('status', { name: 'Avisos do treino' })).toHaveTextContent(
      'Recepção em manchete adicionado em Técnica, posição 1.',
    );
    expect(within(secaoDaEtapa('Técnica')).queryByText('Nenhum exercício nesta etapa.')).not.toBeInTheDocument();

    // Exercício por duração entra com a duração e sem repetições.
    await usuario.click(screen.getByRole('button', { name: 'Adicionar Deslocamento lateral' }));
    const [, segundo] = itensDaEtapa('Técnica');
    expect(within(segundo).getByRole('group', { name: 'Duração em segundos' })).toHaveTextContent('60');
    expect(within(segundo).queryByRole('group', { name: 'Repetições' })).not.toBeInTheDocument();
    expect(within(segundo).getByRole('radio', { name: 'Duração' })).toBeChecked();
    expect(within(segundo).getByRole('group', { name: 'Séries' })).toHaveTextContent('2');
  });

  it('botoes subir e descer reordenam, respeitam as bordas e o corpo enviado tem a ordem sequencial por etapa', async () => {
    const usuario = userEvent.setup();
    const { aoCriar } = renderizar();
    registrarExercicios();
    const corpos = registrarCriarTreino();
    await esperarFormulario();
    await preencherCabecalho(usuario);

    await adicionar(usuario, 'Aquecimento', 'Deslocamento lateral');
    await usuario.click(botaoAdicionarEm('Técnica'));
    await usuario.click(await screen.findByRole('button', { name: 'Adicionar Recepção em manchete' }));
    await usuario.click(screen.getByRole('button', { name: 'Adicionar Saque por baixo' }));
    await usuario.click(screen.getByRole('button', { name: 'Adicionar Deslocamento lateral' }));
    await usuario.click(screen.getByRole('button', { name: 'Fechar seletor de exercícios' }));

    const nomes = () => itensDaEtapa('Técnica').map((item) => within(item).getByRole('heading').textContent);
    expect(nomes()).toEqual(['Recepção em manchete', 'Saque por baixo', 'Deslocamento lateral']);

    // Único na etapa: nem sobe nem desce.
    const [aquecimento] = itensDaEtapa('Aquecimento');
    expect(within(aquecimento).getByRole('button', { name: 'Mover Deslocamento lateral para cima' })).toBeDisabled();
    expect(within(aquecimento).getByRole('button', { name: 'Mover Deslocamento lateral para baixo' })).toBeDisabled();

    // Primeiro não sobe; último não desce.
    let [primeiro, , ultimo] = itensDaEtapa('Técnica');
    expect(within(primeiro).getByRole('button', { name: 'Mover Recepção em manchete para cima' })).toBeDisabled();
    expect(within(primeiro).getByRole('button', { name: 'Mover Recepção em manchete para baixo' })).toBeEnabled();
    expect(within(ultimo).getByRole('button', { name: 'Mover Deslocamento lateral para baixo' })).toBeDisabled();

    await usuario.click(within(primeiro).getByRole('button', { name: 'Mover Recepção em manchete para baixo' }));
    expect(nomes()).toEqual(['Saque por baixo', 'Recepção em manchete', 'Deslocamento lateral']);
    expect(screen.getByRole('status', { name: 'Avisos do treino' })).toHaveTextContent(
      'Recepção em manchete movido para a posição 2 de 3 em Técnica.',
    );

    [, , ultimo] = itensDaEtapa('Técnica');
    await usuario.click(within(ultimo).getByRole('button', { name: 'Mover Deslocamento lateral para cima' }));
    expect(nomes()).toEqual(['Saque por baixo', 'Deslocamento lateral', 'Recepção em manchete']);

    // Ao chegar à borda o foco não se perde: vai para o botão irmão.
    [primeiro] = itensDaEtapa('Técnica');
    await usuario.click(within(primeiro).getByRole('button', { name: 'Mover Saque por baixo para baixo' }));
    await usuario.click(screen.getByRole('button', { name: 'Mover Saque por baixo para baixo' }));
    expect(nomes()).toEqual(['Deslocamento lateral', 'Recepção em manchete', 'Saque por baixo']);
    expect(screen.getByRole('button', { name: 'Mover Saque por baixo para cima' })).toHaveFocus();

    // Remover renumera a etapa e anuncia.
    await usuario.click(screen.getByRole('button', { name: 'Remover Recepção em manchete' }));
    expect(nomes()).toEqual(['Deslocamento lateral', 'Saque por baixo']);
    expect(screen.getByRole('status', { name: 'Avisos do treino' })).toHaveTextContent(
      'Recepção em manchete removido de Técnica.',
    );

    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));
    await waitFor(() => expect(aoCriar).toHaveBeenCalledTimes(1));
    expect(corpos).toHaveLength(1);
    expect(corpos[0]).toEqual({
      nome: 'Recepção e saque',
      descricao: null,
      nivel: 'intermediario',
      visibilidade: 'privado',
      itens: [
        {
          exercicio_id: 7,
          etapa: 'aquecimento',
          ordem: 1,
          series: 2,
          repeticoes: null,
          duracao_segundos: 60,
          descanso_segundos: 30,
        },
        {
          exercicio_id: 7,
          etapa: 'tecnica',
          ordem: 1,
          series: 2,
          repeticoes: null,
          duracao_segundos: 60,
          descanso_segundos: 30,
        },
        {
          exercicio_id: 21,
          etapa: 'tecnica',
          ordem: 2,
          series: 10,
          repeticoes: 100,
          duracao_segundos: null,
          descanso_segundos: 600,
        },
      ],
    });
    expect(aoCriar).toHaveBeenCalledWith(expect.objectContaining({ id: 12, nome: 'Recepção e saque' }));
  });

  it('os Steppers respeitam os limites do card e a medida alterna entre repeticoes e duracao', async () => {
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios();
    await esperarFormulario();
    await adicionar(usuario, 'Específico', 'Saque por baixo');
    const [item] = itensDaEtapa('Específico');

    // Padrões do exercício já nos máximos: aumentar desabilitado (1–10, 1–100, 0–600).
    const series = within(item).getByRole('group', { name: 'Séries' });
    expect(series).toHaveTextContent('10');
    expect(within(series).getByRole('button', { name: 'Aumentar Séries' })).toBeDisabled();
    await usuario.click(within(series).getByRole('button', { name: 'Diminuir Séries' }));
    expect(series).toHaveTextContent('9');

    const repeticoes = within(item).getByRole('group', { name: 'Repetições' });
    expect(repeticoes).toHaveTextContent('100');
    expect(within(repeticoes).getByRole('button', { name: 'Aumentar Repetições' })).toBeDisabled();

    const descanso = within(item).getByRole('group', { name: 'Descanso em segundos' });
    expect(descanso).toHaveTextContent('600');
    expect(within(descanso).getByRole('button', { name: 'Aumentar Descanso em segundos' })).toBeDisabled();
    await usuario.click(within(descanso).getByRole('button', { name: 'Diminuir Descanso em segundos' }));
    expect(descanso).toHaveTextContent('595');

    // Mínimos: séries 1 e descanso 0 (exercício com descanso de 30 s, passo de 5 s).
    await adicionar(usuario, 'Específico', 'Deslocamento lateral');
    const [, segundo] = itensDaEtapa('Específico');
    const seriesDoSegundo = within(segundo).getByRole('group', { name: 'Séries' });
    await usuario.click(within(seriesDoSegundo).getByRole('button', { name: 'Diminuir Séries' }));
    expect(seriesDoSegundo).toHaveTextContent('1');
    expect(within(seriesDoSegundo).getByRole('button', { name: 'Diminuir Séries' })).toBeDisabled();
    const descansoDoSegundo = within(segundo).getByRole('group', { name: 'Descanso em segundos' });
    for (let i = 0; i < 6; i += 1) {
      await usuario.click(within(descansoDoSegundo).getByRole('button', { name: 'Diminuir Descanso em segundos' }));
    }
    expect(descansoDoSegundo).toHaveTextContent('0');
    expect(within(descansoDoSegundo).getByRole('button', { name: 'Diminuir Descanso em segundos' })).toBeDisabled();

    // Trocar para duração: entra com o padrão de reserva (30 s), mínimo 10 e máximo 3600.
    await usuario.click(within(item).getByRole('radio', { name: 'Duração' }));
    expect(within(item).queryByRole('group', { name: 'Repetições' })).not.toBeInTheDocument();
    const duracao = within(item).getByRole('group', { name: 'Duração em segundos' });
    expect(duracao).toHaveTextContent('30');
    for (let i = 0; i < 5; i += 1) {
      await usuario.click(within(duracao).getByRole('button', { name: 'Diminuir Duração em segundos' }));
    }
    expect(duracao).toHaveTextContent('10');
    expect(within(duracao).getByRole('button', { name: 'Diminuir Duração em segundos' })).toBeDisabled();

    // Voltar para repetições entra com o padrão de reserva (10): o montador esvazia a medida anterior.
    await usuario.click(within(item).getByRole('radio', { name: 'Repetições' }));
    expect(within(item).queryByRole('group', { name: 'Duração em segundos' })).not.toBeInTheDocument();
    expect(within(item).getByRole('group', { name: 'Repetições' })).toHaveTextContent('10');
  });

  // 30 cliques com o user-event passam dos 5 s padrão com a máquina ocupada (mesmo prazo do catálogo do PR-03).
  it('o seletor para de adicionar quando o treino chega a 30 itens', { timeout: 30_000 }, async () => {
    const usuario = userEvent.setup({ delay: null });
    renderizar();
    registrarExercicios();
    await esperarFormulario();
    await usuario.click(botaoAdicionarEm('Aquecimento'));
    const botao = await screen.findByRole('button', { name: 'Adicionar Recepção em manchete' });
    for (let i = 0; i < 30; i += 1) {
      await usuario.click(botao);
    }
    expect(itensDaEtapa('Aquecimento')).toHaveLength(30);
    expect(botao).toBeDisabled();
    expect(screen.getByText('O treino chegou ao máximo de 30 exercícios.')).toBeInTheDocument();
  });
});

describe('FormularioTreino — salvar e erros', () => {
  it('sem nome, nivel e itens mostra os erros em pt-BR, foca o primeiro campo e nao chama a API', async () => {
    const usuario = userEvent.setup();
    const { aoCriar } = renderizar();
    const corpos = registrarCriarTreino();
    await esperarFormulario();

    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));

    const nome = screen.getByLabelText('Nome do treino');
    expect(nome).toHaveAccessibleDescription('Informe o nome do treino.');
    expect(nome).toHaveAttribute('aria-invalid', 'true');
    expect(nome).toHaveFocus();
    expect(screen.getByLabelText('Nível')).toHaveAccessibleDescription('Escolha o nível do treino.');
    expect(screen.getByRole('alert')).toHaveTextContent('Adicione pelo menos um exercício.');
    expect(corpos).toHaveLength(0);
    expect(aoCriar).not.toHaveBeenCalled();
  });

  it('com cabecalho valido e sem itens, o erro dos itens aparece sozinho e some ao adicionar', async () => {
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios();
    await esperarFormulario();
    await preencherCabecalho(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Adicione pelo menos um exercício.');
    expect(screen.getByLabelText('Nome do treino')).not.toHaveAttribute('aria-invalid');

    await adicionar(usuario, 'Técnica', 'Recepção em manchete');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('422 do servidor aparece no campo e no item correspondentes', async () => {
    const usuario = userEvent.setup();
    const { aoCriar } = renderizar({ papel: 'admin' });
    registrarExercicios();
    registrarErroAoCriar(422, {
      message: 'O campo visibilidade selecionado é inválido. (e mais 1 erro)',
      errors: {
        visibilidade: ['O campo visibilidade selecionado é inválido.'],
        'itens.1.exercicio_id': ['O exercício selecionado foi removido da biblioteca.'],
      },
      request_id: 'req-422',
    });
    await esperarFormulario();
    await preencherCabecalho(usuario);
    await usuario.selectOptions(screen.getByLabelText('Visibilidade'), 'publico');
    await adicionar(usuario, 'Aquecimento', 'Deslocamento lateral');
    await adicionar(usuario, 'Técnica', 'Recepção em manchete');

    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));

    const visibilidade = screen.getByLabelText('Visibilidade');
    await waitFor(() =>
      expect(visibilidade).toHaveAccessibleDescription('O campo visibilidade selecionado é inválido.'),
    );
    expect(visibilidade).toHaveAttribute('aria-invalid', 'true');
    expect(visibilidade).toHaveFocus();
    const [item] = itensDaEtapa('Técnica');
    expect(within(item).getByText('O exercício selecionado foi removido da biblioteca.')).toBeInTheDocument();
    expect(itensDaEtapa('Aquecimento')[0]).not.toHaveTextContent('removido da biblioteca');
    expect(screen.queryByText('Não foi possível salvar o treino.')).not.toBeInTheDocument();
    expect(aoCriar).not.toHaveBeenCalled();
  });

  it('erro generico mostra a mensagem com o request_id e deixa tentar de novo', async () => {
    const usuario = userEvent.setup();
    const { aoCriar } = renderizar();
    registrarExercicios();
    registrarErroAoCriar(500, { message: 'Erro interno do servidor.', request_id: 'req-500' });
    await esperarFormulario();
    await preencherCabecalho(usuario);
    await adicionar(usuario, 'Técnica', 'Recepção em manchete');
    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível salvar o treino.');
    expect(alerta).toHaveTextContent('Código do erro: req-500');
    expect(screen.getByRole('button', { name: 'Salvar treino' })).toBeEnabled();
    expect(aoCriar).not.toHaveBeenCalled();

    // Tentar de novo com a API de pé funciona e limpa o erro.
    registrarCriarTreino();
    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));
    await waitFor(() => expect(aoCriar).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    [401, 'Não autenticado.', 'Você precisa entrar para criar um treino.'],
    [403, 'Ação não autorizada.', 'Você não tem permissão para criar treinos.'],
  ])('%s mostra uma mensagem clara', async (status, mensagemDaApi, esperada) => {
    // O http.js manda o 401 para /entrar: aqui só se confere a mensagem da tela.
    const navegar = vi.fn();
    definirNavegacao(navegar);
    const usuario = userEvent.setup();
    renderizar();
    registrarExercicios();
    registrarErroAoCriar(status, { message: mensagemDaApi, request_id: `req-${status}` });
    await esperarFormulario();
    await preencherCabecalho(usuario);
    await adicionar(usuario, 'Técnica', 'Recepção em manchete');
    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(esperada);
    expect(alerta).toHaveTextContent(`Código do erro: req-${status}`);
    if (status === 401) expect(navegar).toHaveBeenCalledWith(expect.stringContaining('/entrar'));
    definirNavegacao((destino) => window.location.assign(destino));
  });

  it('enquanto salva o botao fica "Salvando…" e bloqueado, sem duplo envio', async () => {
    const usuario = userEvent.setup();
    const { aoCriar } = renderizar();
    registrarExercicios();
    const corpos = [];
    servidor.use(
      rede.post('/api/v1/treinos', async ({ request }) => {
        const corpo = await request.json();
        corpos.push(corpo);
        await delay(150);
        const { treinoCriado } = await import('../apoioDeTeste.js');
        return HttpResponse.json({ data: treinoCriado(corpo) }, { status: 201 });
      }),
    );
    await esperarFormulario();
    await preencherCabecalho(usuario);
    await adicionar(usuario, 'Técnica', 'Recepção em manchete');

    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));
    const salvando = await screen.findByRole('button', { name: 'Salvando…' });
    expect(salvando).toHaveAttribute('aria-busy', 'true');
    expect(salvando).toHaveAttribute('aria-disabled', 'true');
    await usuario.click(salvando);
    await waitFor(() => expect(aoCriar).toHaveBeenCalledTimes(1));
    expect(corpos).toHaveLength(1);
  });

  it('nao tem violacoes de acessibilidade com itens, seletor aberto e erros na tela', async () => {
    const usuario = userEvent.setup();
    renderizar({ papel: 'treinador' });
    registrarExercicios();
    await esperarFormulario();
    await adicionar(usuario, 'Aquecimento', 'Deslocamento lateral');
    await usuario.click(botaoAdicionarEm('Técnica'));
    await screen.findByRole('list', { name: 'Exercícios da biblioteca' });
    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));
    expect(screen.getByLabelText('Nome do treino')).toHaveAttribute('aria-invalid', 'true');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
