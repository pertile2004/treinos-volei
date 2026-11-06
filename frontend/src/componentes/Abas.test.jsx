import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Abas, { PainelDaAba } from './Abas.jsx';

const itens = [
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'tres-meses', rotulo: '3 Meses' },
  { id: 'ano', rotulo: 'Ano' },
];

function Exemplo({ inicial = 'semana', aoMudar = () => {} }) {
  const [ativa, setAtiva] = useState(inicial);
  return (
    <>
      <Abas
        itens={itens}
        ativa={ativa}
        rotuloDoGrupo="Período"
        aoMudar={(id) => {
          setAtiva(id);
          aoMudar(id);
        }}
      />
      {itens.map((item) => (
        <PainelDaAba key={item.id} id={item.id} ativa={ativa}>
          Conteúdo de {item.rotulo}
        </PainelDaAba>
      ))}
    </>
  );
}

const aba = (nome) => screen.getByRole('tab', { name: nome });

describe('Abas', () => {
  it('monta a lista de abas com o rotulo do grupo e uma aba por item, na ordem', () => {
    render(<Exemplo />);
    expect(screen.getByRole('tablist', { name: 'Período' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((el) => el.textContent)).toEqual(['Semana', 'Mês', '3 Meses', 'Ano']);
  });

  it('só a aba ativa tem aria-selected verdadeiro e tabindex 0', () => {
    render(<Exemplo inicial="mes" />);
    expect(aba('Mês')).toHaveAttribute('aria-selected', 'true');
    expect(aba('Mês')).toHaveAttribute('tabindex', '0');
    for (const nome of ['Semana', '3 Meses', 'Ano']) {
      expect(aba(nome)).toHaveAttribute('aria-selected', 'false');
      expect(aba(nome)).toHaveAttribute('tabindex', '-1');
    }
  });

  it('liga cada aba ao seu painel pelos ids aba-<id> e painel-<id> e mostra só o painel da aba ativa', () => {
    render(<Exemplo inicial="mes" />);
    const painel = screen.getByRole('tabpanel', { name: 'Mês' });
    expect(painel).toHaveTextContent('Conteúdo de Mês');
    expect(aba('Mês')).toHaveAttribute('id', 'aba-mes');
    expect(aba('Mês')).toHaveAttribute('aria-controls', 'painel-mes');
    expect(painel).toHaveAttribute('id', 'painel-mes');
    expect(painel).toHaveAttribute('aria-labelledby', 'aba-mes');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.queryByText('Conteúdo de Semana')).not.toBeInTheDocument();
  });

  it('o painel inativo continua na página, escondido, para o aria-controls da aba valer', () => {
    render(<Exemplo inicial="mes" />);
    const inativo = document.getElementById(aba('Semana').getAttribute('aria-controls'));
    expect(inativo).toHaveAttribute('role', 'tabpanel');
    expect(inativo).toHaveAttribute('hidden');
    expect(inativo).toHaveAttribute('aria-labelledby', 'aba-semana');
  });

  it('o clique chama aoMudar com o id da aba e troca o painel', async () => {
    const aoMudar = vi.fn();
    render(<Exemplo aoMudar={aoMudar} />);
    await userEvent.click(aba('3 Meses'));
    expect(aoMudar).toHaveBeenCalledTimes(1);
    expect(aoMudar).toHaveBeenCalledWith('tres-meses');
    expect(screen.getByRole('tabpanel', { name: '3 Meses' })).toHaveTextContent('Conteúdo de 3 Meses');
  });

  it('as setas movem o foco e a selecao, dando a volta nas pontas', async () => {
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();
    render(<Exemplo aoMudar={aoMudar} />);
    await usuario.tab();
    expect(aba('Semana')).toHaveFocus();

    await usuario.keyboard('{ArrowRight}');
    expect(aba('Mês')).toHaveFocus();
    expect(aba('Mês')).toHaveAttribute('aria-selected', 'true');
    expect(aoMudar).toHaveBeenLastCalledWith('mes');

    await usuario.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(aba('Ano')).toHaveFocus();
    expect(aba('Ano')).toHaveAttribute('aria-selected', 'true');
    expect(aoMudar).toHaveBeenLastCalledWith('ano');

    await usuario.keyboard('{ArrowRight}');
    expect(aba('Semana')).toHaveFocus();
    expect(aba('Semana')).toHaveAttribute('tabindex', '0');
    expect(aba('Ano')).toHaveAttribute('tabindex', '-1');
  });

  it('Home e End vão para a primeira e a última aba e chamam aoMudar com o id', async () => {
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();
    render(<Exemplo inicial="mes" aoMudar={aoMudar} />);
    await usuario.tab();
    await usuario.keyboard('{End}');
    expect(aba('Ano')).toHaveFocus();
    expect(aba('Ano')).toHaveAttribute('aria-selected', 'true');
    expect(aoMudar).toHaveBeenLastCalledWith('ano');
    await usuario.keyboard('{Home}');
    expect(aba('Semana')).toHaveFocus();
    expect(aba('Semana')).toHaveAttribute('aria-selected', 'true');
    expect(aoMudar).toHaveBeenLastCalledWith('semana');
  });

  it('o Tab entra na aba ativa e sai direto para o painel, sem passar pelas outras abas', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo inicial="tres-meses" />);
    await usuario.tab();
    expect(aba('3 Meses')).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('tabpanel', { name: '3 Meses' })).toHaveFocus();
  });

  it('outras teclas não mudam a aba', async () => {
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();
    render(<Exemplo aoMudar={aoMudar} />);
    await usuario.tab();
    await usuario.keyboard('{ArrowDown}a');
    expect(aoMudar).not.toHaveBeenCalled();
    expect(aba('Semana')).toHaveFocus();
  });

  it('se o id ativo não existir, a primeira aba continua alcançável pelo teclado', () => {
    render(<Abas itens={itens} ativa="nao-existe" aoMudar={() => {}} rotuloDoGrupo="Período" />);
    expect(aba('Semana')).toHaveAttribute('tabindex', '0');
    expect(aba('Semana')).toHaveAttribute('aria-selected', 'false');
  });

  it('cada aba é um botao com alvo de 44 px; a raiz aceita className e outras props', () => {
    render(
      <Abas itens={itens} ativa="semana" aoMudar={() => {}} rotuloDoGrupo="Período" className="mt-4" data-testid="x" />,
    );
    for (const el of screen.getAllByRole('tab')) {
      expect(el).toHaveClass('min-h-11');
      expect(el).toHaveAttribute('type', 'button');
    }
    expect(screen.getByTestId('x')).toHaveClass('mt-4');
    expect(screen.getByTestId('x')).toHaveAttribute('role', 'tablist');
  });

  it('o painel aceita className e outras props', () => {
    render(
      <PainelDaAba id="mes" ativa="mes" className="p-4" data-testid="painel">
        Conteúdo
      </PainelDaAba>,
    );
    expect(screen.getByTestId('painel')).toHaveClass('p-4');
    expect(screen.getByTestId('painel')).toHaveAttribute('role', 'tabpanel');
  });

  it('a aba ativa não depende só da cor: fica em negrito', () => {
    render(<Exemplo inicial="mes" />);
    expect(aba('Mês')).toHaveClass('font-bold');
    expect(aba('Semana')).not.toHaveClass('font-bold');
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<Exemplo inicial="mes" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
