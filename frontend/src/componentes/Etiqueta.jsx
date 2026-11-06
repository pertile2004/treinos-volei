// Chaves dos fundamentos e das etapas (docs/ESPECIFICACAO.md); servem só para escolher o estilo.
const VALORES = {
  fundamento: ['recepcao', 'levantamento', 'ataque', 'saque', 'bloqueio', 'defesa', 'preparo_fisico'],
  etapa: ['aquecimento', 'tecnica', 'especifico', 'volta_a_calma'],
};

// Sem paleta por fundamento ou por etapa no DESIGN.md: a diferença fica na borda e no peso, e o texto sempre aparece.
const ESTILOS = {
  fundamento: 'border-primaria bg-superficie-elevada font-bold text-texto',
  etapa: 'border-borda-controle bg-superficie-elevada text-texto',
  neutra: 'border-borda-controle bg-superficie-elevada text-texto-secundario',
};

/** Etiqueta de fundamento, de etapa ou neutra. O rótulo vem pronto em `children`. */
export default function Etiqueta({ tipo = 'neutra', valor, children, className = '', ...resto }) {
  const conhecido = Object.hasOwn(VALORES, tipo) && VALORES[tipo].includes(valor);
  const tipoFinal = conhecido ? tipo : 'neutra';

  return (
    <span
      {...resto}
      data-tipo={tipoFinal}
      data-valor={conhecido ? valor : undefined}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${ESTILOS[tipoFinal]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
