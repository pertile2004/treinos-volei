import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Stepper from './Stepper.jsx';

function StepperControlado({ inicial, ...props }) {
  const [valor, setValor] = useState(inicial);
  return <Stepper rotulo="Repetições" valor={valor} aoMudar={setValor} {...props} />;
}

const botaoDiminuir = () => screen.getByRole('button', { name: 'Diminuir Repetições' });
const botaoAumentar = () => screen.getByRole('button', { name: 'Aumentar Repetições' });

describe('Stepper', () => {
  it('e um grupo com o rotulo, dois botoes com nome acessivel e o valor em uma regiao educada', () => {
    render(<Stepper rotulo="Repetições" valor={10} aoMudar={() => {}} />);
    expect(screen.getByRole('group', { name: 'Repetições' })).toBeInTheDocument();
    expect(botaoDiminuir()).toHaveAttribute('type', 'button');
    expect(botaoAumentar()).toHaveAttribute('type', 'button');
    const valor = screen.getByRole('status');
    expect(valor).toHaveTextContent('10');
    expect(valor).toHaveAttribute('aria-live', 'polite');
    expect(valor.tagName).toBe('OUTPUT');
  });

  it('aumentar e diminuir chamam aoMudar com o valor mais ou menos o passo padrao (1)', async () => {
    const aoMudar = vi.fn();
    render(<Stepper rotulo="Repetições" valor={10} aoMudar={aoMudar} />);
    await userEvent.click(botaoAumentar());
    expect(aoMudar).toHaveBeenLastCalledWith(11);
    await userEvent.click(botaoDiminuir());
    expect(aoMudar).toHaveBeenLastCalledWith(9);
    expect(aoMudar).toHaveBeenCalledTimes(2);
  });

  it('usa o passo informado', async () => {
    const aoMudar = vi.fn();
    render(<Stepper rotulo="Repetições" valor={10} passo={5} aoMudar={aoMudar} />);
    await userEvent.click(botaoAumentar());
    expect(aoMudar).toHaveBeenLastCalledWith(15);
    await userEvent.click(botaoDiminuir());
    expect(aoMudar).toHaveBeenLastCalledWith(5);
  });

  it('no minimo (padrao 0) o botao de diminuir fica desabilitado', async () => {
    const aoMudar = vi.fn();
    render(<Stepper rotulo="Repetições" valor={0} aoMudar={aoMudar} />);
    expect(botaoDiminuir()).toBeDisabled();
    expect(botaoAumentar()).toBeEnabled();
    await userEvent.click(botaoDiminuir());
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it('no maximo o botao de aumentar fica desabilitado', async () => {
    const aoMudar = vi.fn();
    render(<Stepper rotulo="Repetições" valor={20} min={1} max={20} aoMudar={aoMudar} />);
    expect(botaoAumentar()).toBeDisabled();
    expect(botaoDiminuir()).toBeEnabled();
    await userEvent.click(botaoAumentar());
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it('sem max o botao de aumentar nunca desabilita', () => {
    render(<Stepper rotulo="Repetições" valor={9999} aoMudar={() => {}} />);
    expect(botaoAumentar()).toBeEnabled();
  });

  it('nunca passa do minimo nem do maximo quando o passo ultrapassa o limite', async () => {
    const aoMudar = vi.fn();
    const { rerender } = render(<Stepper rotulo="Repetições" valor={9} passo={2} max={10} aoMudar={aoMudar} />);
    await userEvent.click(botaoAumentar());
    expect(aoMudar).toHaveBeenLastCalledWith(10);
    rerender(<Stepper rotulo="Repetições" valor={3} passo={2} min={2} max={10} aoMudar={aoMudar} />);
    await userEvent.click(botaoDiminuir());
    expect(aoMudar).toHaveBeenLastCalledWith(2);
  });

  it('passo decimal nao acumula erro de ponto flutuante e o valor aparece em pt-BR', async () => {
    const aoMudar = vi.fn();
    render(<Stepper rotulo="Carga" valor={0.2} passo={0.1} aoMudar={aoMudar} />);
    expect(screen.getByRole('status')).toHaveTextContent('0,2');
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar Carga' }));
    expect(aoMudar).toHaveBeenLastCalledWith(0.3);
  });

  it('desabilitado: os dois botoes ficam desabilitados e aoMudar nao e chamado', async () => {
    const aoMudar = vi.fn();
    render(<Stepper rotulo="Repetições" valor={5} max={10} disabled aoMudar={aoMudar} />);
    expect(botaoDiminuir()).toBeDisabled();
    expect(botaoAumentar()).toBeDisabled();
    await userEvent.click(botaoAumentar());
    await userEvent.click(botaoDiminuir());
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it('funciona so com o teclado: Tab chega aos botoes, Enter e Espaco acionam, e o valor mostrado acompanha', async () => {
    const usuario = userEvent.setup();
    render(<StepperControlado inicial={1} max={3} />);
    await usuario.tab();
    expect(botaoDiminuir()).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('0');
    await usuario.tab();
    expect(botaoAumentar()).toHaveFocus();
    await usuario.keyboard(' ');
    await usuario.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('2');
  });

  it('os botoes tem alvo minimo de 44 px (classes min-h-11 e min-w-11)', () => {
    render(<Stepper rotulo="Repetições" valor={5} aoMudar={() => {}} />);
    for (const botao of [botaoDiminuir(), botaoAumentar()]) {
      expect(botao).toHaveClass('min-h-11', 'min-w-11');
    }
  });

  it('o contorno dos botoes usa o token borda-controle (3:1 sobre os fundos)', () => {
    render(<Stepper rotulo="Repetições" valor={5} aoMudar={() => {}} />);
    for (const botao of [botaoDiminuir(), botaoAumentar()]) {
      expect(botao).toHaveClass('border-borda-controle');
    }
  });

  it('aceita className e repassa as demais props ao elemento raiz', () => {
    render(<Stepper rotulo="Repetições" valor={5} aoMudar={() => {}} className="mt-4" data-testid="raiz" />);
    const raiz = screen.getByTestId('raiz');
    expect(raiz).toHaveClass('mt-4');
    expect(raiz).toHaveAttribute('role', 'group');
  });

  it.each([
    ['normal', { valor: 5, max: 10 }],
    ['no minimo', { valor: 0, max: 10 }],
    ['no maximo', { valor: 10, max: 10 }],
    ['desabilitado', { valor: 5, max: 10, disabled: true }],
  ])('nao tem violacoes de acessibilidade (%s)', async (_nome, props) => {
    const { container } = render(<Stepper rotulo="Repetições" aoMudar={() => {}} {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
