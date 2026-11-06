import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import SecaoBase from './SecaoBase.jsx';

const COMPONENTES = ['Botao', 'CampoTexto', 'Cartao', 'ChipFiltro', 'Etiqueta'];
const VARIANTES = ['Primário', 'Secundário', 'Fantasma', 'Perigo'];

function renderizar() {
  return render(
    <MemoryRouter>
      <main>
        <h1>Catálogo de componentes</h1>
        <SecaoBase />
      </main>
    </MemoryRouter>,
  );
}

describe('SecaoBase', () => {
  it('é uma região "Base" com um h2 e um h3 com o nome exato de cada componente do pacote', () => {
    renderizar();
    const secao = screen.getByRole('region', { name: 'Base' });
    expect(within(secao).getByRole('heading', { level: 2, name: 'Base' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(
      within(secao)
        .getAllByRole('heading', { level: 3 })
        .map((titulo) => titulo.textContent),
    ).toEqual(COMPONENTES);
  });

  it('mostra todas as variações, tamanhos e estados de Botao, CampoTexto e Cartao', () => {
    renderizar();
    for (const nome of VARIANTES) {
      expect(screen.getByRole('button', { name: nome })).toHaveClass('min-h-11');
      expect(screen.getByRole('button', { name: `${nome} pequeno` })).toHaveClass('min-h-8');
      expect(screen.getByRole('button', { name: `${nome} desabilitado` })).toBeDisabled();
      expect(screen.getByRole('button', { name: `${nome} carregando` })).toHaveAttribute('aria-busy', 'true');
    }
    expect(screen.getByRole('button', { name: 'Largura total' })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Adicionar exercício' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toHaveAttribute('href', '/cadastro');
    expect(screen.getByLabelText('Seu nome')).toBeRequired();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Campo desabilitado')).toBeDisabled();
    expect(screen.getByRole('link', { name: /Treino de saque/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resumo da semana' })).toBeInTheDocument();
  });

  it('mostra o ChipFiltro nos quatro estados e ele alterna ao clicar', async () => {
    renderizar();
    const saque = screen.getByRole('button', { name: 'Saque' });
    const ataque = screen.getByRole('button', { name: 'Ataque' });
    expect(saque).toHaveAttribute('aria-pressed', 'true');
    expect(ataque).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(ataque);
    await userEvent.click(saque);
    expect(ataque).toHaveAttribute('aria-pressed', 'true');
    expect(saque).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Iniciante' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Avançado' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Avançado' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('mostra a Etiqueta de cada fundamento, de cada etapa e a neutra', () => {
    const { container } = renderizar();
    expect(container.querySelectorAll('[data-tipo="fundamento"]')).toHaveLength(7);
    expect(container.querySelectorAll('[data-tipo="etapa"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-tipo="neutra"]')).toHaveLength(1);
    expect(container.querySelector('[data-valor="preparo_fisico"]')).toHaveTextContent('Preparo físico');
    expect(container.querySelector('[data-valor="volta_a_calma"]')).toHaveTextContent('Volta à calma');
  });

  it('os botões de exemplo têm função: contam os cliques', async () => {
    renderizar();
    await userEvent.click(screen.getByRole('button', { name: 'Primário' }));
    await userEvent.click(screen.getByRole('button', { name: 'Perigo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Primário carregando' }));
    expect(screen.getByRole('status')).toHaveTextContent('Cliques nos botões de exemplo: 2');
  });

  it('Tab alcança todos os controles habilitados, na ordem do documento', async () => {
    const usuario = userEvent.setup();
    const { container } = renderizar();
    const esperados = [...container.querySelectorAll('button, a[href], input')].filter(
      (elemento) => !elemento.disabled,
    );
    expect(esperados.length).toBeGreaterThan(20);
    for (const elemento of esperados) {
      await usuario.tab();
      expect(elemento).toHaveFocus();
    }
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = renderizar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
