import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Botao from './Botao.jsx';

const VARIANTES = ['primario', 'secundario', 'fantasma', 'perigo'];

describe('Botao', () => {
  it('é um button nativo do tipo button, com o texto como nome acessível', () => {
    render(<Botao>Salvar treino</Botao>);
    const botao = screen.getByRole('button', { name: 'Salvar treino' });
    expect(botao.tagName).toBe('BUTTON');
    expect(botao).toHaveAttribute('type', 'button');
  });

  it('o clique chama onClick', async () => {
    const aoClicar = vi.fn();
    render(<Botao onClick={aoClicar}>Entrar</Botao>);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it('Enter e Espaço acionam o botão pelo teclado', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(<Botao onClick={aoClicar}>Entrar</Botao>);
    await usuario.tab();
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveFocus();
    await usuario.keyboard('{Enter}');
    await usuario.keyboard(' ');
    expect(aoClicar).toHaveBeenCalledTimes(2);
  });

  it('desabilitado não chama onClick e sai da ordem de tabulação', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(
      <Botao disabled onClick={aoClicar}>
        Entrar
      </Botao>,
    );
    const botao = screen.getByRole('button', { name: 'Entrar' });
    expect(botao).toBeDisabled();
    await usuario.click(botao);
    await usuario.tab();
    expect(botao).not.toHaveFocus();
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it('carregando mantém o texto e o foco, marca aria-busy e aria-disabled e ignora clique e teclado', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(
      <Botao carregando onClick={aoClicar}>
        Entrar
      </Botao>,
    );
    const botao = screen.getByRole('button', { name: 'Entrar' });
    expect(botao).toHaveAttribute('aria-busy', 'true');
    expect(botao).toHaveAttribute('aria-disabled', 'true');
    expect(botao).not.toHaveAttribute('disabled');
    await usuario.click(botao);
    expect(botao).toHaveFocus();
    await usuario.keyboard('{Enter}');
    await usuario.keyboard(' ');
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it('sem carregando não há aria-busy nem aria-disabled', () => {
    render(<Botao>Entrar</Botao>);
    const botao = screen.getByRole('button', { name: 'Entrar' });
    expect(botao).not.toHaveAttribute('aria-busy');
    expect(botao).not.toHaveAttribute('aria-disabled');
  });

  it('type submit envia o formulário; carregando não envia', async () => {
    const aoEnviar = vi.fn((evento) => evento.preventDefault());
    const { rerender } = render(
      <form onSubmit={aoEnviar}>
        <Botao type="submit">Criar conta</Botao>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(aoEnviar).toHaveBeenCalledTimes(1);

    rerender(
      <form onSubmit={aoEnviar}>
        <Botao type="submit" carregando>
          Criar conta
        </Botao>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(aoEnviar).toHaveBeenCalledTimes(1);
  });

  it('tamanho md (padrão) tem altura mínima de 44 px e sm de 32 px', () => {
    render(
      <>
        <Botao>Padrão</Botao>
        <Botao tamanho="sm">Pequeno</Botao>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Padrão' })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: 'Pequeno' })).toHaveClass('min-h-8');
    expect(screen.getByRole('button', { name: 'Pequeno' })).not.toHaveClass('min-h-11');
  });

  it('cada variação usa as cores dos tokens; a padrão é a primária', () => {
    render(
      <>
        <Botao>Padrão</Botao>
        <Botao variante="secundario">Secundário</Botao>
        <Botao variante="fantasma">Fantasma</Botao>
        <Botao variante="perigo">Excluir</Botao>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Padrão' })).toHaveClass('bg-primaria', 'text-sobre-primaria');
    expect(screen.getByRole('button', { name: 'Secundário' })).toHaveClass(
      'bg-superficie-elevada',
      'text-texto',
      'border-borda-controle',
    );
    expect(screen.getByRole('button', { name: 'Fantasma' })).toHaveClass('bg-transparent', 'text-primaria');
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveClass('bg-perigo', 'text-sobre-primaria');
  });

  it('variação desconhecida cai na primária', () => {
    render(<Botao variante="inexistente">Entrar</Botao>);
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveClass('bg-primaria');
  });

  it('larguraTotal ocupa a linha inteira', () => {
    render(<Botao larguraTotal>Entrar</Botao>);
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveClass('w-full');
  });

  it('o ícone é decorativo e não entra no nome; ícone sozinho usa aria-label', () => {
    const icone = (
      <svg data-testid="icone" viewBox="0 0 24 24">
        <title>mais</title>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
    render(
      <>
        <Botao icone={icone}>Novo treino</Botao>
        <Botao icone={icone} aria-label="Adicionar exercício" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Novo treino' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar exercício' })).toBeInTheDocument();
    expect(screen.getAllByTestId('icone')[0].parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('repassa className, ref e as demais props ao elemento raiz', () => {
    const ref = { current: null };
    render(
      <Botao ref={ref} className="mt-4" data-testid="raiz" aria-describedby="dica">
        Entrar
      </Botao>,
    );
    const botao = screen.getByTestId('raiz');
    expect(botao).toHaveClass('mt-4', 'rounded-botao');
    expect(botao).toHaveAttribute('aria-describedby', 'dica');
    expect(ref.current).toBe(botao);
  });

  it('com para vira um link do roteador, com as mesmas classes', () => {
    render(
      <MemoryRouter>
        <Botao para="/cadastro">Cadastre-se</Botao>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Cadastre-se' });
    expect(link).toHaveAttribute('href', '/cadastro');
    expect(link).not.toHaveAttribute('type');
    expect(link).toHaveClass('min-h-11', 'bg-primaria');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('link desabilitado não navega e avisa com aria-disabled', async () => {
    const aoClicar = vi.fn();
    render(
      <MemoryRouter>
        <Botao para="/cadastro" disabled onClick={aoClicar}>
          Cadastre-se
        </Botao>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Cadastre-se' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(link);
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it.each(VARIANTES)('variação %s não tem violações de acessibilidade', async (variante) => {
    const { container } = render(
      <main>
        <Botao variante={variante}>Salvar</Botao>
        <Botao variante={variante} tamanho="sm">
          Salvar pequeno
        </Botao>
        <Botao variante={variante} disabled>
          Salvar desabilitado
        </Botao>
        <Botao variante={variante} carregando>
          Salvando
        </Botao>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('link e ícone sozinho não têm violações de acessibilidade', async () => {
    const { container } = render(
      <MemoryRouter>
        <main>
          <Botao para="/cadastro">Cadastre-se</Botao>
          <Botao
            aria-label="Adicionar exercício"
            icone={
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          />
        </main>
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
