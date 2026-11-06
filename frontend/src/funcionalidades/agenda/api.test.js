import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { atualizarAgendamento, criarAgendamento, listarAgendamentos, removerAgendamento } from './api.js';

const AGENDAMENTO = {
  id: 12,
  data: '2026-11-09',
  hora: '18:30',
  concluido: false,
  sessao_id: null,
  treino: { id: 5, nome: 'Saque e recepção', duracao_estimada_minutos: 40 },
};

describe('listarAgendamentos', () => {
  it('chama GET /agendamentos com de e ate e devolve a lista sem o envelope', async () => {
    const consultas = [];
    servidor.use(
      rede.get('/api/v1/agendamentos', ({ request }) => {
        consultas.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json({ data: [AGENDAMENTO] });
      }),
    );
    await expect(listarAgendamentos({ de: '2026-11-09', ate: '2026-11-15' })).resolves.toEqual([AGENDAMENTO]);
    expect(consultas).toEqual([{ de: '2026-11-09', ate: '2026-11-15' }]);
  });

  it('rejeita com o erro do http no 422', async () => {
    servidor.use(
      rede.get('/api/v1/agendamentos', () =>
        HttpResponse.json(
          { message: 'Os dados informados são inválidos.', errors: { ate: ['O intervalo é de no máximo 31 dias.'] } },
          { status: 422 },
        ),
      ),
    );
    await expect(listarAgendamentos({ de: '2026-01-01', ate: '2026-03-01' })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });
});

describe('criarAgendamento', () => {
  it('envia POST /agendamentos com treino_id, data e hora e devolve o recurso', async () => {
    const corpos = [];
    servidor.use(
      rede.post('/api/v1/agendamentos', async ({ request }) => {
        corpos.push(await request.json());
        return HttpResponse.json({ data: AGENDAMENTO }, { status: 201 });
      }),
    );
    await expect(criarAgendamento({ treino_id: 5, data: '2026-11-09', hora: '18:30' })).resolves.toEqual(AGENDAMENTO);
    expect(corpos).toEqual([{ treino_id: 5, data: '2026-11-09', hora: '18:30' }]);
  });

  it('sem hora envia hora null', async () => {
    const corpos = [];
    servidor.use(
      rede.post('/api/v1/agendamentos', async ({ request }) => {
        corpos.push(await request.json());
        return HttpResponse.json({ data: { ...AGENDAMENTO, hora: null } }, { status: 201 });
      }),
    );
    await criarAgendamento({ treino_id: 5, data: '2026-11-09' });
    expect(corpos).toEqual([{ treino_id: 5, data: '2026-11-09', hora: null }]);
  });
});

describe('atualizarAgendamento', () => {
  it('envia PATCH /agendamentos/{id} so com data e hora', async () => {
    const chamadas = [];
    servidor.use(
      rede.patch('/api/v1/agendamentos/:id', async ({ params, request }) => {
        chamadas.push([params.id, await request.json()]);
        return HttpResponse.json({ data: { ...AGENDAMENTO, data: '2026-11-10', hora: null } });
      }),
    );
    await expect(atualizarAgendamento(12, { data: '2026-11-10', hora: null })).resolves.toEqual({
      ...AGENDAMENTO,
      data: '2026-11-10',
      hora: null,
    });
    expect(chamadas).toEqual([['12', { data: '2026-11-10', hora: null }]]);
  });
});

describe('removerAgendamento', () => {
  it('envia DELETE /agendamentos/{id} e resolve sem corpo no 204', async () => {
    const ids = [];
    servidor.use(
      rede.delete('/api/v1/agendamentos/:id', ({ params }) => {
        ids.push(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(removerAgendamento(12)).resolves.toBeUndefined();
    expect(ids).toEqual(['12']);
  });

  it('rejeita com 404 quando o agendamento e de outro usuario', async () => {
    servidor.use(
      rede.delete('/api/v1/agendamentos/:id', () =>
        HttpResponse.json({ message: 'Recurso não encontrado.' }, { status: 404 }),
      ),
    );
    await expect(removerAgendamento(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});
