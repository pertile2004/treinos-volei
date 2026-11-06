import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import {
  registrarCriarTreino,
  registrarExercicios,
  registrarReferencias,
} from '../funcionalidades/treinos/apoioDeTeste.js';
import { renderizarRotas } from '../testes/renderizar.jsx';
import CriarTreino from './CriarTreino.jsx';

function Marcador({ nome }) {
  return <h1>{nome}</h1>;
}

// Na aplicação as páginas ficam dentro do <main> do AppShell (o axe exige um landmark).
const rotas = [
  {
    element: (
      <main>
        <Outlet />
      </main>
    ),
    children: [
      { path: '/treinos/novo', Component: CriarTreino },
      { path: '/treinos/:treinoId', element: <Marcador nome="Detalhe do treino" /> },
      { path: '/biblioteca', element: <Marcador nome="Biblioteca" /> },
    ],
  },
];

async function montarTreinoValido(usuario) {
  await usuario.type(await screen.findByLabelText('Nome do treino'), 'Recepção e saque');
  await usuario.type(screen.getByLabelText('Descrição (opcional)'), 'Foco em passe.');
  await usuario.selectOptions(screen.getByLabelText('Nível'), 'intermediario');
  await usuario.click(screen.getByRole('button', { name: 'Adicionar exercício em Técnica' }));
  await usuario.click(await screen.findByRole('button', { name: 'Adicionar Recepção em manchete' }));
  await usuario.click(screen.getByRole('button', { name: 'Fechar seletor de exercícios' }));
}

describe('CriarTreino', () => {
  it('mostra o titulo da pagina e o formulario', async () => {
    registrarReferencias();
    renderizarRotas(rotas, '/treinos/novo');
    expect(screen.getByRole('heading', { level: 1, name: 'Criar treino' })).toBeInTheDocument();
    expect(document.title).toBe('Criar treino · VOLLEY PRO');
    expect(await screen.findByLabelText('Nome do treino')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a Biblioteca' })).toHaveAttribute('href', '/biblioteca');
  });

  it('ao salvar mostra a confirmacao com o resumo e os caminhos a seguir, e permite criar outro', async () => {
    const usuario = userEvent.setup();
    registrarReferencias();
    registrarExercicios();
    const corpos = registrarCriarTreino();
    renderizarRotas(rotas, '/treinos/novo');
    await montarTreinoValido(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Salvar treino' }));

    const confirmacao = await screen.findByRole('status', { name: 'Treino criado.' });
    expect(confirmacao).toHaveTextContent('Recepção e saque');
    expect(confirmacao).toHaveTextContent('1 exercício');
    expect(confirmacao).toHaveTextContent('cerca de 9 min');
    expect(within(confirmacao).getByRole('heading', { level: 2, name: 'Treino criado.' })).toHaveFocus();
    expect(within(confirmacao).getByRole('link', { name: 'Ver treino' })).toHaveAttribute('href', '/treinos/12');
    expect(within(confirmacao).getByRole('link', { name: 'Voltar para a Biblioteca' })).toHaveAttribute(
      'href',
      '/biblioteca',
    );
    expect(screen.queryByLabelText('Nome do treino')).not.toBeInTheDocument();
    expect(corpos[0]).toMatchObject({ nome: 'Recepção e saque', descricao: 'Foco em passe.', nivel: 'intermediario' });
    expect(await axe(document.body)).toHaveNoViolations();

    await usuario.click(within(confirmacao).getByRole('button', { name: 'Criar outro treino' }));
    expect(await screen.findByLabelText('Nome do treino')).toHaveValue('');
    expect(screen.queryByRole('status', { name: 'Treino criado.' })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('link', { name: 'Voltar para a Biblioteca' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeInTheDocument());
  });

  it('nao tem violacoes de acessibilidade na tela inicial', async () => {
    registrarReferencias();
    renderizarRotas(rotas, '/treinos/novo');
    await screen.findByLabelText('Nome do treino');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
