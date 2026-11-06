import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import MensagemDeErro from '../../componentes/MensagemDeErro.jsx';
import { servidor } from '../../testes/servidor.js';
import { chavesTreinos, useTreino, useTreinos } from './hooks.js';

const RESUMO = {
  id: 12,
  nome: 'Saque e recepção',
  descricao: 'Foco em regularidade',
  nivel: 'intermediario',
  visibilidade: 'privado',
  duracao_estimada_minutos: 45,
  total_exercicios: 8,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
};
const LINKS = { first: '/api/v1/treinos?page=1', last: '/api/v1/treinos?page=2', prev: null, next: null };
const META = { current_page: 1, per_page: 15, total: 16 };
const DETALHE = {
  id: 12,
  nome: 'Saque e recepção',
  descricao: 'Foco em regularidade',
  nivel: 'intermediario',
  visibilidade: 'privado',
  duracao_estimada_minutos: 45,
  autor: { id: 3, nome: 'Lucas' },
  criado_em: '2026-11-06T14:00:00Z',
  itens: [
    {
      id: 40,
      etapa: 'aquecimento',
      ordem: 1,
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
      exercicio: { id: 7, nome: 'Saque por baixo no alvo', fundamento: 'saque', nivel: 'iniciante', removido: false },
    },
  ],
};

function criarCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function envolver(cliente = criarCliente()) {
  return function Envoltorio({ children }) {
    return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  };
}

/** Tela mínima: mostra o erro do jeito que as telas do projeto mostram (MensagemDeErro). */
function SondaDaLista({ filtros }) {
  const consulta = useTreinos(filtros);
  if (consulta.isError) return <MensagemDeErro erro={consulta.error} />;
  if (consulta.isPending) return <p role="status">Carregando…</p>;
  return (
    <ul>
      {consulta.data.data.map((treino) => (
        <li key={treino.id}>{treino.nome}</li>
      ))}
    </ul>
  );
}

function SondaDoDetalhe({ id }) {
  const consulta = useTreino(id);
  if (consulta.isError) return <MensagemDeErro erro={consulta.error} />;
  if (consulta.isPending) return <p role="status">Carregando…</p>;
  return <h1>{consulta.data.nome}</h1>;
}

describe('chavesTreinos', () => {
  it('toda chave comeca por treinos', () => {
    expect(chavesTreinos.todas()).toEqual(['treinos']);
    expect(chavesTreinos.listas()).toEqual(['treinos', 'lista']);
    expect(chavesTreinos.detalhes()).toEqual(['treinos', 'detalhe']);
  });

  it('a chave da lista inclui os filtros', () => {
    expect(chavesTreinos.lista({ escopo: 'destaque', page: 2 })).toEqual([
      'treinos',
      'lista',
      { escopo: 'destaque', page: 2 },
    ]);
    expect(chavesTreinos.lista()).toEqual(['treinos', 'lista', {}]);
  });

  it('a chave do detalhe inclui o id e trata 12 e "12" como o mesmo treino', () => {
    expect(chavesTreinos.detalhe(12)).toEqual(['treinos', 'detalhe', 12]);
    expect(chavesTreinos.detalhe('12')).toEqual(['treinos', 'detalhe', 12]);
  });

  it('sem id a chave do detalhe termina em null', () => {
    expect(chavesTreinos.detalhe(undefined)).toEqual(['treinos', 'detalhe', null]);
    expect(chavesTreinos.detalhe(null)).toEqual(['treinos', 'detalhe', null]);
    expect(chavesTreinos.detalhe('')).toEqual(['treinos', 'detalhe', null]);
  });
});

