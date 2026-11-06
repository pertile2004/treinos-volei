import Agenda from '../paginas/Agenda.jsx';
import Biblioteca from '../paginas/Biblioteca.jsx';
import Cadastro from '../paginas/Cadastro.jsx';
import CriarTreino from '../paginas/CriarTreino.jsx';
import DetalheDaSessao from '../paginas/DetalheDaSessao.jsx';
import DetalheDoExercicio from '../paginas/DetalheDoExercicio.jsx';
import DetalheDoTreino from '../paginas/DetalheDoTreino.jsx';
import EditarTreino from '../paginas/EditarTreino.jsx';
import Entrar from '../paginas/Entrar.jsx';
import EsqueciASenha from '../paginas/EsqueciASenha.jsx';
import Evolucao from '../paginas/Evolucao.jsx';
import Historico from '../paginas/Historico.jsx';
import Inicio from '../paginas/Inicio.jsx';
import NaoEncontrada from '../paginas/NaoEncontrada.jsx';
import Perfil from '../paginas/Perfil.jsx';
import Privacidade from '../paginas/Privacidade.jsx';
import RedefinirSenha from '../paginas/RedefinirSenha.jsx';
import RegistroRapido from '../paginas/RegistroRapido.jsx';
import Termos from '../paginas/Termos.jsx';
import Treino from '../paginas/Treino.jsx';
import TreinoAtivo from '../paginas/TreinoAtivo.jsx';
import ExerciciosAdmin from '../paginas/admin/Exercicios.jsx';
import CatalogoDeComponentes from '../paginas/dev/CatalogoDeComponentes.jsx';
import Status from '../paginas/dev/Status.jsx';
import Atleta from '../paginas/treinador/Atleta.jsx';
import Atletas from '../paginas/treinador/Atletas.jsx';
import AppShell from './AppShell.jsx';

// Proteção por login e por papel entra a partir do PR-05: por enquanto todas as rotas abrem sem sessão.
export const rotas = [
  // Públicas, sem o AppShell.
  { path: 'entrar', Component: Entrar },
  { path: 'cadastro', Component: Cadastro },
  { path: 'esqueci-a-senha', Component: EsqueciASenha },
  { path: 'redefinir-senha', Component: RedefinirSenha },
  { path: 'termos', Component: Termos },
  { path: 'privacidade', Component: Privacidade },
  // Dentro do AppShell (navegação principal).
  {
    Component: AppShell,
    children: [
      { index: true, Component: Inicio },
      { path: 'biblioteca', Component: Biblioteca },
      { path: 'exercicios/:exercicioId', Component: DetalheDoExercicio },
      { path: 'treinos/novo', Component: CriarTreino },
      { path: 'treinos/:treinoId', Component: DetalheDoTreino },
      { path: 'treinos/:treinoId/editar', Component: EditarTreino },
      { path: 'treino', Component: Treino },
      { path: 'treinar/:treinoId', Component: TreinoAtivo },
      { path: 'registro-rapido', Component: RegistroRapido },
      { path: 'historico', Component: Historico },
      { path: 'sessoes/:sessaoId', Component: DetalheDaSessao },
      { path: 'evolucao', Component: Evolucao },
      { path: 'agenda', Component: Agenda },
      { path: 'perfil', Component: Perfil },
      { path: 'treinador', Component: Atletas },
      { path: 'treinador/atletas/:atletaId', Component: Atleta },
      { path: 'admin/exercicios', Component: ExerciciosAdmin },
    ],
  },
  // Só no ambiente de desenvolvimento; em produção cai na 404.
  ...(import.meta.env.DEV
    ? [
        { path: 'dev/status', Component: Status },
        { path: 'dev/componentes', Component: CatalogoDeComponentes },
      ]
    : []),
  { path: '*', Component: NaoEncontrada },
];
