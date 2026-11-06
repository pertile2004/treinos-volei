import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { Outlet } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import {
  RESUMO,
  RESUMO_COM_DURACAO,
  erroDaApi,
  paginaDe,
  registrarLista,
  registrarReferencias,
} from '../testes/dados/exercicios.js';
import { renderizarRotas } from '../testes/renderizar.jsx';
import { servidor } from '../testes/servidor.js';
import Biblioteca from './Biblioteca.jsx';

function Detalhe() {
  return <h1>Detalhe de teste</h1>;
}

// Como no AppShell, as páginas ficam dentro do landmark main.
function Layout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}

const rotas = [
  {
    Component: Layout,
    children: [
      { path: '/biblioteca', Component: Biblioteca },
      { path: '/exercicios/:exercicioId', Component: Detalhe },
    ],
  },
];

function renderizar(caminho = '/biblioteca') {
  registrarReferencias();
  return renderizarRotas(rotas, caminho);
}

async function esperarLista() {
  return screen.findByRole('list', { name: 'Exercícios' });
}

describe('Biblioteca', () => {
  it('mostra o esqueleto com aria-busy enquanto carrega e depois os cartoes', async () => {
    registrarLista();
    renderizar();
    expect(screen.getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeInTheDocument();
    const carregando = screen.getByRole('status');
    expect(carregando).toHaveTextContent('Carregando exercícios…');
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

    const lista = await esperarLista();
    const itens = within(lista).getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();

    const primeiro = itens[0];
    const link = within(primeiro).getByRole('link');
    expect(link).toHaveAttribute('href', '/exercicios/12');
    expect(within(primeiro).getByRole('heading', { level: 2, name: RESUMO.nome })).toBeInTheDocument();
    expect(within(primeiro).getByText('Recepção')).toBeInTheDocument();
    expect(within(primeiro).getByText('Iniciante')).toBeInTheDocument();
    expect(primeiro).toHaveTextContent('3 × 15');
    expect(primeiro).toHaveTextContent('Descanso 45 s');
    expect(primeiro).toHaveTextContent('Com vídeo');

    const segundo = itens[1];
    expect(segundo).toHaveTextContent('4 × 30 s');
    expect(segundo).toHaveTextContent('Descanso 1 min');
    expect(segundo).not.toHaveTextContent('Com vídeo');
    expect(within(segundo).getByRole('link')).toHaveAttribute('href', '/exercicios/7');
  });

  it('anuncia o total encontrado em uma regiao viva', async () => {
    registrarLista(paginaDe([RESUMO, RESUMO_COM_DURACAO], { total: 40, last_page: 3 }));
    renderizar();
    await esperarLista();
    const anuncio = screen.getByText('40 exercícios encontrados');
    expect(anuncio.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('a ilustracao do cartao e decorativa', async () => {
    registrarLista();
    renderizar();
    const lista = await esperarLista();
    const ilustracao = lista.querySelector('[data-ilustracao]');
    expect(ilustracao).toHaveAttribute('aria-hidden', 'true');
    expect(ilustracao.style.maskImage).toContain('/ilustracoes/recepcao.svg');
  });

  it('o clique nos chips de fundamento e nivel chama a API com os dois filtros e volta para a pagina 1', async () => {
    const usuario = userEvent.setup();
    const pedidos = registrarLista((parametros) =>
      paginaDe([RESUMO], { current_page: Number(parametros.page), total: 40, last_page: 3 }),
    );
    const roteador = renderizar('/biblioteca?pagina=2');
    await esperarLista();
    expect(pedidos.at(-1)).toEqual({ page: '2' });

    const fundamentos = screen.getByRole('group', { name: 'Fundamento' });
    expect(within(fundamentos).getAllByRole('button')).toHaveLength(8);
    expect(within(fundamentos).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');

    await usuario.click(within(fundamentos).getByRole('button', { name: 'Recepção' }));
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ fundamento: 'recepcao', page: '1' }));
    expect(within(fundamentos).getByRole('button', { name: 'Recepção' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(fundamentos).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');

    const niveis = screen.getByRole('group', { name: 'Nível' });
    expect(within(niveis).getAllByRole('button')).toHaveLength(4);
    await usuario.click(within(niveis).getByRole('button', { name: 'Iniciante' }));
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ fundamento: 'recepcao', nivel: 'iniciante', page: '1' }));
    expect(roteador.state.location.search).toBe('?fundamento=recepcao&nivel=iniciante');

    // Clicar de novo no chip selecionado tira o filtro.
    await usuario.click(within(fundamentos).getByRole('button', { name: 'Recepção' }));
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ nivel: 'iniciante', page: '1' }));
    expect(within(fundamentos).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('a busca espera o usuario parar de digitar e envia busca com a pagina 1', async () => {
    const usuario = userEvent.setup();
    const pedidos = registrarLista((parametros) =>
      paginaDe(parametros.busca ? [RESUMO] : [RESUMO, RESUMO_COM_DURACAO]),
    );
    renderizar('/biblioteca?pagina=3');
    await esperarLista();

    const campo = screen.getByRole('searchbox', { name: 'Buscar exercício' });
    await usuario.type(campo, 'recepcao');
    await waitFor(() => expect(pedidos.at(-1)).toEqual({ busca: 'recepcao', page: '1' }));
    expect(pedidos).toHaveLength(2);
    expect(campo).toHaveValue('recepcao');
    expect(await screen.findByText('1 exercício encontrado')).toBeInTheDocument();
  });

  it('abre com os filtros da URL e marca os chips', async () => {
    const pedidos = registrarLista();
    renderizar('/biblioteca?fundamento=saque&nivel=avancado&busca=flutuante&pagina=2');
    await esperarLista();
    expect(pedidos).toEqual([{ fundamento: 'saque', nivel: 'avancado', busca: 'flutuante', page: '2' }]);
    expect(screen.getByRole('button', { name: 'Saque' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Avançado' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('searchbox', { name: 'Buscar exercício' })).toHaveValue('flutuante');
  });

  it('pagina com Anterior e Proxima e mostra Pagina X de Y', async () => {
    const usuario = userEvent.setup();
    const pedidos = registrarLista((parametros) =>
      paginaDe([{ ...RESUMO, nome: `Exercício da página ${parametros.page}` }], {
        current_page: Number(parametros.page),
        total: 40,
        last_page: 3,
      }),
    );
    const roteador = renderizar();
    await esperarLista();

    const paginacao = screen.getByRole('navigation', { name: 'Paginação' });
    expect(paginacao).toHaveTextContent('Página 1 de 3');
    const anterior = within(paginacao).getByRole('button', { name: 'Anterior' });
    const proxima = within(paginacao).getByRole('button', { name: 'Próxima' });
    expect(anterior).toBeDisabled();
    expect(proxima).toBeEnabled();

    await usuario.click(proxima);
    expect(await screen.findByText('Exercício da página 2')).toBeInTheDocument();
    expect(pedidos.at(-1)).toEqual({ page: '2' });
    expect(roteador.state.location.search).toBe('?pagina=2');
    expect(paginacao).toHaveTextContent('Página 2 de 3');
    expect(anterior).toBeEnabled();

    await usuario.click(proxima);
    expect(await screen.findByText('Exercício da página 3')).toBeInTheDocument();
    expect(within(paginacao).getByRole('button', { name: 'Próxima' })).toBeDisabled();

    await usuario.click(within(paginacao).getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('Exercício da página 2')).toBeInTheDocument();
  });

  it('com uma pagina so, nao mostra a paginacao', async () => {
    registrarLista();
    renderizar();
    await esperarLista();
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('em erro mostra a mensagem com o codigo e Tentar de novo refaz a consulta', async () => {
    const usuario = userEvent.setup();
    registrarReferencias();
    let tentativas = 0;
    servidor.use(
      rede.get('/api/v1/exercicios', () => {
        tentativas += 1;
        return tentativas === 1 ? erroDaApi(500, 'Erro interno do servidor.') : HttpResponse.json(paginaDe([RESUMO]));
      }),
    );
    renderizarRotas(rotas, '/biblioteca');

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar os exercícios. Tente de novo.');
    expect(alerta).toHaveTextContent('Código do erro: req-500');
    expect(screen.queryByRole('list', { name: 'Exercícios' })).not.toBeInTheDocument();

    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    await esperarLista();
    expect(tentativas).toBe(2);
  });

  it('em 403 mostra a mensagem da API', async () => {
    registrarReferencias();
    servidor.use(rede.get('/api/v1/exercicios', () => erroDaApi(403, 'Ação não autorizada.')));
    renderizarRotas(rotas, '/biblioteca');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Ação não autorizada.');
    expect(alerta).toHaveTextContent('Código do erro: req-403');
  });

  it('se as referencias falharem, os filtros mostram o erro e a lista continua', async () => {
    servidor.use(rede.get('/api/v1/referencias', () => erroDaApi(503, 'Serviço indisponível.')));
    registrarLista();
    renderizarRotas(rotas, '/biblioteca');
    await esperarLista();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os filtros.');
    expect(screen.queryByRole('group', { name: 'Fundamento' })).not.toBeInTheDocument();
  });

  it('sem resultado mostra o estado vazio e Limpar filtros tira os filtros', async () => {
    const usuario = userEvent.setup();
    const pedidos = registrarLista((parametros) =>
      paginaDe(parametros.busca || parametros.fundamento ? [] : [RESUMO], { total: 0 }),
    );
    const roteador = renderizar('/biblioteca?fundamento=bloqueio&busca=nada');
    expect(await screen.findByRole('heading', { level: 2, name: 'Nenhum exercício encontrado' })).toBeInTheDocument();
    expect(screen.getByText('Ajuste os filtros ou a busca.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Exercícios' })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await esperarLista();
    expect(pedidos.at(-1)).toEqual({ page: '1' });
    expect(roteador.state.location.search).toBe('');
    expect(screen.getByRole('searchbox', { name: 'Buscar exercício' })).toHaveValue('');
  });

  it('biblioteca vazia sem filtros nao oferece Limpar filtros', async () => {
    registrarLista(paginaDe([], { total: 0 }));
    renderizar();
    expect(await screen.findByRole('heading', { level: 2, name: 'Nenhum exercício encontrado' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('tem as abas Treinos Prontos (ativa) e Meus Treinos com aviso', async () => {
    const usuario = userEvent.setup();
    registrarLista();
    renderizar();
    const abas = screen.getByRole('tablist', { name: 'Seções da biblioteca' });
    const prontos = within(abas).getByRole('tab', { name: 'Treinos Prontos' });
    const meus = within(abas).getByRole('tab', { name: 'Meus Treinos' });
    expect(prontos).toHaveAttribute('aria-selected', 'true');
    await esperarLista();

    await usuario.click(meus);
    expect(meus).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('list', { name: 'Exercícios' })).not.toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Seus treinos vão aparecer aqui');
  });

  it('nao tem violacoes de acessibilidade com a lista carregada', async () => {
    registrarLista(paginaDe([RESUMO, RESUMO_COM_DURACAO], { total: 40, last_page: 3 }));
    renderizar();
    await esperarLista();
    expect(await axe(document.body, { iframes: false })).toHaveNoViolations();
  });

  it('nao tem violacoes de acessibilidade nos estados vazio e de erro', async () => {
    registrarLista(paginaDe([], { total: 0 }));
    renderizar('/biblioteca?busca=nada');
    await screen.findByRole('heading', { level: 2, name: 'Nenhum exercício encontrado' });
    expect(await axe(document.body, { iframes: false })).toHaveNoViolations();
  });
});
