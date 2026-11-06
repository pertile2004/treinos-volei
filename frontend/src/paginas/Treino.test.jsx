import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../app/rotas.jsx';
import { estadoIniciado } from '../funcionalidades/treino-ativo/apoioDeTeste.js';
import { chaveDoTreinoAtivo } from '../funcionalidades/treino-ativo/armazenamentoDoTreino.js';
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

const RESUMO = {
  id: 12,
  nome: 'Recepção básica',
  descricao: null,
  nivel: 'iniciante',
  visibilidade: 'privado',
  duracao_estimada_minutos: 9,
  total_exercicios: 2,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
};
const SEM_PAGINAS = { first: '/api/v1/treinos?page=1', last: '/api/v1/treinos?page=1', prev: null, next: null };

function prepararLista(treinos = [RESUMO], links = SEM_PAGINAS) {
  const consultas = [];
  servidor.use(
    rede.get('/api/v1/treinos', ({ request }) => {
      consultas.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json({
        data: treinos,
        links,
        meta: { current_page: 1, per_page: 15, total: treinos.length },
      });
    }),
  );
  return consultas;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('/treino', () => {
  it('mostra carregando e depois meus treinos com o botão de iniciar', async () => {
    const consultas = prepararLista();
    renderizarRotas(rotas, '/treino');
    expect(screen.getByRole('heading', { level: 1, name: 'Treino' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando seus treinos…');
    const item = await within(screen.getByRole('main')).findByRole('listitem');
    expect(item).toHaveTextContent('Recepção básica');
    expect(item).toHaveTextContent('9 min · 2 exercícios');
    const iniciar = within(item).getByRole('link', { name: 'Iniciar treino Recepção básica' });
    expect(iniciar).toHaveAttribute('href', '/treinar/12');
    expect(iniciar).toHaveClass('min-h-11');
    expect(consultas).toEqual([{ escopo: 'meus', page: '1' }]);
    expect(screen.queryByRole('heading', { name: 'Treino em andamento' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginação dos treinos' })).not.toBeInTheDocument();
  });

  it('sem treinos mostra o vazio com o link de criar', async () => {
    prepararLista([]);
    renderizarRotas(rotas, '/treino');
    expect(await screen.findByRole('heading', { level: 2, name: 'Você ainda não tem treinos.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar treino' })).toHaveAttribute('href', '/treinos/novo');
  });

  it('erro mostra a mensagem com o código e Tentar de novo recarrega', async () => {
    const usuario = userEvent.setup();
    let falhar = true;
    servidor.use(
      rede.get('/api/v1/treinos', () => {
        if (falhar) return HttpResponse.json({ message: 'Erro.', request_id: 'r-500' }, { status: 500 });
        return HttpResponse.json({ data: [RESUMO], links: SEM_PAGINAS, meta: {} });
      }),
    );
    renderizarRotas(rotas, '/treino');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar seus treinos.');
    expect(alerta).toHaveTextContent('Código do erro: r-500');
    falhar = false;
    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await within(screen.getByRole('main')).findByRole('listitem')).toHaveTextContent('Recepção básica');
  });

  it('com um treino guardado no aparelho mostra Retomar e Descartar com confirmação', async () => {
    const usuario = userEvent.setup();
    prepararLista();
    localStorage.setItem(CHAVE, JSON.stringify(estadoIniciado()));
    renderizarRotas(rotas, '/treino');
    const secao = await screen.findByRole('region', { name: 'Treino em andamento' });
    expect(secao).toHaveTextContent('Recepção básica');
    expect(secao).toHaveTextContent('Exercício 1 de 2');
    expect(within(secao).getByRole('link', { name: 'Retomar' })).toHaveAttribute('href', '/treinar/12');

    await usuario.click(within(secao).getByRole('button', { name: 'Descartar' }));
    const dialogo = screen.getByRole('dialog', { name: 'Descartar o treino em andamento?' });
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    expect(localStorage.getItem(CHAVE)).not.toBeNull();
    await usuario.click(within(secao).getByRole('button', { name: 'Descartar' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descartar' }));
    expect(screen.queryByRole('region', { name: 'Treino em andamento' })).not.toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('mostra a mensagem "Treino salvo." vinda da navegação', async () => {
    prepararLista();
    renderizarRotas(rotas, { pathname: '/treino', state: { mensagem: 'Treino salvo.' } });
    expect(await screen.findByRole('status')).toHaveTextContent('Treino salvo.');
  });

  it('pagina quando há mais de uma página', async () => {
    const usuario = userEvent.setup();
    const consultas = prepararLista([RESUMO], { ...SEM_PAGINAS, next: '/api/v1/treinos?page=2' });
    renderizarRotas(rotas, '/treino');
    const paginacao = await screen.findByRole('navigation', { name: 'Paginação dos treinos' });
    expect(within(paginacao).getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await usuario.click(within(paginacao).getByRole('button', { name: 'Próxima' }));
    await within(screen.getByRole('main')).findByRole('listitem');
    expect(consultas.at(-1)).toEqual({ escopo: 'meus', page: '2' });
  });

  it('não tem violações de acessibilidade com lista e com treino em andamento', async () => {
    prepararLista();
    localStorage.setItem(CHAVE, JSON.stringify(estadoIniciado()));
    renderizarRotas(rotas, '/treino');
    await within(screen.getByRole('main')).findByRole('listitem');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
