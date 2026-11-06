import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../app/rotas.jsx';
import { renderizarRotas } from '../testes/renderizar.jsx';

const PAGINAS = [
  ['/termos', 'Termos de uso'],
  ['/privacidade', 'Política de privacidade'],
];

const SECOES = [/dados coletados/i, /finalidade/i, /direitos/i, /idade/i, /contato/i];

describe.each(PAGINAS)('%s', (caminho, titulo) => {
  it('abre fora do AppShell, dentro de um main, com um unico h1', async () => {
    renderizarRotas(rotas, caminho);
    const conteudo = await screen.findByRole('main');
    expect(within(conteudo).getByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
    expect(document.title).toBe(`${titulo} · VOLLEY PRO`);
  });

  it('tem as secoes de dados coletados, finalidade, direitos, idade e contato', async () => {
    renderizarRotas(rotas, caminho);
    await screen.findByRole('heading', { level: 1, name: titulo });
    const secoes = screen.getAllByRole('heading', { level: 2 }).map((h2) => h2.textContent);
    for (const secao of SECOES) {
      expect(secoes.some((texto) => secao.test(texto))).toBe(true);
    }
    const texto = screen.getByRole('main').textContent;
    for (const direito of ['acesso', 'correção', 'exportação', 'exclusão']) {
      expect(texto.toLowerCase()).toContain(direito);
    }
    // RN-14: idade não é verificada e a data de nascimento é opcional.
    expect(texto).toMatch(/não verifica idade/i);
    expect(texto).toMatch(/data de nascimento é opcional/i);
    // Nada inventado: nenhum e-mail de contato aparece até o grupo definir o canal.
    expect(texto).not.toMatch(/[\w.-]+@[\w-]+\.[\w.]+/);
  });

  it('tem links para criar conta e entrar', async () => {
    renderizarRotas(rotas, caminho);
    await screen.findByRole('heading', { level: 1, name: titulo });
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro');
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
  });

  it('nao tem violacoes de acessibilidade', async () => {
    renderizarRotas(rotas, caminho);
    await screen.findByRole('heading', { level: 1, name: titulo });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('ligação entre as páginas legais', () => {
  it('Termos aponta para a Política de Privacidade e vice-versa', async () => {
    renderizarRotas(rotas, '/termos');
    await screen.findByRole('heading', { level: 1, name: 'Termos de uso' });
    expect(screen.getAllByRole('link', { name: 'Política de Privacidade' })[0]).toHaveAttribute('href', '/privacidade');
  });

  it('Privacidade aponta para os Termos de Uso', async () => {
    renderizarRotas(rotas, '/privacidade');
    await screen.findByRole('heading', { level: 1, name: 'Política de privacidade' });
    expect(screen.getAllByRole('link', { name: 'Termos de Uso' })[0]).toHaveAttribute('href', '/termos');
  });
});