describe('useTreinos', () => {
  it('busca com os filtros e entrega data, links e meta', async () => {
    const consultas = [];
    servidor.use(
      rede.get('/api/v1/treinos', ({ request }) => {
        consultas.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json({ data: [RESUMO], links: LINKS, meta: META });
      }),
    );
    const { result } = renderHook(() => useTreinos({ escopo: 'destaque', page: 2 }), { wrapper: envolver() });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ data: [RESUMO], links: LINKS, meta: META });
    expect(consultas).toEqual([{ escopo: 'destaque', page: '2' }]);
  });

  it('sem argumento lista sem filtros', async () => {
    const consultas = [];
    servidor.use(
      rede.get('/api/v1/treinos', ({ request }) => {
        consultas.push(new URL(request.url).search);
        return HttpResponse.json({ data: [], links: LINKS, meta: { ...META, total: 0 } });
      }),
    );
    const { result } = renderHook(() => useTreinos(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.data).toEqual([]);
    expect(consultas).toEqual(['']);
  });

  it('guarda o resultado na chave da lista com os filtros', async () => {
    servidor.use(rede.get('/api/v1/treinos', () => HttpResponse.json({ data: [RESUMO], links: LINKS, meta: META })));
    const cliente = criarCliente();
    const { result } = renderHook(() => useTreinos({ escopo: 'meus', page: 1 }), { wrapper: envolver(cliente) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cliente.getQueryData(['treinos', 'lista', { escopo: 'meus', page: 1 }])).toEqual({
      data: [RESUMO],
      links: LINKS,
      meta: META,
    });
    expect(cliente.getQueryData(chavesTreinos.lista({ page: 1, escopo: 'meus' }))).toBeDefined();
  });

  it('mudar o filtro busca de novo', async () => {
    const paginas = [];
    servidor.use(
      rede.get('/api/v1/treinos', ({ request }) => {
        const pagina = Number(new URL(request.url).searchParams.get('page'));
        paginas.push(pagina);
        return HttpResponse.json({ data: [{ ...RESUMO, id: pagina }], links: LINKS, meta: META });
      }),
    );
    const { result, rerender } = renderHook(({ page }) => useTreinos({ escopo: 'meus', page }), {
      wrapper: envolver(),
      initialProps: { page: 1 },
    });
    await waitFor(() => expect(result.current.data?.data[0].id).toBe(1));
    rerender({ page: 2 });
    await waitFor(() => expect(result.current.data?.data[0].id).toBe(2));
    expect(paginas).toEqual([1, 2]);
  });

  it('invalidar chavesTreinos.listas() refaz a lista', async () => {
    let chamadas = 0;
    servidor.use(
      rede.get('/api/v1/treinos', () => {
        chamadas += 1;
        return HttpResponse.json({ data: [RESUMO], links: LINKS, meta: META });
      }),
    );
    const cliente = criarCliente();
    const { result } = renderHook(() => useTreinos({ escopo: 'meus' }), { wrapper: envolver(cliente) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await cliente.invalidateQueries({ queryKey: chavesTreinos.listas() });
    expect(chamadas).toBe(2);
  });

  it('a lista chega ao componente', async () => {
    servidor.use(rede.get('/api/v1/treinos', () => HttpResponse.json({ data: [RESUMO], links: LINKS, meta: META })));
    render(<SondaDaLista filtros={{ escopo: 'meus' }} />, { wrapper: envolver() });
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
    expect(await screen.findByText('Saque e recepção')).toBeInTheDocument();
  });

  it('erro da API chega ao componente com a mensagem e o codigo', async () => {
    servidor.use(
      rede.get('/api/v1/treinos', () =>
        HttpResponse.json(
          {
            message: 'O escopo informado é inválido.',
            errors: { escopo: ['O escopo informado é inválido.'] },
            request_id: 'abc-123',
          },
          { status: 422 },
        ),
      ),
    );
    render(<SondaDaLista filtros={{ escopo: 'treinador' }} />, { wrapper: envolver() });
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('O escopo informado é inválido.');
    expect(alerta).toHaveTextContent('Código do erro: abc-123');
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('sem a API no ar o componente recebe a mensagem de sem conexao', async () => {
    servidor.use(rede.get('/api/v1/treinos', () => HttpResponse.error()));
    render(<SondaDaLista filtros={{}} />, { wrapper: envolver() });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor. Confira sua conexão e tente de novo.',
    );
  });
});

describe('useTreino', () => {
  it('busca o treino pelo id e entrega o treino com os itens', async () => {
    const ids = [];
    servidor.use(
      rede.get('/api/v1/treinos/:id', ({ params }) => {
        ids.push(params.id);
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    const { result } = renderHook(() => useTreino(12), { wrapper: envolver() });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(DETALHE);
    expect(ids).toEqual(['12']);
  });

  it('guarda o resultado na chave do detalhe, igual para 12 e "12"', async () => {
    let chamadas = 0;
    servidor.use(
      rede.get('/api/v1/treinos/:id', () => {
        chamadas += 1;
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    const cliente = criarCliente();
    const { result } = renderHook(() => useTreino('12'), { wrapper: envolver(cliente) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cliente.getQueryData(['treinos', 'detalhe', 12])).toEqual(DETALHE);
    expect(cliente.getQueryData(chavesTreinos.detalhe('12'))).toEqual(DETALHE);
    expect(chamadas).toBe(1);
  });

  it('o treino chega ao componente', async () => {
    servidor.use(rede.get('/api/v1/treinos/:id', () => HttpResponse.json({ data: DETALHE })));
    render(<SondaDoDetalhe id="12" />, { wrapper: envolver() });
    expect(await screen.findByRole('heading', { level: 1, name: 'Saque e recepção' })).toBeInTheDocument();
  });

  it('404 chega ao componente com a mensagem da API e o status', async () => {
    servidor.use(
      rede.get('/api/v1/treinos/:id', () =>
        HttpResponse.json({ message: 'Treino não encontrado.', request_id: 'xyz-9' }, { status: 404 }),
      ),
    );
    const cliente = criarCliente();
    render(<SondaDoDetalhe id={99} />, { wrapper: envolver(cliente) });
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Treino não encontrado.');
    expect(alerta).toHaveTextContent('Código do erro: xyz-9');
    expect(cliente.getQueryState(chavesTreinos.detalhe(99)).error.response.status).toBe(404);
  });

  it.each([undefined, null, ''])('sem id (%s) fica desligado e nao chama a API', async (id) => {
    let chamadas = 0;
    servidor.use(
      rede.get('/api/v1/treinos', () => {
        chamadas += 1;
        return HttpResponse.json({ data: [], links: LINKS, meta: META });
      }),
      rede.get('/api/v1/treinos/:id', () => {
        chamadas += 1;
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    const { result } = renderHook(() => useTreino(id), { wrapper: envolver() });
    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(chamadas).toBe(0);
  });

  it('liga quando o id aparece', async () => {
    const ids = [];
    servidor.use(
      rede.get('/api/v1/treinos/:id', ({ params }) => {
        ids.push(params.id);
        return HttpResponse.json({ data: DETALHE });
      }),
    );
    const { result, rerender } = renderHook(({ id }) => useTreino(id), {
      wrapper: envolver(),
      initialProps: { id: undefined },
    });
    expect(result.current.fetchStatus).toBe('idle');
    rerender({ id: 12 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ids).toEqual(['12']);
  });
});
