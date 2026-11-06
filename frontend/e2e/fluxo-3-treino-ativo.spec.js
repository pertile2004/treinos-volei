// Fluxo 3 (PR-16): cria um treino pela API, executa marcando acertos e erros, recarrega no meio,
// pula os descansos, finaliza e salva; depois confere a sessão por GET /sessoes/{id}.
// Infraestrutura (playwright.config.js, portas E2E_API_PORT/E2E_WEB_PORT, job no CI) vem do PR-05:
// nenhuma porta fixa aqui, só caminhos relativos ao baseURL.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SENHA = 'senha-forte-123';

// As cópias de trabalho em paralelo compartilham o mesmo Postgres: cada execução usa um e-mail único.
function emailUnico() {
  return `treino-ativo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemplo.com`;
}

async function tokenCsrf(page) {
  await page.request.get('/sanctum/csrf-cookie');
  const cookie = (await page.context().cookies()).find((item) => item.name === 'XSRF-TOKEN');
  return decodeURIComponent(cookie.value);
}

async function enviar(page, caminho, dados) {
  const token = await tokenCsrf(page);
  return page.request.post(caminho, {
    data: dados,
    headers: { 'X-XSRF-TOKEN': token, Accept: 'application/json' },
  });
}

async function semViolacoes(page) {
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(resultado.violations).toEqual([]);
}

test.describe('Fluxo 3 — treino ativo', () => {
  test('executa um treino marcando acertos e erros, sobrevive ao recarregar e salva a sessão', async ({ page }) => {
    // Sessão e dados pela API (o cadastro já inicia a sessão).
    await page.goto('/entrar');
    const cadastro = await enviar(page, '/api/v1/auth/cadastro', {
      nome: 'Atleta do fluxo 3',
      email: emailUnico(),
      password: SENHA,
      password_confirmation: SENHA,
      papel: 'jogador',
      aceite_termos: true,
    });
    expect(cadastro.status()).toBe(201);

    const exercicios = await page.request.get('/api/v1/exercicios');
    expect(exercicios.ok()).toBe(true);
    const { data: biblioteca } = await exercicios.json();
    expect(biblioteca.length).toBeGreaterThanOrEqual(2);

    const treino = await enviar(page, '/api/v1/treinos', {
      nome: 'Treino do fluxo 3',
      descricao: null,
      nivel: 'iniciante',
      visibilidade: 'privado',
      itens: [
        { exercicio_id: biblioteca[0].id, etapa: 'tecnica', ordem: 1, series: 2, repeticoes: 5, descanso_segundos: 5 },
        {
          exercicio_id: biblioteca[1].id,
          etapa: 'volta_a_calma',
          ordem: 1,
          series: 1,
          duracao_segundos: 20,
          descanso_segundos: 0,
        },
      ],
    });
    expect(treino.status()).toBe(201);
    const { data: criado } = await treino.json();

    // Preparação.
    await page.goto(`/treinar/${criado.id}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Treino ativo' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Treino do fluxo 3' })).toBeVisible();
    await semViolacoes(page);

    // Exercício 1, série 1: acertos, erros e desfazer.
    await page.getByRole('button', { name: 'Iniciar treino' }).click();
    await expect(page.getByText('Exercício 1 de 2')).toBeVisible();
    await expect(page.getByText('Série 1 de 2')).toBeVisible();
    await page.getByRole('button', { name: '+ Acerto' }).click();
    await page.getByRole('button', { name: '+ Acerto' }).click();
    await page.getByRole('button', { name: '+ Erro' }).click();
    await page.getByRole('button', { name: '+ Erro' }).click();
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByRole('status', { name: 'Acertos' })).toHaveText('2');
    await expect(page.getByRole('status', { name: 'Erros' })).toHaveText('1');
    await semViolacoes(page);

    // Recarregar no meio mantém fase, série e contadores (critério A), sem voltar à preparação.
    await page.reload();
    await expect(page.getByText('Série 1 de 2')).toBeVisible();
    await expect(page.getByRole('status', { name: 'Acertos' })).toHaveText('2');
    await expect(page.getByRole('status', { name: 'Erros' })).toHaveText('1');
    await expect(page.getByRole('button', { name: 'Iniciar treino' })).toHaveCount(0);

    // Descanso e série 2.
    await page.getByRole('button', { name: 'Concluir série' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Descanso' })).toBeVisible();
    await page.getByRole('button', { name: 'Pular' }).click();
    await expect(page.getByText('Série 2 de 2')).toBeVisible();
    await page.getByRole('button', { name: '+ Acerto' }).click();
    await page.getByRole('button', { name: 'Concluir série' }).click();
    await page.getByRole('button', { name: 'Pular' }).click();

    // Próximo exercício e última série.
    await expect(page.getByRole('heading', { level: 2, name: 'Próximo exercício' })).toBeVisible();
    await page.getByRole('button', { name: 'Começar' }).click();
    await expect(page.getByText('Exercício 2 de 2')).toBeVisible();
    await page.getByRole('button', { name: 'Concluir série' }).click();

    // Resumo e salvar.
    await expect(page.getByRole('heading', { level: 2, name: 'Resumo do treino' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Observação (opcional)' }).fill('Fluxo 3 do Playwright');
    await semViolacoes(page);
    const salvar = page.waitForResponse(
      (resposta) => resposta.url().includes('/api/v1/sessoes') && resposta.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Finalizar e salvar treino' }).click();
    const resposta = await salvar;
    expect(resposta.status()).toBe(201);
    const { data: sessao } = await resposta.json();

    await expect(page).toHaveURL(/\/treino$/);
    await expect(page.getByRole('status')).toHaveText('Treino salvo.');
    await expect(page.getByRole('heading', { name: 'Treino em andamento' })).toHaveCount(0);

    // A sessão gravada tem as três séries, com os acertos e erros marcados.
    const detalhe = await page.request.get(`/api/v1/sessoes/${sessao.id}`);
    expect(detalhe.status()).toBe(200);
    const { data: gravada } = await detalhe.json();
    expect(gravada.id_cliente).toBe(sessao.id_cliente);
    expect(gravada.origem).toBe('cronometro');
    expect(gravada.treino).toMatchObject({ id: criado.id, nome: 'Treino do fluxo 3' });
    expect(gravada.observacao).toBe('Fluxo 3 do Playwright');
    expect(gravada.series.map((serie) => [serie.exercicio.id, serie.numero, serie.acertos, serie.erros])).toEqual([
      [biblioteca[0].id, 1, 2, 1],
      [biblioteca[0].id, 2, 1, 0],
      [biblioteca[1].id, 1, 0, 0],
    ]);
  });
});
