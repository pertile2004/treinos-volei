import { http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { REFERENCIAS, ROTULOS_DOS_FUNDAMENTOS, registrarReferencias } from '../../testes/exemplosDeEstatisticas.js';
import { servidor } from '../../testes/servidor.js';
import { mapaDeRotulos, obterReferencias } from './api.js';

describe('obterReferencias', () => {
  it('chama GET /referencias e devolve o conteudo de data', async () => {
    registrarReferencias();
    await expect(obterReferencias()).resolves.toEqual(REFERENCIAS);
  });

  it('propaga o erro do servidor', async () => {
    servidor.use(rede.get('/api/v1/referencias', () => HttpResponse.json({ message: 'Erro' }, { status: 500 })));
    await expect(obterReferencias()).rejects.toMatchObject({ response: { status: 500 } });
  });
});

describe('mapaDeRotulos', () => {
  it('transforma a lista valor/rotulo em um mapa', () => {
    expect(mapaDeRotulos(REFERENCIAS.fundamentos)).toEqual(ROTULOS_DOS_FUNDAMENTOS);
  });

  it('sem lista devolve um mapa vazio', () => {
    expect(mapaDeRotulos(undefined)).toEqual({});
    expect(mapaDeRotulos(null)).toEqual({});
  });
});
