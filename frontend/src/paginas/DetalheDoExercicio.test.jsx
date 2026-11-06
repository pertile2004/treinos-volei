import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as rede, HttpResponse } from 'msw';
import { Outlet } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { DETALHE, DETALHE_COM_VIDEO, erroDaApi, registrarDetalhe } from '../testes/dados/exercicios.js';
import { renderizarRotas } from '../testes/renderizar.jsx';
import { servidor } from '../testes/servidor.js';
import DetalheDoExercicio from './DetalheDoExercicio.jsx';

function BibliotecaDeTeste() {
  return <h1>Biblioteca de teste</h1>;
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
      { path: '/biblioteca', Component: BibliotecaDeTeste },
      { path: '/exercicios/:exercicioId', Component: DetalheDoExercicio },
    ],
  },
];

function termo(nome) {
  const dt = screen.getByText(nome, { selector: 'dt' });
  return dt.nextElementSibling;
}

describe('DetalheDoExercicio', () => {
  it('mostra o titulo generico enquanto carrega e depois o exercicio completo, sem player', async () => {
    const ids = registrarDetalhe(DETALHE);
    renderizarRotas(rotas, '/exercicios/12');
    expect(screen.getByRole('heading', { level: 1, name: 'Detalhe do exercício' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando exercício…');
    expect(document.title).toBe('Detalhe do exercício · VOLLEY PRO');

    expect(await screen.findByRole('heading', { level: 1, name: DETALHE.nome })).toBeInTheDocument();
    expect(ids).toEqual(['12']);
    expect(document.title).toBe(`${DETALHE.nome} · VOLLEY PRO`);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/biblioteca');
    expect(screen.getByText('Recepção')).toBeInTheDocument();
    expect(screen.getByText('Iniciante')).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Descrição' })).toBeInTheDocument();
    expect(screen.getByText(DETALHE.descricao)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Foco' })).toBeInTheDocument();
    expect(screen.getByText(DETALHE.foco)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Padrões' })).toBeInTheDocument();
    expect(termo('Séries')).toHaveTextContent('3');
    expect(termo('Repetições')).toHaveTextContent('15');
    expect(screen.queryByText('Duração', { selector: 'dt' })).not.toBeInTheDocument();
    expect(termo('Descanso')).toHaveTextContent('45 s');

    // Sem vídeo: nenhum player nem espaço reservado; a ilustração do fundamento aparece como decoração.
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByTitle(/^Vídeo:/)).not.toBeInTheDocument();
    const ilustracao = document.querySelector('[data-ilustracao]');
    expect(ilustracao).toHaveAttribute('aria-hidden', 'true');
    expect(ilustracao.style.maskImage).toContain('/ilustracoes/recepcao.svg');
  });

  it('com video do YouTube mostra o iframe sem cookies com title', async () => {
    registrarDetalhe(DETALHE_COM_VIDEO);
    renderizarRotas(rotas, '/exercicios/13');
    await screen.findByRole('heading', { level: 1, name: DETALHE_COM_VIDEO.nome });
    const iframe = screen.getByTitle(`Vídeo: ${DETALHE_COM_VIDEO.nome}`);
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(iframe.getAttribute('src')).not.toMatch(/autoplay=1/);
    expect(document.querySelector('[data-ilustracao]')).toBeNull();
  });

  it('com video fora do YouTube trata como sem video', async () => {
    registrarDetalhe({ ...DETALHE, video_url: 'https://vimeo.com/123456' });
    renderizarRotas(rotas, '/exercicios/12');
    await screen.findByRole('heading', { level: 1, name: DETALHE.nome });
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('com duracao mostra Duracao em vez de Repeticoes e esconde Foco vazio', async () => {
    registrarDetalhe({
      ...DETALHE,
      foco: null,
      series_padrao: 4,
      repeticoes_padrao: null,
      duracao_segundos_padrao: 90,
      descanso_segundos: 60,
    });
    renderizarRotas(rotas, '/exercicios/12');
    await screen.findByRole('heading', { level: 1, name: DETALHE.nome });
    expect(termo('Séries')).toHaveTextContent('4');
    expect(termo('Duração')).toHaveTextContent('1 min 30 s');
    expect(termo('Descanso')).toHaveTextContent('1 min');
    expect(screen.queryByText('Repetições', { selector: 'dt' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Foco' })).not.toBeInTheDocument();
  });

  it('em 404 avisa que o exercicio nao foi encontrado e oferece voltar', async () => {
    servidor.use(rede.get('/api/v1/exercicios/:id', () => erroDaApi(404, 'Recurso não encontrado.')));
    renderizarRotas(rotas, '/exercicios/999');
    expect(await screen.findByRole('heading', { level: 2, name: 'Exercício não encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Detalhe do exercício' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a Biblioteca' })).toHaveAttribute('href', '/biblioteca');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('em erro mostra a mensagem com o codigo e Tentar de novo refaz a consulta', async () => {
    const usuario = userEvent.setup();
    let tentativas = 0;
    servidor.use(
      rede.get('/api/v1/exercicios/:id', () => {
        tentativas += 1;
        return tentativas === 1 ? erroDaApi(500, 'Erro interno do servidor.') : HttpResponse.json({ data: DETALHE });
      }),
    );
    renderizarRotas(rotas, '/exercicios/12');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar o exercício. Tente de novo.');
    expect(alerta).toHaveTextContent('Código do erro: req-500');
    await usuario.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    await screen.findByRole('heading', { level: 1, name: DETALHE.nome });
    expect(tentativas).toBe(2);
  });

  it('em 403 mostra a mensagem da API', async () => {
    servidor.use(rede.get('/api/v1/exercicios/:id', () => erroDaApi(403, 'Ação não autorizada.')));
    renderizarRotas(rotas, '/exercicios/12');
    expect(await screen.findByRole('alert')).toHaveTextContent('Ação não autorizada.');
  });

  it('o link Voltar leva para a Biblioteca', async () => {
    const usuario = userEvent.setup();
    registrarDetalhe(DETALHE);
    const roteador = renderizarRotas(rotas, '/exercicios/12');
    await screen.findByRole('heading', { level: 1, name: DETALHE.nome });
    await usuario.click(screen.getByRole('link', { name: 'Voltar' }));
    await waitFor(() => expect(roteador.state.location.pathname).toBe('/biblioteca'));
  });

  it('nao tem violacoes de acessibilidade com e sem video', async () => {
    registrarDetalhe(DETALHE_COM_VIDEO);
    renderizarRotas(rotas, '/exercicios/13');
    await screen.findByRole('heading', { level: 1, name: DETALHE_COM_VIDEO.nome });
    expect(await axe(document.body, { iframes: false })).toHaveNoViolations();
  });

  it('nao tem violacoes de acessibilidade no 404', async () => {
    servidor.use(rede.get('/api/v1/exercicios/:id', () => erroDaApi(404, 'Recurso não encontrado.')));
    renderizarRotas(rotas, '/exercicios/999');
    await screen.findByRole('heading', { level: 2, name: 'Exercício não encontrado' });
    expect(await axe(document.body, { iframes: false })).toHaveNoViolations();
  });
});
