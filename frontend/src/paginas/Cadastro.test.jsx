import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http as rede, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { rotas } from '../app/rotas.jsx';
import { servidor } from '../testes/servidor.js';
import { renderizarRotas } from '../testes/renderizar.jsx';

// Corpos idênticos aos exemplos do contrato (rascunho PR-04, seção 2).
const USUARIO_CRIADO = {
  data: {
    id: 1,
    nome: 'Ana Souza',
    email: 'ana@example.com',
    papel: 'jogador',
    meta_semanal: 3,
    data_nascimento: null,
  },
};
const EMAIL_EM_USO = {
  message: 'O e-mail já está em uso.',
  errors: { email: ['O e-mail já está em uso.'] },
  request_id: 'req-422',
};
const MUITAS_TENTATIVAS = { message: 'Muitas tentativas.', request_id: 'req-429' };
const ERRO_INTERNO = { message: 'Erro interno do servidor.', request_id: 'req-500' };

/** Registra o POST do cadastro, guarda os corpos recebidos e responde com `resposta`. */
function prepararCadastro(resposta = () => HttpResponse.json(USUARIO_CRIADO, { status: 201 })) {
  const registro = { corpos: [], chamadas: [] };
  servidor.use(
    rede.get('/sanctum/csrf-cookie', () => {
      registro.chamadas.push('csrf');
      return new HttpResponse(null, { status: 204 });
    }),
    rede.post('/api/v1/auth/cadastro', async ({ request }) => {
      registro.chamadas.push('cadastro');
      registro.corpos.push(await request.json());
      return resposta();
    }),
  );
  return registro;
}

function abrir() {
  return renderizarRotas(rotas, '/cadastro');
}

const campos = {
  nome: () => screen.getByLabelText('Seu nome'),
  email: () => screen.getByLabelText('E-mail'),
  senha: () => screen.getByLabelText('Senha'),
  confirmacao: () => screen.getByLabelText('Confirmar senha'),
  aceite: () => screen.getByRole('checkbox', { name: /aceita os Termos de Uso e a Política de Privacidade/ }),
  enviar: () => screen.getByRole('button', { name: /Criar conta|Criando conta/ }),
};

async function preencher(usuario, { nome = 'Ana Souza', email = 'ana@example.com', senha = 'segredo123' } = {}) {
  await usuario.type(campos.nome(), nome);
  await usuario.type(campos.email(), email);
  await usuario.type(campos.senha(), senha);
  await usuario.type(campos.confirmacao(), senha);
  await usuario.click(campos.aceite());
}

