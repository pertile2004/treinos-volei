import { http as rede, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { servidor } from '../testes/servidor.js';
import { definirNavegacao, http } from './http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

afterEach(() => {
  window.history.pushState({}, '', '/');
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('http', () => {
  it('envia um X-Request-Id novo a cada requisicao', async () => {
    const ids = [];
    servidor.use(
      rede.get('/api/v1/saude', ({ request }) => {
        ids.push(request.headers.get('x-request-id'));
        return HttpResponse.json({ data: { status: 'ok' } });
      }),
    );
    await http.get('/saude');
    await http.get('/saude');
    expect(ids[0]).toMatch(UUID);
    expect(ids[1]).toMatch(UUID);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('em 419 busca o cookie e repete uma unica vez', async () => {
    let posts = 0;
    let cookies = 0;
    const tokens = [];
    servidor.use(
      rede.get('/sanctum/csrf-cookie', () => {
        cookies += 1;
        document.cookie = 'XSRF-TOKEN=novo; path=/';
        return new HttpResponse(null, { status: 204 });
      }),
      rede.post('/api/v1/exemplo', async ({ request }) => {
        posts += 1;
        tokens.push(request.headers.get('x-xsrf-token'));
        if (posts === 1) return HttpResponse.json({ message: 'CSRF token mismatch.' }, { status: 419 });
        return HttpResponse.json({ data: await request.json() }, { status: 201 });
      }),
    );
    const resposta = await http.post('/exemplo', { nome: 'a' });
    expect(resposta.status).toBe(201);
    expect(resposta.data).toEqual({ data: { nome: 'a' } });
    expect(posts).toBe(2);
    expect(cookies).toBe(1);
    expect(tokens).toEqual([null, 'novo']);
  });

  it('em 419 com token vencido repete com o token novo e outro X-Request-Id', async () => {
    document.cookie = 'XSRF-TOKEN=vencido; path=/';
    const pedidos = [];
    servidor.use(
      rede.get('/sanctum/csrf-cookie', () => {
        document.cookie = 'XSRF-TOKEN=novo; path=/';
        return new HttpResponse(null, { status: 204 });
      }),
      rede.post('/api/v1/exemplo', ({ request }) => {
        pedidos.push([request.headers.get('x-xsrf-token'), request.headers.get('x-request-id')]);
        if (pedidos.length === 1) return HttpResponse.json({ message: 'CSRF token mismatch.' }, { status: 419 });
        return HttpResponse.json({ data: { ok: true } });
      }),
    );
    await http.post('/exemplo', { nome: 'a' });
    expect(pedidos.map(([token]) => token)).toEqual(['vencido', 'novo']);
    expect(pedidos[0][1]).toMatch(UUID);
    expect(pedidos[1][1]).toMatch(UUID);
    expect(pedidos[0][1]).not.toBe(pedidos[1][1]);
  });

  it('em 419 repetido desiste depois de uma repeticao', async () => {
    let posts = 0;
    let cookies = 0;
    servidor.use(
      rede.get('/sanctum/csrf-cookie', () => {
        cookies += 1;
        return new HttpResponse(null, { status: 204 });
      }),
      rede.post('/api/v1/exemplo', () => {
        posts += 1;
        return HttpResponse.json({ message: 'CSRF token mismatch.' }, { status: 419 });
      }),
    );
    await expect(http.post('/exemplo', {})).rejects.toMatchObject({ response: { status: 419 } });
    expect(posts).toBe(2);
    expect(cookies).toBe(1);
  });

  it('em 401 manda para /entrar guardando a rota pedida', async () => {
    const navegar = vi.fn();
    definirNavegacao(navegar);
    window.history.pushState({}, '', '/evolucao?periodo=mes');
    servidor.use(rede.get('/api/v1/eu', () => HttpResponse.json({ message: 'Nao autenticado.' }, { status: 401 })));
    await expect(http.get('/eu')).rejects.toMatchObject({ response: { status: 401 } });
    expect(navegar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith('/entrar?voltar=%2Fevolucao%3Fperiodo%3Dmes');
  });

  it('em 401 ja em /entrar nao redireciona', async () => {
    const navegar = vi.fn();
    definirNavegacao(navegar);
    window.history.pushState({}, '', '/entrar');
    servidor.use(rede.get('/api/v1/eu', () => HttpResponse.json({ message: 'Nao autenticado.' }, { status: 401 })));
    await expect(http.get('/eu')).rejects.toMatchObject({ response: { status: 401 } });
    expect(navegar).not.toHaveBeenCalled();
  });

  it('erro de rede guarda o id enviado', async () => {
    servidor.use(rede.get('/api/v1/saude', () => HttpResponse.error()));
    const erro = await http.get('/saude').catch((e) => e);
    expect(erro.response).toBeUndefined();
    expect(erro.config.headers.get('X-Request-Id')).toMatch(UUID);
  });
});

describe('http e os caches do PWA', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('em 401 apaga os caches de API do service worker (sessão encerrada)', async () => {
    const apagar = vi.fn(async () => true);
    vi.stubGlobal('caches', { keys: async () => ['api-biblioteca', 'workbox-precache-v2'], delete: apagar });
    definirNavegacao(vi.fn());
    servidor.use(rede.get('/api/v1/eu', () => HttpResponse.json({ message: 'Nao autenticado.' }, { status: 401 })));
    await expect(http.get('/eu')).rejects.toMatchObject({ response: { status: 401 } });
    await vi.waitFor(() => expect(apagar).toHaveBeenCalledWith('api-biblioteca'));
    expect(apagar).toHaveBeenCalledTimes(1);
  });

  it('em 401 já em /entrar também apaga os caches de API', async () => {
    const apagar = vi.fn(async () => true);
    vi.stubGlobal('caches', { keys: async () => ['api-biblioteca'], delete: apagar });
    window.history.pushState({}, '', '/entrar');
    servidor.use(rede.get('/api/v1/eu', () => HttpResponse.json({ message: 'Nao autenticado.' }, { status: 401 })));
    await expect(http.get('/eu')).rejects.toMatchObject({ response: { status: 401 } });
    await vi.waitFor(() => expect(apagar).toHaveBeenCalledWith('api-biblioteca'));
  });

  it('em 200 não mexe nos caches', async () => {
    const apagar = vi.fn(async () => true);
    vi.stubGlobal('caches', { keys: async () => ['api-biblioteca'], delete: apagar });
    servidor.use(rede.get('/api/v1/saude', () => HttpResponse.json({ data: { status: 'ok' } })));
    await http.get('/saude');
    expect(apagar).not.toHaveBeenCalled();
  });
});
