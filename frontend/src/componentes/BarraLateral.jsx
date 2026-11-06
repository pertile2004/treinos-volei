import { NavLink } from 'react-router';

/**
 * Navegação principal em coluna, para telas a partir de 1024 px (abaixo disso, NavInferior).
 * `itens`: [{ para, rotulo, icone, exato }]. O NavLink põe `aria-current="page"` no item da rota atual.
 * `rodape` fica no fim da coluna, depois da lista de links.
 */
export default function BarraLateral({ itens, rodape, className = '', ...resto }) {
  return (
    <nav
      aria-label="Navegação principal"
      className={`flex flex-col gap-4 border-r border-borda bg-superficie p-2 ${className}`}
      {...resto}
    >
      <ul className="flex flex-col gap-1">
        {itens.map((item) => (
          <li key={item.para}>
            <NavLink
              to={item.para}
              end={item.exato}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-botao border-l-4 px-3 ${
                  isActive
                    ? 'border-primaria bg-superficie-elevada font-bold text-primaria'
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
      {rodape && <div className="mt-auto">{rodape}</div>}
    </nav>
  );
}