describe('Cadastro', () => {
  it('mostra o titulo, as abas de papel, os campos com rotulo e os links da tela', async () => {
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' })).toBeInTheDocument();
    expect(document.title).toBe('Crie sua conta · VOLLEY PRO');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();

    const abas = screen.getByRole('tablist', { name: 'Tipo de conta' });
    expect(within(abas).getByRole('tab', { name: 'Sou Jogador' })).toHaveAttribute('aria-selected', 'true');
    expect(within(abas).getByRole('tab', { name: 'Sou Treinador' })).toHaveAttribute('aria-selected', 'false');

    expect(campos.nome()).toHaveAttribute('autocomplete', 'name');
    expect(campos.email()).toHaveAttribute('type', 'email');
    expect(campos.email()).toHaveAttribute('autocomplete', 'email');
    expect(campos.senha()).toHaveAttribute('type', 'password');
    expect(campos.senha()).toHaveAttribute('autocomplete', 'new-password');
    expect(campos.senha()).toHaveAccessibleDescription('Mínimo de 8 caracteres');
    expect(campos.confirmacao()).toHaveAttribute('type', 'password');
    expect(campos.confirmacao()).toHaveAttribute('autocomplete', 'new-password');
    expect(campos.aceite()).not.toBeChecked();
    expect(campos.enviar()).toHaveAttribute('type', 'submit');
    expect(campos.enviar()).toHaveClass('min-h-11');

    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('href', '/termos');
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade');
    expect(screen.getByText('Já tem conta?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
    // RN-13: nenhum login social.
    expect(screen.queryByText(/Google|Apple/)).not.toBeInTheDocument();
  });

  it('senha curta e e-mail invalido mostram o erro no proprio campo, sem chamar a API', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro();
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await usuario.type(campos.nome(), 'Ana Souza');
    await usuario.type(campos.email(), 'ana@');
    await usuario.type(campos.senha(), 'abcdefg');
    await usuario.type(campos.confirmacao(), 'abcdefg');
    await usuario.click(campos.aceite());
    await usuario.click(campos.enviar());

    expect(await screen.findByText('Informe um e-mail válido')).toBeVisible();
    expect(campos.email()).toHaveAttribute('aria-invalid', 'true');
    expect(campos.email()).toHaveAccessibleDescription('Informe um e-mail válido');
    expect(campos.email()).toHaveFocus();
    expect(screen.getByText('A senha precisa ter no mínimo 8 caracteres')).toBeVisible();
    expect(campos.senha()).toHaveAttribute('aria-invalid', 'true');
    expect(campos.senha()).toHaveAccessibleDescription(
      'Mínimo de 8 caracteres A senha precisa ter no mínimo 8 caracteres',
    );
    expect(campos.nome()).not.toHaveAttribute('aria-invalid');
    expect(registro.chamadas).toEqual([]);
  });

  it('formulario vazio mostra uma mensagem por campo, inclusive o aceite, e as senhas diferentes', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro();
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await usuario.click(campos.enviar());
    expect(await screen.findByText('Informe seu nome (mínimo de 2 caracteres)')).toBeVisible();
    expect(screen.getByText('Informe um e-mail válido')).toBeVisible();
    expect(screen.getByText('A senha precisa ter no mínimo 8 caracteres')).toBeVisible();
    expect(screen.getByText('Você precisa aceitar os termos')).toBeVisible();
    expect(campos.aceite()).toHaveAttribute('aria-invalid', 'true');
    expect(campos.aceite()).toHaveAccessibleDescription('Você precisa aceitar os termos');
    expect(campos.nome()).toHaveFocus();

    await usuario.type(campos.senha(), 'segredo123');
    await usuario.type(campos.confirmacao(), 'segredo124');
    await usuario.click(campos.enviar());
    expect(await screen.findByText('As senhas não conferem')).toBeVisible();
    expect(campos.confirmacao()).toHaveAttribute('aria-invalid', 'true');
    expect(registro.chamadas).toEqual([]);
  });

  it('envio valido busca o cookie CSRF, manda os seis campos e navega para o inicio', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro();
    const roteador = abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await preencher(usuario);
    await usuario.click(campos.enviar());

    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe('/');
    expect(registro.chamadas).toEqual(['csrf', 'cadastro']);
    expect(registro.corpos).toEqual([
      {
        nome: 'Ana Souza',
        email: 'ana@example.com',
        password: 'segredo123',
        password_confirmation: 'segredo123',
        papel: 'jogador',
        aceite_termos: true,
      },
    ]);
  });

  it('a aba Sou Treinador envia papel treinador', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro();
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await usuario.click(screen.getByRole('tab', { name: 'Sou Treinador' }));
    expect(screen.getByRole('tab', { name: 'Sou Treinador' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Sou Treinador' })).toBeVisible();
    await preencher(usuario);
    await usuario.click(campos.enviar());

    await screen.findByRole('heading', { level: 1, name: 'Início' });
    expect(registro.corpos[0].papel).toBe('treinador');
  });

  it('422 da API aparece no campo E-mail, ligado por aria-describedby, e mantem o que foi digitado', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro(() => HttpResponse.json(EMAIL_EM_USO, { status: 422 }));
    const roteador = abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await preencher(usuario);
    await usuario.click(campos.enviar());

    expect(await screen.findByText('O e-mail já está em uso.')).toBeVisible();
    expect(campos.email()).toHaveAttribute('aria-invalid', 'true');
    expect(campos.email()).toHaveAccessibleDescription('O e-mail já está em uso.');
    expect(campos.email()).toHaveFocus();
    expect(campos.email()).toHaveValue('ana@example.com');
    expect(campos.nome()).toHaveValue('Ana Souza');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe('/cadastro');
    expect(registro.chamadas).toEqual(['csrf', 'cadastro']);
  });

  it('durante o envio o botao fica carregando e desabilitado, sem duplo envio', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro(async () => {
      await delay(150);
      return HttpResponse.json(USUARIO_CRIADO, { status: 201 });
    });
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await preencher(usuario);
    await usuario.click(campos.enviar());

    const botao = await screen.findByRole('button', { name: 'Criando conta…' });
    expect(botao).toHaveAttribute('aria-busy', 'true');
    expect(botao).toHaveAttribute('aria-disabled', 'true');
    await usuario.click(botao);
    await usuario.keyboard('{Enter}');

    await screen.findByRole('heading', { level: 1, name: 'Início' });
    expect(registro.corpos).toHaveLength(1);
  });

  it('429 mostra a mensagem de muitas tentativas com o codigo do erro', async () => {
    const usuario = userEvent.setup();
    prepararCadastro(() => HttpResponse.json(MUITAS_TENTATIVAS, { status: 429 }));
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await preencher(usuario);
    await usuario.click(campos.enviar());

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Muitas tentativas. Tente de novo em instantes.');
    expect(alerta).toHaveTextContent('Código do erro: req-429');
    expect(campos.email()).toHaveValue('ana@example.com');
    expect(screen.getByRole('button', { name: 'Criar conta' })).not.toHaveAttribute('aria-disabled');
  });

  it('500 mostra a MensagemDeErro com o request_id e some ao tentar de novo', async () => {
    const usuario = userEvent.setup();
    let tentativas = 0;
    prepararCadastro(() => {
      tentativas += 1;
      if (tentativas === 1) return HttpResponse.json(ERRO_INTERNO, { status: 500 });
      return HttpResponse.json(USUARIO_CRIADO, { status: 201 });
    });
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await preencher(usuario);
    await usuario.click(campos.enviar());

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Erro interno do servidor.');
    expect(alerta).toHaveTextContent('Código do erro: req-500');

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));
    await screen.findByRole('heading', { level: 1, name: 'Início' });
    expect(tentativas).toBe(2);
  });

  it('colar funciona nos campos de senha e a tela inteira se preenche e envia so com o teclado', async () => {
    const usuario = userEvent.setup();
    const registro = prepararCadastro();
    const roteador = abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });

    await usuario.tab();
    expect(screen.getByRole('tab', { name: 'Sou Jogador' })).toHaveFocus();
    await usuario.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Sou Treinador' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Sou Treinador' })).toHaveAttribute('aria-selected', 'true');

    await usuario.tab();
    expect(screen.getByRole('tabpanel', { name: 'Sou Treinador' })).toHaveFocus();
    await usuario.tab();
    expect(campos.nome()).toHaveFocus();
    await usuario.keyboard('Rafael Souza');
    await usuario.tab();
    expect(campos.email()).toHaveFocus();
    await usuario.keyboard('rafael@example.com');
    await usuario.tab();
    expect(campos.senha()).toHaveFocus();
    await usuario.paste('segredo123');
    expect(campos.senha()).toHaveValue('segredo123');
    await usuario.tab();
    expect(screen.getAllByRole('button', { name: 'Mostrar senha' })[0]).toHaveFocus();
    await usuario.tab();
    expect(campos.confirmacao()).toHaveFocus();
    await usuario.paste('segredo123');
    expect(campos.confirmacao()).toHaveValue('segredo123');
    await usuario.tab();
    expect(screen.getAllByRole('button', { name: 'Mostrar senha' })[1]).toHaveFocus();
    await usuario.tab();
    expect(campos.aceite()).toHaveFocus();
    await usuario.keyboard(' ');
    expect(campos.aceite()).toBeChecked();
    await usuario.tab();
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveFocus();
    await usuario.tab();
    expect(campos.enviar()).toHaveFocus();
    await usuario.keyboard('{Enter}');

    await screen.findByRole('heading', { level: 1, name: 'Início' });
    expect(roteador.state.location.pathname).toBe('/');
    expect(registro.corpos[0]).toMatchObject({ nome: 'Rafael Souza', papel: 'treinador', password: 'segredo123' });
  });

  it('nao tem violacoes de acessibilidade vazio nem com erros', async () => {
    const usuario = userEvent.setup();
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' });
    expect(await axe(document.body)).toHaveNoViolations();

    await usuario.click(campos.enviar());
    await screen.findByText('Informe seu nome (mínimo de 2 caracteres)');
    await waitFor(() => expect(campos.nome()).toHaveFocus());
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
