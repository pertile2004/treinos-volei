import { NavLink } from 'react-router';

/**
 * Navegação principal em barra fixa embaixo, para telas com menos de 1024 px (a partir daí, BarraLateral).
 * `itens`: [{ para, rotulo, icone, exato }]. O NavLink põe `aria-current="page"` no item da rota atual.
 * Fora do topo do aplicativo (catálogo), passe `className="static"` e outro `aria-label`.
 */
export default function NavInferior({ itens, className = '', ...resto }) {
  return (
    <nav
      aria-label="Navegação principal"
      className={`fixed inset-x-0 bottom-0 z-10 border-t border-borda bg-superficie ${className}`}
      {...resto}
    >
      <ul className="flex">
        {itens.map((item) => (
          <li key={item.para} className="min-w-0 flex-1">
            <NavLink
              to={item.para}
              end={item.exato}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center gap-1 border-t-2 px-1 py-1 text-xs focus-visible:-outline-offset-2 ${
                  isActive
                    ? 'border-primaria font-bold text-primaria'
                    : 'border-superficie text-texto-secundario hover:text-texto'
                }`
              }
            >
              {item.icone && <span aria-hidden="true">{item.icone}</span>}
              <span>{item.rotulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
