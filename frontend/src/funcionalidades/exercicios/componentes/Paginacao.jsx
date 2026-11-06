import Botao from '../../../componentes/Botao.jsx';

/** Anterior / Próxima com "Página X de Y". Com uma página só, não aparece. */
export default function Paginacao({ atual, total, aoMudar }) {
  if (!total || total <= 1) {
    return null;
  }
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-2">
      <Botao variante="secundario" disabled={atual <= 1} onClick={() => aoMudar(atual - 1)}>
        Anterior
      </Botao>
      <p className="text-sm text-texto-secundario">
        Página {atual} de {total}
      </p>
      <Botao variante="secundario" disabled={atual >= total} onClick={() => aoMudar(atual + 1)}>
        Próxima
      </Botao>
    </nav>
  );
}
