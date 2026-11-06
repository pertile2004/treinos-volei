import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// O AppShell monta o LembreteDeHoje, que consulta a agenda de hoje em toda tela: por padrão, sem agendamentos.
// Cada teste sobrepõe o que precisar com servidor.use(...); o resetHandlers volta a este padrão.
export const servidor = setupServer(http.get('/api/v1/agendamentos', () => HttpResponse.json({ data: [] })));
