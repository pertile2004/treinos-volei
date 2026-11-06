import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { SEMANA, registrarEstatisticas } from '../../testes/exemplosDeEstatisticas.js';
import { servidor } from '../../testes/servidor.js';
import { PERIODOS, ehPeriodoValido, obterEstatisticas } from './api.js';

describe('PERIODOS', () => {
  it('sao semana, mes, 3meses e ano, na ordem das abas', () => {
    expect(PERIODOS.map((item) => item.id)).toEqual(['semana', 'mes', '3meses', 'ano']);
    expect(PERIODOS.map((item) => item.rotulo)).toEqual(['Semana', 'Mês', '3 Meses', 'Ano']);
  });

  it('ehPeriodoValido reconhece so os quatro valores', () => {
    for (const periodo of ['semana', 'mes', '3meses', 'ano']) expect(ehPeriodoValido(periodo)).toBe(true);
    for (const invalido of ['dia', '', null, undefined, 'SEMANA', 3]) expect(ehPeriodoValido(invalido)).toBe(false);
  });
});

describe('obterEstatisticas', () => {
  it('chama GET /estatisticas com o periodo e devolve o conteudo de data', async () => {
    const pedidos = registrarEstatisticas();
    await expect(obterEstatisticas('semana')).resolves.toEqual(SEMANA);
    expect(pedidos).toEqual(['semana']);
  });

  it('envia 3meses sem alterar o valor', async () => {
    const pedidos = registrarEstatisticas();
    await obterEstatisticas('3meses');
    expect(pedidos).toEqual(['3meses']);
  });

  it('periodo invalido e erro de programacao: rejeita sem chamar a API', async () => {
    const pedidos = registrarEstatisticas();
    await expect(obterEstatisticas('dia')).rejects.toThrow(TypeError);
    await expect(obterEstatisticas()).rejects.toThrow(TypeError);
    expect(pedidos).toEqual([]);
  });

  it('propaga o 401 da API', async () => {
    servidor.use(
      rede.get('/api/v1/estatisticas', () =>
        HttpResponse.json({ message: 'Não autenticado.', request_id: 'req-401' }, { status: 401 }),
      ),
    );
    await expect(obterEstatisticas('semana')).rejects.toMatchObject({ response: { status: 401 } });
  });
});
