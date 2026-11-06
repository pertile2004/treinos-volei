import { useEffect, useId, useState } from 'react';
import CampoTexto from '../../../componentes/CampoTexto.jsx';
import ChipFiltro from '../../../componentes/ChipFiltro.jsx';

const ESPERA_DA_BUSCA_MS = 300;

/** Chips "Todos" + uma opção por valor. Um valor por vez; clicar no chip selecionado volta para "Todos". */
function GrupoDeChips({ rotulo, opcoes, valor, aoEscolher }) {
  const idDoRotulo = useId();
  return (
    <div role="group" aria-labelledby={idDoRotulo} className="flex flex-col gap-2">
      <p id={idDoRotulo} className="text-sm font-bold">
        {rotulo}
      </p>
      <div className="flex flex-wrap gap-2">
        <ChipFiltro selecionado={!valor} aoAlternar={(novo) => novo && aoEscolher('')}>
          Todos
        </ChipFiltro>
        {opcoes.map((opcao) => (
          <ChipFiltro
            key={opcao.valor}
            selecionado={valor === opcao.valor}
            aoAlternar={(novo) => aoEscolher(novo ? opcao.valor : '')}
          >
            {opcao.rotulo}
          </ChipFiltro>
        ))}
      </div>
    </div>
  );
}

/**
 * Busca e chips de fundamento e nível. `filtros` é { fundamento, nivel, busca } e `aoMudar` recebe só o que
 * mudou. A busca só é enviada quando o usuário para de digitar. Sem `fundamentos` ou `niveis` (ainda
 * carregando), o grupo correspondente não aparece.
 */
export default function FiltrosExercicios({ fundamentos, niveis, filtros, aoMudar }) {
  const buscaAtual = filtros.busca ?? '';
  const [texto, setTexto] = useState(buscaAtual);
  const [buscaAnterior, setBuscaAnterior] = useState(buscaAtual);

  // A busca mudou por fora (ex.: "Limpar filtros"): o campo acompanha.
  if (buscaAtual !== buscaAnterior) {
    setBuscaAnterior(buscaAtual);
    setTexto(buscaAtual);
  }

  useEffect(() => {
    if (texto.trim() === buscaAtual.trim()) {
      return undefined;
    }
    const temporizador = setTimeout(() => aoMudar({ busca: texto.trim() }), ESPERA_DA_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [texto, buscaAtual, aoMudar]);

  return (
    <div className="flex flex-col gap-4">
      <CampoTexto
        rotulo="Buscar exercício"
        nome="busca"
        tipo="search"
        autoComplete="off"
        placeholder="Nome do exercício"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
      />
      {fundamentos && (
        <GrupoDeChips
          rotulo="Fundamento"
          opcoes={fundamentos}
          valor={filtros.fundamento ?? ''}
          aoEscolher={(fundamento) => aoMudar({ fundamento })}
        />
      )}
      {niveis && (
        <GrupoDeChips
          rotulo="Nível"
          opcoes={niveis}
          valor={filtros.nivel ?? ''}
          aoEscolher={(nivel) => aoMudar({ nivel })}
        />
      )}
    </div>
  );
}
