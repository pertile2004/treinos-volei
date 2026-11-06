// Fluxo E2E da Biblioteca (PR-08). Depende da infraestrutura do PR-05 (playwright.config.js, webServer,
// @playwright/test e @axe-core/playwright) e do cadastro/entrar da API (PR-04/05) para abrir a sessão.
// Sem porta fixa: tudo relativo ao baseURL do playwright.config.js.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

function emailUnico() {
  return `biblioteca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemplo.com`;
}

// Abre a sessão pela API, no mesmo contexto do navegador (cookies de sessão do Sanctum).
async function entrar(page) {
  await page.goto('/entrar');
  await page.request.get('/sanctum/csrf-cookie');
  const cookies = await page.context().cookies();
  const xsrf = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN');
  const senha = 'SenhaForte123';
  const resposta = await page.request.post('/api/v1/auth/cadastro', {
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf?.value ?? '') },
    data: {
      nome: 'Atleta de Teste',
      email: emailUnico(),
      password: senha,
      password_confirmation: senha,
      papel: 'jogador',
      aceite_termos: true,
    },
  });
  expect(resposta.status()).toBe(201);
}

async function semViolacoes(page) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(resultado.violations).toEqual([]);
}

test('filtrar por chip, buscar sem acento e abrir um exercicio sem video', async ({ page }) => {
  await entrar(page);

  await page.goto('/biblioteca');
  await expect(page.getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeVisible();
  const lista = page.getByRole('list', { name: 'Exercícios' });
  await expect(lista).toBeVisible();
  await semViolacoes(page);

  // Critério A: filtros combinados.
  const fundamentos = page.getByRole('group', { name: 'Fundamento' });
  await fundamentos.getByRole('button', { name: 'Recepção' }).click();
  await expect(fundamentos.getByRole('button', { name: 'Recepção' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('group', { name: 'Nível' }).getByRole('button', { name: 'Iniciante' }).click();
  await expect(page).toHaveURL(/fundamento=recepcao/);
  await expect(page).toHaveURL(/nivel=iniciante/);
  await expect(lista.getByRole('listitem').first()).toContainText('Recepção');
  await expect(lista.getByRole('listitem').first()).toContainText('Iniciante');

  // Critério B: "recepcao" encontra "Recepção".
  await fundamentos.getByRole('button', { name: 'Todos' }).click();
  await page.getByRole('group', { name: 'Nível' }).getByRole('button', { name: 'Todos' }).click();
  await page.getByRole('searchbox', { name: 'Buscar exercício' }).fill('recepcao');
  await expect(page).toHaveURL(/busca=recepcao/);
  await expect(lista.getByRole('listitem').first()).toContainText(/Recep/i);

  // Critério C: sem vídeo, o detalhe não tem player.
  const semVideo = lista.getByRole('listitem').filter({ hasNotText: 'Com vídeo' }).first();
  await semVideo.getByRole('link').click();
  await expect(page).toHaveURL(/\/exercicios\/\d+$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Descrição' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Padrões' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await semViolacoes(page);

  // Só teclado: Tab chega ao Voltar e Enter volta para a Biblioteca.
  await page.keyboard.press('Tab');
  await page.getByRole('link', { name: 'Voltar' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/biblioteca/);
});
