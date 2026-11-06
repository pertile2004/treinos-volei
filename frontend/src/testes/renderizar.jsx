import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

/** Renderiza as rotas em memória, com um cliente de consultas novo, e devolve o roteador. */
export function renderizarRotas(rotas, caminho = '/') {
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] });
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={cliente}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>,
  );
  return roteador;
}
