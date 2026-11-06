import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../../app/rotas.jsx';
import { renderizarRotas } from '../../testes/renderizar.jsx';

const SECOES = [
  ['Base', ['Botao', 'CampoTexto', 'Cartao', 'ChipFiltro', 'Etiqueta']],
  ['Navegação', ['Abas', 'Cabecalho', 'NavInferior', 'BarraLateral']],
  ['Treino', ['Stepper', 'BarraDeProgresso', 'Cronometro']],
  ['Apoio', ['Avatar', 'ModalDeConfirmacao', 'AvisoNovaVersao']],
];

const CONTROLES = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]';

async function abrirCatalogo() {
  renderizarRotas(rotas, '/dev/componentes');
  return screen.findByRole('heading', { level: 1, name: 'Catálogo de componentes' });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('/dev/componentes', () => {
  it('abre fora do AppShell, com um único h1 dentro do main e o titulo da aba', async () => {
    const titulo = await abrirCatalogo();
    expect(screen.getByRole('main')).toContainElement(titulo);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
    expect(document.title).toBe('Catálogo de componentes · VOLLEY PRO');
  });

  it('tem as quatro secoes (h2), na ordem, dentro do main', async () => {
    await abrirCatalogo();
    const titulos = within(screen.getByRole('main')).getAllByRole('heading', { level: 2 });
    expect(titulos.map((titulo) => titulo.textContent)).toEqual(['Base', 'Navegação', 'Treino', 'Apoio']);
  });

  it.each(SECOES)('a secao %s tem um h3 com o nome exato de cada componente', async (nome, componentes) => {
    await abrirCatalogo();
    const secao = screen.getByRole('region', { name: nome });
    expect(
      within(secao)
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(componentes);
  });

  it('mostra os 15 componentes do design system, cada um uma vez', async () => {
    await abrirCatalogo();
    const nomes = screen.getAllByRole('heading', { level: 3 }).map((titulo) => titulo.textContent);
    expect(nomes).toHaveLength(15);
    expect([...nomes].sort()).toEqual(SECOES.flatMap(([, componentes]) => componentes).sort());
  });

  it('não tem violações de acessibilidade', async () => {
    await abrirCatalogo();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  // O teste percorre todos os controles do catálogo: sem a espera entre teclas e com prazo próprio,
  // porque com a máquina ocupada (ou com cobertura, no CI) ele passa dos 5 s padrão.
  it('o Tab alcança o primeiro controle de cada secao, na ordem da página', { timeout: 30_000 }, async () => {
    const usuario = userEvent.setup({ delay: null });
    await abrirCatalogo();
    const focados = [];
    for (let passo = 0; passo < 400; passo += 1) {
      await usuario.tab();
      const atual = document.activeElement;
      if (atual === document.body || focados.includes(atual)) break;
      focados.push(atual);
    }
    const primeiros = SECOES.map(([nome]) => {
      const secao = screen.getByRole('region', { name: nome });
      const primeiroControle = secao.querySelector(CONTROLES);
      expect(primeiroControle, `a seção ${nome} tem pelo menos um controle`).not.toBeNull();
      expect(focados.find((elemento) => secao.contains(elemento))).toBe(primeiroControle);
      return focados.indexOf(primeiroControle);
    });
    expect(primeiros).toEqual([...primeiros].sort((a, b) => a - b));
  });

  it('fora do ambiente de desenvolvimento a rota não existe e cai na 404', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { rotas: rotasDeProducao } = await import('../../app/rotas.jsx');
    const caminhos = rotasDeProducao.flatMap((rota) => (rota.children ?? [rota]).map((r) => r.path));
    expect(caminhos).not.toContain('dev/componentes');
    renderizarRotas(rotasDeProducao, '/dev/componentes');
    expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Catálogo de componentes' })).not.toBeInTheDocument();
  });
});
