import { keepPreviousData } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import Botao from '../../../componentes/Botao.jsx';
import CampoTexto from '../../../componentes/CampoTexto.jsx';
import Carregando from '../../../componentes/Carregando.jsx';
import ChipFiltro from '../../../componentes/ChipFiltro.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import MensagemDeErro from '../../../componentes/MensagemDeErro.jsx';
import { useExercicios } from '../../exercicios/hooks.js';
import { MAXIMO_DE_ITENS, PADROES } from '../montadorDeTreino.js';

// A busca só vai para a API depois desta pausa sem digitar.
const ESPERA_DA_BUSCA_MS = 300;

function plural(quantidade, singular, pluralizado) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralizado}`;
}

/** "3 séries × 10 repetições · descanso 45 s", com os padrões do exercício (ou os de reserva). */
export function resumoDosPadroes(exercicio) {
  const series = exercicio.series_padrao ?? PADROES.series;
  const descanso = exercicio.descanso_segundos ?? PADROES.descanso_segundos;
  let medida;
  if (exercicio.repeticoes_padrao != null) {
    medida = plural(exercicio.repeticoes_padrao, 'repetição', 'repetições');
  } else if (exercicio.duracao_segundos_padrao != null) {
    medida = `${exercicio.duracao_segundos_padrao} s`;
  } else {
    medida = plural(PADROES.repeticoes, 'repetição', 'repetições');
  }
  return `${plural(series, 'série', 'séries')} × ${medida} · descanso ${descanso} s`;
}

/** Grupo de chips com a opção "Todos"; `valor` vazio significa sem filtro. */
function GrupoDeChips({ legenda, opcoes, valor, aoMudar }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-bold">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        <ChipFiltro selecionado={valor === ''} aoAlternar={() => aoMudar('')}>
          Todos
        </ChipFiltro>
        {opcoes.map((opcao) => (
          <ChipFiltro
            key={opcao.valor}
            selecionado={valor === opcao.valor}
            aoAlternar={(ligado) => aoMudar(ligado ? opcao.valor : '')}
          >
            {opcao.rotulo}
          </ChipFiltro>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Busca na biblioteca para adicionar exercícios a uma etapa: busca, chips de fundamento e nível e paginação.
 * `aoAdicionar(exercicio)` recebe o exercício resumido do GET /exercicios; `aoFechar` fecha o seletor.
 * Os exercícios excluídos não aparecem porque a API já os omite.
 */
export default function SeletorDeExercicios({
  etapaRotulo,
  fundamentos = [],
  niveis = [],
  podeAdicionar = true,
  aoAdicionar,
  aoFechar,
  id,
}) {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [fundamento, setFundamento] = useState('');
  const [nivel, setNivel] = useState('');
  const [pagina, setPagina] = useState(1);
  const refBusca = useRef(null);
  const idGerado = useId();
  const idSeletor = id ?? idGerado;

  useEffect(() => {
    refBusca.current?.focus();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const termo = busca.trim();
      setBuscaAplicada((atual) => {
        if (atual !== termo) setPagina(1);
        return termo;
      });
    }, ESPERA_DA_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [busca]);

  const consulta = useExercicios(
    { busca: buscaAplicada, fundamento, nivel, pagina },
    { placeholderData: keepPreviousData },
  );
  const exercicios = consulta.data?.data ?? [];
  const meta = consulta.data?.meta;

  function mudarFiltro(definir) {
    return (valor) => {
      definir(valor);
      setPagina(1);
    };
  }

  return (
    <section
      id={idSeletor}
      aria-label={`Seletor de exercícios para ${etapaRotulo}`}
      className="mt-3 flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xl font-bold">Adicionar exercício em {etapaRotulo}</h4>
        <Botao variante="fantasma" tamanho="sm" aria-label="Fechar seletor de exercícios" onClick={aoFechar}>
          Fechar
        </Botao>
      </div>

      <CampoTexto
        ref={refBusca}
        rotulo="Buscar exercício"
        nome="busca"
        tipo="search"
        autoComplete="off"
        placeholder="Nome do exercício"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
      />
      <GrupoDeChips legenda="Fundamento" opcoes={fundamentos} valor={fundamento} aoMudar={mudarFiltro(setFundamento)} />
      <GrupoDeChips legenda="Nível" opcoes={niveis} valor={nivel} aoMudar={mudarFiltro(setNivel)} />

      {!podeAdicionar && (
        <p className="text-sm text-texto-secundario">O treino chegou ao máximo de {MAXIMO_DE_ITENS} exercícios.</p>
      )}

      {consulta.isPending && <Carregando rotulo="Carregando exercícios…" />}
      {consulta.isError && (
        <MensagemDeErro
          erro={consulta.error}
          mensagem="Não foi possível carregar os exercícios."
          aoTentarDeNovo={() => consulta.refetch()}
        />
      )}
      {consulta.isSuccess && exercicios.length === 0 && (
        <p className="text-texto-secundario">Nenhum exercício encontrado.</p>
      )}
      {consulta.isSuccess && exercicios.length > 0 && (
        <ul
          aria-label="Exercícios da biblioteca"
          aria-busy={consulta.isPlaceholderData || undefined}
          className="flex flex-col gap-2"
        >
          {exercicios.map((exercicio) => (
            <li
              key={exercicio.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-botao border border-borda bg-superficie-elevada p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="font-bold">{exercicio.nome}</p>
                <p className="flex flex-wrap gap-1">
                  <Etiqueta tipo="fundamento" valor={exercicio.fundamento}>
                    {exercicio.fundamento_rotulo ?? exercicio.fundamento}
                  </Etiqueta>
                  <Etiqueta>{exercicio.nivel_rotulo ?? exercicio.nivel}</Etiqueta>
                </p>
                <p className="text-sm text-texto-secundario">{resumoDosPadroes(exercicio)}</p>
              </div>
              <Botao
                variante="secundario"
                tamanho="sm"
                aria-label={`Adicionar ${exercicio.nome}`}
                disabled={!podeAdicionar}
                onClick={() => aoAdicionar?.(exercicio)}
              >
                Adicionar
              </Botao>
            </li>
          ))}
        </ul>
      )}

      {consulta.isSuccess && meta && meta.last_page > 1 && (
        <nav aria-label="Páginas de exercícios" className="flex items-center justify-between gap-2">
          <Botao
            variante="secundario"
            tamanho="sm"
            disabled={meta.current_page <= 1}
            onClick={() => setPagina(meta.current_page - 1)}
          >
            Página anterior
          </Botao>
          <p className="text-sm text-texto-secundario">
            Página {meta.current_page} de {meta.last_page}
          </p>
          <Botao
            variante="secundario"
            tamanho="sm"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => setPagina(meta.current_page + 1)}
          >
            Próxima página
          </Botao>
        </nav>
      )}
    </section>
  );
}
