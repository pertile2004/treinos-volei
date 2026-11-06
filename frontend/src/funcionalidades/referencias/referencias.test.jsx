import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { REFERENCIAS } from '../../testes/dados/referencias.js';
import { servidor } from '../../testes/servidor.js';
import { obterReferencias } from './api.js';
import { chavesReferencias, useReferencias } from './hooks.js';

function capturar() {
  const chamadas = [];
  servidor.use(
    rede.get('/api/v1/referencias', ({ request }) => {
      chamadas.push(new URL(request.url).pathname);
      return HttpResponse.json({ data: REFERENCIAS });
    }),
  );
  return chamadas;
}

describe('obterReferencias', () => {
  it('pede GET /referencias e devolve o conteudo sem o envelope data', async () => {
    const chamadas = capturar();
    expect(await obterReferencias()).toEqual(REFERENCIAS);
    expect(chamadas).toEqual(['/api/v1/referencias']);
  });

  it('rejeita com o erro da API', async () => {
    servidor.use(
      rede.get('/api/v1/referencias', () =>
        HttpResponse.json({ message: 'Serviço indisponível.', request_id: 'req-503' }, { status: 503 }),
      ),
    );
    await expect(obterReferencias()).rejects.toMatchObject({ response: { status: 503 } });
  });
});

describe('useReferencias', () => {
  it('carrega as referencias uma vez e guarda na chave do modulo', async () => {
    const chamadas = capturar();
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(() => useReferencias(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.fundamentos).toHaveLength(7);
    expect(cliente.getQueryData(chavesReferencias.todas())).toEqual(REFERENCIAS);

    rerender();
    expect(chamadas).toEqual(['/api/v1/referencias']);
    // Referências quase nunca mudam: a consulta não fica obsoleta sozinha.
    expect(result.current.isStale).toBe(false);
  });
});
