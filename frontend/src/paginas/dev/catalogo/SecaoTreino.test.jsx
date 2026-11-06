import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import SecaoTreino from './SecaoTreino.jsx';

const COMPONENTES = ['Stepper', 'BarraDeProgresso', 'Cronometro'];

function renderizar() {
  return render(
    <main>
      <h1>Catálogo de componentes</h1>
      <SecaoTreino />
    </main>,
  );
}

const bloco = (nome) => screen.getByRole('heading', { level: 3, name: nome }).parentElement;

describe('SecaoTreino', () => {
  it('é uma região "Treino" com um h2 e um h3 com o nome exato de cada componente do pacote', () => {
    renderizar();
    const secao = screen.getByRole('region', { name: 'Treino' });
    expect(secao.tagName).toBe('SECTION');
    expect(within(secao).getByRole('heading', { level: 2, name: 'Treino' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(
      within(secao)
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(COMPONENTES);
  });

  it('mostra todos os estados e variações', () => {
    renderizar();
    expect(within(bloco('Stepper')).getAllByRole('group')).toHaveLength(4);
    expect(within(bloco('Stepper')).getByRole('button', { name: 'Diminuir Séries' })).toBeDisabled();
    expect(within(bloco('Stepper')).getByRole('button', { name: 'Aumentar Descanso em segundos' })).toBeDisabled();
    expect(within(bloco('Stepper')).getByRole('button', { name: 'Aumentar Carga' })).toBeDisabled();
    expect(within(bloco('BarraDeProgresso')).getAllByRole('progressbar')).toHaveLength(4);
    expect(within(bloco('BarraDeProgresso')).getByText('Sem dados')).toBeInTheDocument();
    expect(within(bloco('BarraDeProgresso')).getByText('100%')).toBeInTheDocument();
    expect(within(bloco('Cronometro')).getAllByRole('timer')).toHaveLength(3);
    expect(within(bloco('Cronometro')).getByRole('timer', { name: 'Tempo total' })).toHaveTextContent('1:02:05');
    expect(within(bloco('Cronometro')).getByRole('timer', { name: 'Descanso' })).toHaveClass('text-2xl');
  });

  it('usa os textos corrigidos do DESIGN.md', () => {
    renderizar();
    expect(screen.getByRole('progressbar', { name: 'Volume de treino (min)' })).toBeInTheDocument();
  });

  it('o Stepper de exemplo funciona de verdade', async () => {
    renderizar();
    const grupo = screen.getByRole('group', { name: 'Repetições' });
    const antes = Number(within(grupo).getByRole('status').textContent);
    await userEvent.click(within(grupo).getByRole('button', { name: 'Aumentar Repetições' }));
    expect(within(grupo).getByRole('status')).toHaveTextContent(String(antes + 1));
  });

  it('Tab alcança todos os controles habilitados, na ordem do documento', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();
    const esperados = [...container.querySelectorAll('button')].filter((botao) => !botao.disabled);
    expect(esperados).toHaveLength(4);
    for (const botao of esperados) {
      await usuario.tab();
      expect(botao).toHaveFocus();
    }
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = renderizar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
