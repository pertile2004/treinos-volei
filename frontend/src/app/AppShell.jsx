import { NavLink, Outlet } from 'react-router';

// Navegação provisória: o PR-03 troca `itens` e `NavegacaoPrincipal` por NavInferior e BarraLateral
// do design system, sem mexer nas rotas nem no restante do AppShell.
const itens = [
  { para: '/', rotulo: 'Início', exato: true },
  { para: '/biblioteca', rotulo: 'Biblioteca' },
  { para: '/treino', rotulo: 'Treino' },
  { para: '/evolucao', rotulo: 'Evolução' },
];

function NavegacaoPrincipal() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 border-t border-borda bg-superficie lg:static lg:border-t-0 lg:border-r"
    >
      <ul className="flex lg:flex-col lg:p-2">
        {itens.map((item) => (
          <li key={item.para} className="flex-1 lg:flex-none">
            <NavLink
              to={item.para}
              end={item.exato}
              className={({ isActive }) =>
                `flex min-h-11 items-center justify-center px-3 lg:justify-start ${
                  isActive ? 'font-bold text-primaria' : 'text-texto-secundario'
                }`
              }
            >
              {item.rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-fundo text-texto lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#conteudo"
        className="absolute top-2 left-2 z-10 flex min-h-11 -translate-y-16 items-center rounded-botao bg-primaria px-4 font-bold text-sobre-primaria focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <NavegacaoPrincipal />
      <main id="conteudo" tabIndex={-1} className="pb-16 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
