import { Outlet } from 'react-router';
import BarraLateral from '../componentes/BarraLateral.jsx';
import NavInferior from '../componentes/NavInferior.jsx';
import LembreteDeHoje from '../funcionalidades/agenda/componentes/LembreteDeHoje.jsx';
import { useLarguraMinima } from '../lib/useLarguraMinima.js';

// Ícones decorativos: a cor vem do texto do item e o nome acessível é sempre o rótulo.
function Icone({ children }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const itens = [
  {
    para: '/',
    rotulo: 'Início',
    exato: true,
    icone: (
      <Icone>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </Icone>
    ),
  },
  {
    para: '/biblioteca',
    rotulo: 'Biblioteca',
    icone: (
      <Icone>
        <path d="M5 4h14v16H5z" />
        <path d="M9 4v16" />
      </Icone>
    ),
  },
  {
    para: '/treino',
    rotulo: 'Treino',
    icone: (
      <Icone>
        <path d="M6 8v8" />
        <path d="M3 10v4" />
        <path d="M18 8v8" />
        <path d="M21 10v4" />
        <path d="M6 12h12" />
      </Icone>
    ),
  },
  {
    para: '/evolucao',
    rotulo: 'Evolução',
    icone: (
      <Icone>
        <path d="M4 4v16h16" />
        <path d="M8 16v-4" />
        <path d="M12 16V8" />
        <path d="M16 16v-6" />
      </Icone>
    ),
  },
];

export default function AppShell() {
  // Só uma navegação fica montada por vez: barra lateral a partir de 1024 px, barra inferior abaixo disso.
  const telaLarga = useLarguraMinima(1024);
  return (
    <div className="min-h-dvh bg-fundo text-texto lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#conteudo"
        className="absolute top-2 left-2 z-10 flex min-h-11 -translate-y-16 items-center rounded-botao bg-primaria px-4 font-bold text-sobre-primaria focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      {telaLarga ? <BarraLateral itens={itens} /> : <NavInferior itens={itens} />}
      <main id="conteudo" tabIndex={-1} className="pb-16 lg:pb-0">
        <LembreteDeHoje />
        <Outlet />
      </main>
    </div>
  );
}
