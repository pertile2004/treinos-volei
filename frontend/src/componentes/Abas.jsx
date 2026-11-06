const idDaAba = (id) => `aba-${id}`;
const idDoPainel = (id) => `painel-${id}`;

/**
 * Abas no padrão ARIA de tabs, com ativação automática: as setas, Home e End movem o foco e a seleção.
 * Componente controlado: quem usa guarda `ativa` e troca em `aoMudar(id)`.
 * Cada item precisa de um `PainelDaAba` com o mesmo `id` na página.
 */
export default function Abas({ itens, ativa, aoMudar, rotuloDoGrupo, className = '', ...resto }) {
  // Se o id ativo não existir na lista, a primeira aba segura o foco para o grupo não sumir do teclado.
  const tabulavel = itens.some((item) => item.id === ativa) ? ativa : itens[0]?.id;

  function irPara(indice) {
    const item = itens[(indice + itens.length) % itens.length];
    aoMudar(item.id);
    document.getElementById(idDaAba(item.id))?.focus();
  }

  function aoTeclar(evento, indice) {
    const destinos = { ArrowRight: indice + 1, ArrowLeft: indice - 1, Home: 0, End: itens.length - 1 };
    if (!Object.hasOwn(destinos, evento.key)) return;
    evento.preventDefault();
    irPara(destinos[evento.key]);
  }

  return (
    <div
      role="tablist"
      aria-label={rotuloDoGrupo}
      className={`flex gap-1 rounded-botao bg-superficie p-1 ${className}`}
      {...resto}
    >
      {itens.map((item, indice) => {
        const selecionada = item.id === ativa;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={idDaAba(item.id)}
            aria-selected={selecionada}
            aria-controls={idDoPainel(item.id)}
            tabIndex={item.id === tabulavel ? 0 : -1}
            onClick={() => aoMudar(item.id)}
            onKeyDown={(evento) => aoTeclar(evento, indice)}
            className={`min-h-11 flex-1 rounded-botao px-3 text-sm ${
              selecionada
                ? 'bg-primaria font-bold text-sobre-primaria focus-visible:outline-texto'
                : 'text-texto-secundario hover:text-texto'
            }`}
          >
            {item.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Painel de uma aba. O painel inativo fica na página com `hidden` (o `aria-controls` da aba continua
 * válido), mas sem montar o conteúdo.
 */
export function PainelDaAba({ id, ativa, className = '', children, ...resto }) {
  const visivel = id === ativa;
  return (
    <div
      role="tabpanel"
      id={idDoPainel(id)}
      aria-labelledby={idDaAba(id)}
      hidden={!visivel}
      tabIndex={0}
      className={className}
      {...resto}
    >
      {visivel ? children : null}
    </div>
  );
}
