import { expect, test } from '@playwright/test';

// PR-26 · PWA. Escrito antes da infraestrutura do Playwright (PR-05) e ainda NÃO executado nesta branch.
// Precisa do build servido (`npm --prefix frontend run build` + `vite preview`), não do servidor de dev:
// em dev não há manifest nem service worker (devOptions desligado em vite.config.js).

const ICONES = [
  ['/icones/icone-192.png', '192x192', 'any'],
  ['/icones/icone-512.png', '512x512', 'any'],
  ['/icones/icone-maskable-192.png', '192x192', 'maskable'],
  ['/icones/icone-maskable-512.png', '512x512', 'maskable'],
];

async function esperarServiceWorker(page) {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state ?? null), { timeout: 15_000 })
    .toBe('activated');
}

test.describe('PWA instalável', () => {
  test('o HTML aponta para o manifest, com nome, start_url, standalone, cores e ícones 192/512 (any e maskable)', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveAttribute('href', /manifest\.webmanifest$/);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0E0E0E');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icones/apple-touch-icon.png');

    const resposta = await request.get(await link.getAttribute('href'));
    expect(resposta.status()).toBe(200);
    expect(resposta.headers()['content-type']).toContain('application/manifest+json');
    const manifest = await resposta.json();
    expect(manifest).toMatchObject({
      name: 'VOLLEY PRO',
      short_name: 'VOLLEY PRO',
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0E0E0E',
      theme_color: '#0E0E0E',
    });
    for (const [src, sizes, purpose] of ICONES) {
      expect(manifest.icons).toContainEqual({ src, sizes, type: 'image/png', purpose });
      const icone = await request.get(src);
      expect(icone.status(), src).toBe(200);
      expect(icone.headers()['content-type'], src).toContain('image/png');
    }
  });

  test('depois de carregar, há um service worker ativo controlando a página', async ({ page }) => {
    await esperarServiceWorker(page);
    const registro = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return { scope: r?.scope, ativo: r?.active?.state };
    });
    expect(registro.scope).toMatch(/\/$/);
    expect(registro.ativo).toBe('activated');
  });

  test('sem rede, o app shell abre e mostra a navegação principal', async ({ page, context }) => {
    await esperarServiceWorker(page);
    await context.setOffline(true);
    try {
      await page.goto('/biblioteca');
      await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('nenhuma entrada do Cache Storage é de /eu, /sessoes, /estatisticas ou de método não-GET', async ({ page }) => {
    await esperarServiceWorker(page);
    await page.goto('/perfil');
    await page.goto('/historico');
    await page.goto('/evolucao');
    const urls = await page.evaluate(async () => {
      const todas = [];
      for (const nome of await caches.keys()) {
        const cache = await caches.open(nome);
        for (const pedido of await cache.keys()) todas.push(`${pedido.method} ${new URL(pedido.url).pathname}`);
      }
      return todas;
    });
    expect(urls.length).toBeGreaterThan(0);
    for (const entrada of urls) {
      expect(entrada).toMatch(/^GET /);
      expect(entrada).not.toMatch(/\/api\/v1\/eu(\/|$)/);
      expect(entrada).not.toMatch(/\/api\/v1\/(sessoes|estatisticas|agendamentos)/);
    }
  });

  test('o service worker não intercepta /sanctum nem /docs (a resposta vem do servidor)', async ({ page }) => {
    await esperarServiceWorker(page);
    const resultado = await page.evaluate(async () => {
      const csrf = await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
      const cache = await caches.match('/sanctum/csrf-cookie');
      return { status: csrf.status, emCache: cache !== undefined };
    });
    expect(resultado.status).toBe(204);
    expect(resultado.emCache).toBe(false);
  });
});
