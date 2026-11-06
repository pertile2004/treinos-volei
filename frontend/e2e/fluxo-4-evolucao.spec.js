// Fluxo 4 (RF-11): o usuário demo entra, abre /evolucao, vê os gráficos, troca de aba e abre a tabela.
// Infraestrutura (playwright.config.js, webServer, job e2e) nasce no PR-05; o banco do E2E precisa do DemoSeeder.
// O e-mail do Guto é a constante DemoSeeder::EMAIL_GUTO; a senha vem de DEMO_SENHA (a mesma variável que o seeder lê),
// nunca do repositório.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const EMAIL_DEMO = process.env.DEMO_EMAIL ?? 'guto@example.com';
const SENHA_DEMO = process.env.DEMO_SENHA;

async function semViolacoes(page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(resultado.violations).toEqual([]);
}

test.describe('Fluxo 4: ver evolução', () => {
  test.beforeEach(async ({ page }) => {
    expect(SENHA_DEMO, 'Defina DEMO_SENHA com a senha das contas do DemoSeeder.').toBeTruthy();
    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill(EMAIL_DEMO);
    await page.getByLabel('Senha', { exact: true }).fill(SENHA_DEMO);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('usuário demo vê os gráficos, troca de aba e abre a tabela equivalente', async ({ page }) => {
    await page.getByRole('link', { name: 'Evolução' }).click();
    await expect(page).toHaveURL(/\/evolucao$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Evolução' })).toBeVisible();

    // Semana: os três cartões, com o resumo em texto do gráfico.
    await expect(page.getByRole('tab', { name: 'Semana' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { level: 2, name: 'Volume de treino (min)' })).toBeVisible();
    await expect(page.getByText(/Total no período:/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Performance por fundamento' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Frequência' })).toBeVisible();
    await expect(page.getByText(/\d de \d dias nesta semana/)).toBeVisible();

    // O seed deixa ao menos um fundamento sem tentativas: aparece "sem dados", nunca 0% (aceite 1).
    const semDados = page.getByRole('listitem').filter({ hasText: /sem dados/i });
    await expect(semDados.first()).toBeVisible();
    await expect(semDados.first()).not.toContainText('0%');
    await semViolacoes(page);

    // Trocar de aba pede o período certo à API.
    const respostaMes = page.waitForResponse((resposta) => resposta.url().includes('/api/v1/estatisticas?periodo=mes'));
    await page.getByRole('tab', { name: 'Mês' }).click();
    expect((await respostaMes).status()).toBe(200);
    await expect(page.getByRole('tab', { name: 'Mês' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(/Total no período:/)).toBeVisible();

    // Tabela equivalente aos gráficos.
    const alternar = page.getByRole('button', { name: 'Ver como tabela' });
    await expect(alternar).toHaveAttribute('aria-pressed', 'false');
    await alternar.click();
    await expect(page.getByRole('button', { name: 'Ver gráficos' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('table', { name: 'Volume de treino (min)' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Performance por fundamento' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '% de acerto' })).toBeVisible();
    await semViolacoes(page);
  });
});
