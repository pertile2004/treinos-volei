import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import MensagemDeErro from '../../componentes/MensagemDeErro.jsx';
import { renderizarRotas } from '../../testes/renderizar.jsx';
import { servidor } from '../../testes/servidor.js';
import { chavesExercicios, useExercicio, useExercicios } from './hooks.js';

const RESUMO = {
  id: 12,
  nome: 'Recepção em manchete contra a parede',
  foco: 'Plataforma firme e direção da bola',
  fundamento: 'recepcao',
  fundamento_rotulo: 'Recepção',
  nivel: 'iniciante',
  nivel_rotulo: 'Iniciante',
  series_padrao: 3,
  repeticoes_padrao: 15,
  duracao_segundos_padrao: null,
  descanso_segundos: 45,
  tem_video: true,
  imagem_url: '/ilustracoes/recepcao.svg',
};

const DETALHE = {
  id: 12,
  nome: 'Recepção em manchete contra a parede',
  descricao: 'Fique a 3 m da parede e devolva a bola em manchete.',
  foco: 'Plataforma firme e direção da bola',
  fundamento: 'recepcao',
  fundamento_rotulo: 'Recepção',
  nivel: 'iniciante',
  nivel_rotulo: 'Iniciante',
  series_padrao: 3,
  repeticoes_padrao: 15,
  duracao_segundos_padrao: null,
  descanso_segundos: 45,
  video_url: null,
  imagem_url: '/ilustracoes/recepcao.svg',
};

const META = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

function criarCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** Renderiza o hook dentro de um cliente de consultas novo e devolve o resultado e o cliente. */
function renderizarHook(usar, propsIniciais) {
  const cliente = criarCliente();
  const wrapper = ({ children }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  return { ...renderHook(usar, { wrapper, initialProps: propsIniciais }), cliente };
}

/** Registra o manipulador da lista e devolve os parâmetros de cada requisição recebida. */
function capturarLista() {
  const pedidos = [];
  servidor.use(
    rede.get('/api/v1/exercicios', ({ request }) => {
      const parametros = Object.fromEntries(new URL(request.url).searchParams);
      pedidos.push(parametros);
      return HttpResponse.json({
        data: [{ ...RESUMO, nome: `Exercício da página ${parametros.page}` }],
        links: {},
        meta: { ...META, current_page: Number(parametros.page) },
      });
    }),
  );
  return pedidos;
}

/** Registra o manipulador do detalhe e devolve os ids pedidos. */
function capturarDetalhe() {
  const ids = [];
  servidor.use(
    rede.get('/api/v1/exercicios/:id', ({ params }) => {
      ids.push(params.id);
      return HttpResponse.json({ data: DETALHE });
    }),
  );
  return ids;
}

function SondaLista({ filtros }) {
  const consulta = useExercicios(filtros);
  if (consulta.isPending) return <p role="status">Carregando…</p>;
  if (consulta.isError) return <MensagemDeErro erro={consulta.error} />;
  return (
    <>
      <ul>
        {consulta.data.data.map((exercicio) => (
          <li key={exercicio.id}>{exercicio.nome}</li>
        ))}
      </ul>
      <p>Total: {consulta.data.meta.total}</p>
    </>
  );
}

function SondaDetalhe({ id }) {
  const consulta = useExercicio(id);
  if (consulta.fetchStatus === 'idle' && consulta.isPending) return <p>Nenhum exercício escolhido.</p>;
  if (consulta.isPending) return <p role="status">Carregando…</p>;
  if (consulta.isError) return <MensagemDeErro erro={consulta.error} />;
  return <h1>{consulta.data.nome}</h1>;
}

describe('chavesExercicios', () => {
  it('toda chave comeca por exercicios', () => {
    expect(chavesExercicios.todas()).toEqual(['exercicios']);
    expect(chavesExercicios.listas()).toEqual(['exercicios', 'lista']);
    expect(chavesExercicios.detalhes()).toEqual(['exercicios', 'detalhe']);
  });

  it('a chave da lista inclui os filtros normalizados', () => {
    expect(chavesExercicios.lista({ fundamento: 'saque', busca: ' flutuante ', pagina: '2' })).toEqual([
      'exercicios',
      'lista',
      { fundamento: 'saque', busca: 'flutuante', pagina: 2 },
    ]);
    expect(chavesExercicios.lista()).toEqual(['exercicios', 'lista', { pagina: 1 }]);
    expect(chavesExercicios.lista({ fundamento: '', busca: '  ', pagina: 1 })).toEqual(chavesExercicios.lista());
  });

  it('a chave do detalhe inclui o id, igual para numero e texto numerico', () => {
    expect(chavesExercicios.detalhe(12)).toEqual(['exercicios', 'detalhe', 12]);
    expect(chavesExercicios.detalhe('12')).toEqual(['exercicios', 'detalhe', 12]);
    expect(chavesExercicios.detalhe(undefined)).toEqual(['exercicios', 'detalhe', null]);
  });
});

describe('useExercicios', () => {
  it('lista os exercicios com data e meta e guarda na chave com os filtros', async () => {
    const pedidos = capturarLista();
    const filtros = { fundamento: 'recepcao', nivel: 'iniciante', busca: 'manchete' };
    const { result, cliente } = renderizarHook(() => useExercicios(filtros));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.data).toEqual([{ ...RESUMO, nome: 'Exercício da página 1' }]);
    expect(result.current.data.meta).toEqual(META);
    expect(pedidos).toEqual([{ fundamento: 'recepcao', nivel: 'iniciante', busca: 'manchete', page: '1' }]);
    expect(cliente.getQueryData(chavesExercicios.lista(filtros))).toEqual(result.current.data);
    expect(
      cliente
        .getQueryCache()
        .getAll()
        .map((consulta) => consulta.queryKey),
    ).toEqual([['exercicios', 'lista', { fundamento: 'recepcao', nivel: 'iniciante', busca: 'manchete', pagina: 1 }]]);
  });

  it('sem argumento lista a primeira pagina sem filtros', async () => {
    const pedidos = capturarLista();
    const { result } = renderizarHook(() => useExercicios());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(pedidos).toEqual([{ page: '1' }]);
  });

  it('filtros novos fazem outra consulta; filtros equivalentes reaproveitam o cache', async () => {
    const pedidos = capturarLista();
    const { result, rerender } = renderizarHook((filtros) => useExercicios(filtros), { fundamento: 'saque' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ fundamento: 'saque', pagina: 2 });
    await waitFor(() => expect(result.current.data?.meta.current_page).toBe(2));

    rerender({ fundamento: 'saque', busca: '   ', pagina: '2' });
    expect(result.current.data.meta.current_page).toBe(2);
    expect(pedidos).toEqual([
      { fundamento: 'saque', page: '1' },
      { fundamento: 'saque', page: '2' },
    ]);
  });

  it('aceita opcoes da consulta, como enabled', async () => {
    const pedidos = capturarLista();
    const { result, rerender } = renderizarHook(({ ligado }) => useExercicios({}, { enabled: ligado }), {
      ligado: false,
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(pedidos).toEqual([]);
    rerender({ ligado: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(pedidos).toEqual([{ page: '1' }]);
  });

  it('mostra os dados no componente', async () => {
    capturarLista();
    renderizarRotas([{ path: '/', element: <SondaLista filtros={{ fundamento: 'recepcao' }} /> }]);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
    expect(await screen.findByText('Exercício da página 1')).toBeInTheDocument();
    expect(screen.getByText('Total: 1')).toBeInTheDocument();
  });

  it('em 422 a mensagem da API e o codigo chegam ao componente', async () => {
    servidor.use(
      rede.get('/api/v1/exercicios', () =>
        HttpResponse.json(
          {
            message: 'O fundamento selecionado é inválido.',
            errors: { fundamento: ['O fundamento selecionado é inválido.'] },
            request_id: 'req-422',
          },
          { status: 422 },
        ),
      ),
    );
    renderizarRotas([{ path: '/', element: <SondaLista filtros={{ fundamento: 'voo' }} /> }]);
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('O fundamento selecionado é inválido.');
    expect(alerta).toHaveTextContent('Código do erro: req-422');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('sem a API no ar a mensagem de sem conexao chega ao componente', async () => {
    servidor.use(rede.get('/api/v1/exercicios', () => HttpResponse.error()));
    renderizarRotas([{ path: '/', element: <SondaLista filtros={{}} /> }]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor. Confira sua conexão e tente de novo.',
    );
  });
});

describe('useExercicio', () => {
  it('detalha o exercicio e guarda na chave com o id', async () => {
    const ids = capturarDetalhe();
    const { result, cliente } = renderizarHook(() => useExercicio(12));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(DETALHE);
    expect(ids).toEqual(['12']);
    expect(cliente.getQueryData(['exercicios', 'detalhe', 12])).toEqual(DETALHE);
  });

  it('id em texto (vindo da rota) usa o mesmo cache do id numerico', async () => {
    const ids = capturarDetalhe();
    const { result, rerender } = renderizarHook((id) => useExercicio(id), '12');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender(12);
    expect(result.current.data).toEqual(DETALHE);
    expect(ids).toEqual(['12']);
  });

  it.each([[undefined], [null], ['']])('fica desligado sem id (%s) e nao chama a API', async (id) => {
    const ids = capturarDetalhe();
    const { result } = renderizarHook(() => useExercicio(id));
    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(ids).toEqual([]);
  });

  it('liga quando o id chega depois', async () => {
    const ids = capturarDetalhe();
    const { result, rerender } = renderizarHook((id) => useExercicio(id), undefined);
    expect(result.current.fetchStatus).toBe('idle');
    rerender(12);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ids).toEqual(['12']);
  });

  it('enabled true nas opcoes nao liga a consulta sem id', async () => {
    const ids = capturarDetalhe();
    const { result } = renderizarHook(() => useExercicio(undefined, { enabled: true }));
    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(result.current.fetchStatus).toBe('idle');
    expect(ids).toEqual([]);
  });

  it('sem id o componente nao mostra carregando nem erro', () => {
    capturarDetalhe();
    renderizarRotas([{ path: '/', element: <SondaDetalhe id={undefined} /> }]);
    expect(screen.getByText('Nenhum exercício escolhido.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('em 404 a mensagem da API e o codigo chegam ao componente', async () => {
    servidor.use(
      rede.get('/api/v1/exercicios/:id', () =>
        HttpResponse.json({ message: 'Exercício não encontrado.', request_id: 'req-404' }, { status: 404 }),
      ),
    );
    renderizarRotas([{ path: '/', element: <SondaDetalhe id={999} /> }]);
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Exercício não encontrado.');
    expect(alerta).toHaveTextContent('Código do erro: req-404');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('invalidacao pelas chaves', () => {
  it('invalidar chavesExercicios.todas() refaz a lista e o detalhe', async () => {
    const pedidos = capturarLista();
    const ids = capturarDetalhe();
    const { result, cliente } = renderizarHook(() => ({ lista: useExercicios(), detalhe: useExercicio(12) }));
    await waitFor(() => expect(result.current.lista.isSuccess && result.current.detalhe.isSuccess).toBe(true));
    await cliente.invalidateQueries({ queryKey: chavesExercicios.todas() });
    expect(pedidos).toHaveLength(2);
    expect(ids).toEqual(['12', '12']);
  });

  it('invalidar chavesExercicios.listas() refaz so as listas', async () => {
    const pedidos = capturarLista();
    const ids = capturarDetalhe();
    const { result, cliente } = renderizarHook(() => ({ lista: useExercicios(), detalhe: useExercicio(12) }));
    await waitFor(() => expect(result.current.lista.isSuccess && result.current.detalhe.isSuccess).toBe(true));
    await cliente.invalidateQueries({ queryKey: chavesExercicios.listas() });
    expect(pedidos).toHaveLength(2);
    expect(ids).toEqual(['12']);
  });
});
