import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarRotas } from '../testes/renderizar.jsx';
import { rotas } from './rotas.jsx';

const PUBLICAS = [
  ['/entrar', 'Entrar'],
  ['/cadastro', 'Crie sua conta'],
  ['/esqueci-a-senha', 'Esqueci a senha'],
  ['/redefinir-senha', 'Redefinir senha'],
  ['/termos', 'Termos de uso'],
  ['/privacidade', 'Política de privacidade'],
];

const NO_APPSHELL = [
  ['/', 'Início'],
  ['/biblioteca', 'Biblioteca'],
  ['/exercicios/7', 'Detalhe do exercício'],
  ['/treinos/novo', 'Criar treino'],
  ['/treinos/12', 'Detalhe do treino'],
  ['/treinos/12/editar', 'Editar treino'],
  ['/treino', 'Treino'],
  ['/treinar/12', 'Treino ativo'],
  ['/registro-rapido', 'Registro rápido'],
  ['/historico', 'Histórico'],
  ['/sessoes/3', 'Detalhe da sessão'],
  ['/evolucao', 'Evolução'],
  ['/agenda', 'Agenda'],
  ['/perfil', 'Perfil'],
  ['/treinador', 'Meus atletas'],
  ['/treinador/atletas/5', 'Atleta'],
  ['/admin/exercicios', 'Exercícios (admin)'],
];

describe('rotas', () => {
  it.each(PUBLICAS)('%s abre sem o AppShell com o titulo "%s"', async (caminho, titulo) => {
    renderizarRotas(rotas, caminho);
    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
    expect(document.title).toBe(`${titulo} · VOLLEY PRO`);
  });

  it.each(NO_APPSHELL)('%s abre dentro do AppShell com o titulo "%s"', async (caminho, titulo) => {
    renderizarRotas(rotas, caminho);
    const conteudo = await screen.findByRole('main');
    expect(within(conteudo).getByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(document.title).toBe(`${titulo} · VOLLEY PRO`);
  });

  it('a tabela de rotas tem as 23 telas, a de status, o catalogo de componentes e a 404', () => {
    const caminhos = rotas.flatMap((rota) => (rota.children ?? [rota]).map((r) => (r.index ? '/' : r.path)));
    expect(caminhos).toHaveLength(PUBLICAS.length + NO_APPSHELL.length + 3);
    expect(caminhos).toContain('dev/status');
    expect(caminhos).toContain('dev/componentes');
    expect(caminhos.at(-1)).toBe('*');
  });

  it('o clique nos quatro itens da navegacao troca a pagina', async () => {
    const usuario = userEvent.setup();
    const roteador = renderizarRotas(rotas, '/perfil');
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    const passos = [
      ['Biblioteca', '/biblioteca', 'Biblioteca'],
      ['Treino', '/treino', 'Treino'],
      ['Evolução', '/evolucao', 'Evolução'],
      ['Início', '/', 'Início'],
    ];
    for (const [rotulo, caminho, titulo] of passos) {
      await usuario.click(within(nav).getByRole('link', { name: rotulo }));
      expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
      expect(roteador.state.location.pathname).toBe(caminho);
      expect(within(nav).getByRole('link', { name: rotulo })).toHaveAttribute('aria-current', 'page');
    }
  });

  it('caminho desconhecido mostra a 404 e o link volta para o inicio', async () => {
    const usuario = userEvent.setup();
    const roteador = renderizarRotas(rotas, '/nao-existe');
    expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(document.title).toBe('Página não encontrada · VOLLEY PRO');
    const voltar = screen.getByRole('link', { name: 'Voltar para o início' });
    expect(voltar).toHaveAttribute('href', '/');
    await usuario.click(voltar);
    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument();
    expect(roteador.state.location.pathname).toBe('/');
  });

  it('caminho desconhecido abaixo de uma rota conhecida tambem cai na 404', async () => {
    renderizarRotas(rotas, '/treinos/12/nao-existe');
    expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
