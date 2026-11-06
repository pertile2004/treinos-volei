import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { rotas } from './app/rotas.jsx';
import './estilos/global.css';
import { definirNavegacao } from './lib/http.js';

const roteador = createBrowserRouter(rotas);
const clienteDeConsultas = new QueryClient();
definirNavegacao((destino) => roteador.navigate(destino, { replace: true }));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={clienteDeConsultas}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>
  </StrictMode>,
);
