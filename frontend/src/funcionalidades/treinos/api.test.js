import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { criarTreino } from './api.js';

// Corpo e resposta do contrato do PR-12 (POST /treinos).
const CORPO = {
  nome: 'Recepção e saque — terça',
  descricao: 'Foco em passe para o levantador.',
  nivel: 'intermediario',
  visibilidade: 'privado',
  itens: [
    {
      exercicio_id: 7,
      etapa: 'aquecimento',
      ordem: 1,
      series: 2,
      repeticoes: null,
      duracao_segundos: 60,
      descanso_segundos: 30,
    },
    {
      exercicio_id: 15,
      etapa: 'tecnica',
      ordem: 1,
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
    },
  ],
};

const TREINO = {
  id: 12,
  nome: 'Recepção e saque — terça',
  descricao: 'Foco em passe para o levantador.',
  nivel: 'intermediario',
  visibilidade: 'privado',
  duracao_estimada_minutos: 9,
  autor: { id: 3, nome: 'Lucas' },
  itens: [
    {
      id: 40,
      etapa: 'aquecimento',
      ordem: 1,
      series: 2,
      repeticoes: null,
      duracao_segundos: 60,
      descanso_segundos: 30,
      exercicio: { id: 7, nome: 'Deslocamento lateral', fundamento: 'preparo_fisico', removido: false },
    },
    {
      id: 41,
      etapa: 'tecnica',
      ordem: 1,
      series: 3,
      repeticoes: 10,
      duracao_segundos: null,
      descanso_segundos: 45,
      exercicio: { id: 15, nome: 'Recepção em manchete', fundamento: 'recepcao', removido: false },
    },
  ],
  criado_em: '2026-11-06T14:00:00Z',
};

describe('criarTreino', () => {
  it('faz POST /treinos com o corpo em JSON e devolve o treino sem o envelope data', async () => {
    const pedidos = [];
    servidor.use(
      rede.post('/api/v1/treinos', async ({ request }) => {
        pedidos.push({ corpo: await request.json(), tipo: request.headers.get('content-type') });
        return HttpResponse.json({ data: TREINO }, { status: 201 });
      }),
    );
    await expect(criarTreino(CORPO)).resolves.toEqual(TREINO);
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].corpo).toEqual(CORPO);
    expect(pedidos[0].tipo).toMatch(/application\/json/);
  });

  it('rejeita com o erro do axios em 422, mantendo message, errors e request_id', async () => {
    servidor.use(
      rede.post('/api/v1/treinos', () =>
        HttpResponse.json(
          {
            message: 'O campo visibilidade selecionado é inválido.',
            errors: { visibilidade: ['O campo visibilidade selecionado é inválido.'] },
            request_id: 'req-422',
          },
          { status: 422 },
        ),
      ),
    );
    await expect(criarTreino(CORPO)).rejects.toMatchObject({
      response: {
        status: 422,
        data: { errors: { visibilidade: ['O campo visibilidade selecionado é inválido.'] }, request_id: 'req-422' },
      },
    });
  });
});
