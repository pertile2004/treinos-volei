import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../testes/servidor.js';
import { buscarSessao, registrarSessao } from './api.js';

const CORPO = {
  id_cliente: '0b8f6c1e-3f0a-4a57-9d0e-2a4c6c1f7b11',
  origem: 'cronometro',
  treino_id: 12,
  iniciada_em: '2026-11-06T21:00:00Z',
  finalizada_em: '2026-11-06T21:38:10Z',
  duracao_segundos: 2100,
  observacao: null,
  series: [
    { exercicio_id: 5, numero: 1, repeticoes: 10, acertos: 7, erros: 3, duracao_segundos: 95 },
    { exercicio_id: 5, numero: 2, repeticoes: 10, acertos: 8, erros: 2, duracao_segundos: 88 },
  ],
};

const SESSAO = {
  id: 40,
  id_cliente: CORPO.id_cliente,
  origem: 'cronometro',
  treino: { id: 12, nome: 'Recepção básica' },
  iniciada_em: '2026-11-06T21:00:00Z',
  finalizada_em: '2026-11-06T21:38:10Z',
  duracao_segundos: 2100,
  observacao: null,
  series: [
    {
      id: 301,
      exercicio: { id: 5, nome: 'Manchete na parede', removido: false },
      fundamento: 'recepcao',
      numero: 1,
      repeticoes: 10,
      acertos: 7,
      erros: 3,
      duracao_segundos: 95,
    },
  ],
};

describe('registrarSessao', () => {
  it('envia o corpo em POST /sessoes e devolve a sessao sem o envelope data (201)', async () => {
    const recebidos = [];
    servidor.use(
      rede.post('/api/v1/sessoes', async ({ request }) => {
        recebidos.push(await request.json());
        return HttpResponse.json({ data: SESSAO }, { status: 201 });
      }),
    );
    const sessao = await registrarSessao(CORPO);
    expect(sessao).toEqual(SESSAO);
    expect(recebidos).toEqual([CORPO]);
  });

  it('no reenvio o servidor responde 200 com a mesma sessao, e o resultado e igual', async () => {
    servidor.use(rede.post('/api/v1/sessoes', () => HttpResponse.json({ data: SESSAO }, { status: 200 })));
    await expect(registrarSessao(CORPO)).resolves.toEqual(SESSAO);
  });

  it('422 e devolvido como erro com o corpo da API', async () => {
    servidor.use(
      rede.post('/api/v1/sessoes', () =>
        HttpResponse.json(
          { message: 'Dados inválidos.', errors: { 'series.0.exercicio_id': ['fora do treino'] }, request_id: 'r-1' },
          { status: 422 },
        ),
      ),
    );
    await expect(registrarSessao(CORPO)).rejects.toMatchObject({
      response: { status: 422, data: { errors: { 'series.0.exercicio_id': ['fora do treino'] } } },
    });
  });
});

describe('buscarSessao', () => {
  it('busca GET /sessoes/{id} e devolve a sessao sem o envelope', async () => {
    servidor.use(rede.get('/api/v1/sessoes/40', () => HttpResponse.json({ data: SESSAO })));
    await expect(buscarSessao(40)).resolves.toEqual(SESSAO);
  });

  it('404 vira erro com o status', async () => {
    servidor.use(
      rede.get('/api/v1/sessoes/99', () =>
        HttpResponse.json({ message: 'Não encontrado.', request_id: 'r-2' }, { status: 404 }),
      ),
    );
    await expect(buscarSessao(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});
