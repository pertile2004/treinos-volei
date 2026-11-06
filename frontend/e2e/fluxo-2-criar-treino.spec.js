// Fluxo 2 (PR-12): entrar → Criar treino → nome e nível → exercícios em duas etapas → reordenar pelo
// teclado → ajustar séries → salvar → confirmação; axe sem violações.
// Segue a infraestrutura do rascunho do PR-05: caminhos relativos ao baseURL do playwright.config.js
// (sem porta fixa), conta nova por execução (as cópias de trabalho compartilham o mesmo PostgreSQL) e
// Chromium. Precisa de exercícios na biblioteca (seed do PR-08).
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SENHA = 'Senha-forte-123';

function emailUnico() {
  return `e2e-treino-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemplo.com`;
}

function valorDoCookie(cookies, nome) {
  const cookie = cookies.find((item) => item.name === nome);
  return cookie ? decodeURIComponent(cookie.value) : null;
}

/**
 * Cria uma conta de jogador pela API (contrato do PR-04) usando o contexto da própria página,
 * para que a sessão iniciada pelo cadastro valha nas telas. Evita depender dos rótulos da tela de cadastro.
 */
async function criarContaEEntrar(page) {
  await page.request.get('/sanctum/csrf-cookie');
  const token = valorDoCookie(await page.context().cookies(), 'XSRF-TOKEN');
  expect(token, 'o cookie XSRF-TOKEN precisa existir depois de GET /sanctum/csrf-cookie').toBeTruthy();

  const email = emailUnico();
  const resposta = await page.request.post('/api/v1/auth/cadastro', {
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': token },
    data: {
      nome: 'Atleta E2E',
      email,
      password: SENHA,
      password_confirmation: SENHA,
      papel: 'jogador',
      aceite_termos: true,
    },
  });
  expect(resposta.status(), await resposta.text()).toBe(201);
  return email;
}

async function semViolacoes(page) {
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(resultado.violations).toEqual([]);
}

async function nomesDosItens(regiao) {
  return regiao.getByRole('listitem').getByRole('heading', { level: 4 }).allTextContents();
}

/** Abre o seletor da etapa, adiciona os primeiros `quantidade` exercícios da lista e fecha. */
async function adicionarPrimeiros(page, etapa, quantidade) {
  await page.getByRole('button', { name: `Adicionar exercício em ${etapa}` }).click();
  const seletor = page.getByRole('region', { name: `Seletor de exercícios para ${etapa}` });
  await expect(seletor.getByRole('textbox', { name: 'Buscar exercício' })).toBeFocused();
  const lista = seletor.getByRole('list', { name: 'Exercícios da biblioteca' });
  await expect(lista).toBeVisible();
  const botoes = lista.getByRole('button', { name: /^Adicionar / });
  expect(await botoes.count(), 'a biblioteca precisa ter exercícios (seed)').toBeGreaterThanOrEqual(quantidade);
  for (let i = 0; i < quantidade; i += 1) {
    await botoes.nth(i).click();
  }
  await seletor.getByRole('button', { name: 'Fechar seletor de exercícios' }).click();
  await expect(page.getByRole('button', { name: `Adicionar exercício em ${etapa}` })).toBeFocused();
}

test.describe('Fluxo 2: criar um treino', () => {
  test('monta um treino com duas etapas, reordena pelo teclado, ajusta séries e salva', async ({ page }) => {
    await criarContaEEntrar(page);

    await page.goto('/treinos/novo');
    await expect(page.getByRole('heading', { level: 1, name: 'Criar treino' })).toBeVisible();

    await page.getByLabel('Nome do treino').fill('Recepção e saque — E2E');
    await page.getByLabel('Descrição (opcional)').fill('Treino criado pelo fluxo 2.');
    await page.getByLabel('Nível').selectOption({ index: 1 });
    // Jogador: a visibilidade é só "Privado" e não há campo para escolher.
    await expect(page.getByText('Visibilidade:')).toBeVisible();

    await adicionarPrimeiros(page, 'Aquecimento', 1);
    await adicionarPrimeiros(page, 'Técnica', 2);

    const tecnica = page.getByRole('region', { name: 'Técnica' });
    const antes = await nomesDosItens(tecnica);
    expect(antes).toHaveLength(2);

    // Reordenar só pelo teclado: foco no botão "para baixo" do primeiro item e Enter.
    await tecnica
      .getByRole('button', { name: /^Mover .* para baixo$/ })
      .first()
      .focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => nomesDosItens(tecnica)).toEqual([antes[1], antes[0]]);
    await expect(page.getByRole('status', { name: 'Avisos do treino' })).toContainText('movido para a posição 2 de 2');
    // O primeiro da etapa não sobe; o último não desce.
    await expect(tecnica.getByRole('button', { name: /^Mover .* para cima$/ }).first()).toBeDisabled();
    await expect(tecnica.getByRole('button', { name: /^Mover .* para baixo$/ }).last()).toBeDisabled();

    // Ajustar as séries do primeiro item da Técnica com o Stepper.
    const series = tecnica.getByRole('group', { name: 'Séries' }).first();
    const valorAntes = Number(await series.getByRole('status').textContent());
    await series.getByRole('button', { name: 'Aumentar Séries' }).click();
    await expect(series.getByRole('status')).toHaveText(String(Math.min(10, valorAntes + 1)));

    await semViolacoes(page);

    await page.getByRole('button', { name: 'Salvar treino' }).click();
    const confirmacao = page.getByRole('status', { name: 'Treino criado.' });
    await expect(confirmacao).toBeVisible();
    await expect(confirmacao).toContainText('Recepção e saque — E2E');
    await expect(confirmacao).toContainText('3 exercícios');
    await expect(confirmacao.getByRole('link', { name: 'Ver treino' })).toHaveAttribute('href', /^\/treinos\/\d+$/);

    await semViolacoes(page);
  });

  test('salvar sem exercícios mostra o erro e não cria o treino', async ({ page }) => {
    await criarContaEEntrar(page);
    await page.goto('/treinos/novo');
    await page.getByLabel('Nome do treino').fill('Treino vazio');
    await page.getByLabel('Nível').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Salvar treino' }).click();
    await expect(page.getByRole('alert')).toHaveText('Adicione pelo menos um exercício.');
    await expect(page.getByRole('status', { name: 'Treino criado.' })).toHaveCount(0);
  });
});
