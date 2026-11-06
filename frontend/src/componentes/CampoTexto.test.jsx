import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import CampoTexto from './CampoTexto.jsx';

describe('CampoTexto', () => {
  it('associa o rótulo visível ao campo', () => {
    render(<CampoTexto rotulo="Seu nome" nome="nome" />);
    const campo = screen.getByLabelText('Seu nome');
    expect(campo.tagName).toBe('INPUT');
    expect(campo).toHaveAttribute('type', 'text');
    expect(campo).toHaveAttribute('name', 'nome');
    expect(screen.getByText('Seu nome').tagName).toBe('LABEL');
  });

  it('dois campos na mesma tela têm ids diferentes; id informado é respeitado', () => {
    render(
      <>
        <CampoTexto rotulo="E-mail" tipo="email" />
        <CampoTexto rotulo="Seu nome" />
        <CampoTexto rotulo="Apelido" id="apelido" />
      </>,
    );
    expect(screen.getByLabelText('E-mail').id).not.toBe(screen.getByLabelText('Seu nome').id);
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Apelido')).toHaveAttribute('id', 'apelido');
  });

  it('sem erro nem ajuda não há aria-invalid nem aria-describedby', () => {
    render(<CampoTexto rotulo="Seu nome" />);
    const campo = screen.getByLabelText('Seu nome');
    expect(campo).not.toHaveAttribute('aria-invalid');
    expect(campo).not.toHaveAttribute('aria-describedby');
  });

  it('a ajuda é a descrição do campo', () => {
    render(<CampoTexto rotulo="Senha" tipo="password" ajuda="Use pelo menos 8 caracteres." />);
    const campo = screen.getByLabelText('Senha');
    expect(campo).toHaveAccessibleDescription('Use pelo menos 8 caracteres.');
    expect(campo).not.toHaveAttribute('aria-invalid');
  });

  it('o erro marca aria-invalid e é lido por aria-describedby, junto com a ajuda', () => {
    render(<CampoTexto rotulo="E-mail" tipo="email" ajuda="Usado para entrar." erro="Informe um e-mail válido." />);
    const campo = screen.getByLabelText('E-mail');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Usado para entrar. Informe um e-mail válido.');
    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible();
  });

  it('o erro não depende só da cor: vem com texto e ícone decorativo', () => {
    const { container } = render(<CampoTexto rotulo="E-mail" erro="Informe um e-mail válido." />);
    const mensagem = screen.getByText('Informe um e-mail válido.').closest('p');
    expect(mensagem.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('input')).toHaveClass('border-perigo');
  });

  it('obrigatorio marca o campo como required sem mudar o nome acessível', () => {
    render(<CampoTexto rotulo="Seu nome" obrigatorio />);
    const campo = screen.getByRole('textbox', { name: 'Seu nome' });
    expect(campo).toBeRequired();
    expect(screen.getByLabelText('Seu nome')).toBe(campo);
    expect(screen.getByText('(obrigatório)')).toHaveAttribute('aria-hidden', 'true');
  });

  it('digitar chama onChange e grava o valor; ref chega ao input', async () => {
    const aoMudar = vi.fn();
    const ref = { current: null };
    render(<CampoTexto rotulo="Seu nome" ref={ref} onChange={aoMudar} />);
    const campo = screen.getByLabelText('Seu nome');
    await userEvent.type(campo, 'Ana');
    expect(campo).toHaveValue('Ana');
    expect(aoMudar).toHaveBeenCalledTimes(3);
    expect(ref.current).toBe(campo);
  });

  it('aceita as props devolvidas pelo register do React Hook Form (name, onChange, onBlur, ref)', async () => {
    const registro = { name: 'email', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() };
    render(<CampoTexto rotulo="E-mail" tipo="email" {...registro} />);
    const campo = screen.getByLabelText('E-mail');
    expect(campo).toHaveAttribute('name', 'email');
    expect(registro.ref).toHaveBeenCalledWith(campo);
    await userEvent.type(campo, 'a');
    await userEvent.tab();
    expect(registro.onChange).toHaveBeenCalled();
    expect(registro.onBlur).toHaveBeenCalled();
  });

  it('className vai para o elemento raiz e as demais props para o input', () => {
    const { container } = render(
      <CampoTexto rotulo="Seu nome" className="mt-4" placeholder="Seu nome" autoComplete="name" maxLength={80} />,
    );
    expect(container.firstChild).toHaveClass('mt-4');
    const campo = screen.getByLabelText('Seu nome');
    expect(campo).toHaveAttribute('placeholder', 'Seu nome');
    expect(campo).toHaveAttribute('autocomplete', 'name');
    expect(campo).toHaveAttribute('maxlength', '80');
    expect(campo).toHaveClass('min-h-11', 'border-borda-controle');
  });

  it('campo que não é de senha não tem botão de mostrar senha', () => {
    render(<CampoTexto rotulo="E-mail" tipo="email" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('desabilitado desabilita o campo e o botão de mostrar senha', () => {
    render(<CampoTexto rotulo="Senha" tipo="password" disabled />);
    expect(screen.getByLabelText('Senha')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeDisabled();
  });

  describe('senha', () => {
    it('começa oculta, com o botão Mostrar senha não pressionado', () => {
      render(<CampoTexto rotulo="Senha" tipo="password" />);
      expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
      const botao = screen.getByRole('button', { name: 'Mostrar senha' });
      expect(botao).toHaveAttribute('aria-pressed', 'false');
      expect(botao).toHaveAttribute('type', 'button');
    });

    it('Mostrar senha troca o type para text e vira Ocultar senha; Ocultar senha volta', async () => {
      const usuario = userEvent.setup();
      render(<CampoTexto rotulo="Senha" tipo="password" />);
      const campo = screen.getByLabelText('Senha');
      await usuario.type(campo, 'segredo123');

      await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));
      expect(campo).toHaveAttribute('type', 'text');
      expect(campo).toHaveValue('segredo123');
      expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByRole('button', { name: 'Mostrar senha' })).not.toBeInTheDocument();

      await usuario.click(screen.getByRole('button', { name: 'Ocultar senha' }));
      expect(campo).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('o botão é alcançado por Tab depois do campo e funciona com Enter e Espaço', async () => {
      const usuario = userEvent.setup();
      render(<CampoTexto rotulo="Senha" tipo="password" />);
      const campo = screen.getByLabelText('Senha');
      await usuario.tab();
      expect(campo).toHaveFocus();
      await usuario.tab();
      expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveFocus();
      await usuario.keyboard('{Enter}');
      expect(campo).toHaveAttribute('type', 'text');
      await usuario.keyboard(' ');
      expect(campo).toHaveAttribute('type', 'password');
    });

    it('o botão não envia o formulário', async () => {
      const aoEnviar = vi.fn((evento) => evento.preventDefault());
      render(
        <form onSubmit={aoEnviar}>
          <CampoTexto rotulo="Senha" tipo="password" />
        </form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
      expect(aoEnviar).not.toHaveBeenCalled();
    });

    it('o alvo do botão tem pelo menos 24 px (44 px)', () => {
      render(<CampoTexto rotulo="Senha" tipo="password" />);
      expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveClass('min-h-11', 'min-w-11');
    });

    it('aceita colar (RN-12), com a senha oculta ou visível', async () => {
      const usuario = userEvent.setup();
      render(<CampoTexto rotulo="Senha" tipo="password" />);
      const campo = screen.getByLabelText('Senha');
      await usuario.click(campo);
      await usuario.paste('colada-123');
      expect(campo).toHaveValue('colada-123');

      await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));
      await usuario.click(campo);
      await usuario.paste('-mais');
      expect(campo).toHaveValue('colada-123-mais');
    });

    it('não desliga o preenchimento automático e repassa o autoComplete', () => {
      const { rerender } = render(<CampoTexto rotulo="Senha" tipo="password" />);
      expect(screen.getByLabelText('Senha')).not.toHaveAttribute('autocomplete');
      rerender(<CampoTexto rotulo="Senha" tipo="password" autoComplete="current-password" />);
      expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  it('não tem violações de acessibilidade nos estados normal, com ajuda, com erro, senha e desabilitado', async () => {
    const { container } = render(
      <main>
        <form aria-label="Exemplo">
          <CampoTexto rotulo="Seu nome" nome="nome" obrigatorio autoComplete="name" />
          <CampoTexto rotulo="E-mail" nome="email" tipo="email" ajuda="Usado para entrar." autoComplete="email" />
          <CampoTexto rotulo="Idade" nome="idade" tipo="number" erro="Informe um número." />
          <CampoTexto rotulo="Busca" nome="busca" tipo="search" disabled />
          <CampoTexto rotulo="Senha" nome="senha" tipo="password" erro="Digite sua senha." />
        </form>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
