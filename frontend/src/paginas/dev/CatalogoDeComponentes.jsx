import Pagina from '../../componentes/Pagina.jsx';
import SecaoApoio from './catalogo/SecaoApoio.jsx';
import SecaoBase from './catalogo/SecaoBase.jsx';
import SecaoNavegacao from './catalogo/SecaoNavegacao.jsx';
import SecaoTreino from './catalogo/SecaoTreino.jsx';

/** Catálogo do design system (só em desenvolvimento): os 14 componentes em todas as variações e estados. */
export default function CatalogoDeComponentes() {
  return (
    <main>
      <Pagina titulo="Catálogo de componentes">
        <SecaoBase />
        <SecaoNavegacao />
        <SecaoTreino />
        <SecaoApoio />
      </Pagina>
    </main>
  );
}
