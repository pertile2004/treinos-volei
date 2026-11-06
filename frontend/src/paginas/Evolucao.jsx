import { useState } from 'react';
import Abas, { PainelDaAba } from '../componentes/Abas.jsx';
import Botao from '../componentes/Botao.jsx';
import Carregando from '../componentes/Carregando.jsx';
import EstadoVazio from '../componentes/EstadoVazio.jsx';
import MensagemDeErro from '../componentes/MensagemDeErro.jsx';
import Pagina from '../componentes/Pagina.jsx';
import { PERIODOS, ehPeriodoVazio } from '../funcionalidades/estatisticas/api.js';
import BarrasDesempenho from '../funcionalidades/estatisticas/componentes/BarrasDesempenho.jsx';
import CartaoFrequencia from '../funcionalidades/estatisticas/componentes/CartaoFrequencia.jsx';
import GraficoVolume from '../funcionalidades/estatisticas/componentes/GraficoVolume.jsx';
import TabelaEstatisticas from '../funcionalidades/estatisticas/componentes/TabelaEstatisticas.jsx';
import { useEstatisticas } from '../funcionalidades/estatisticas/hooks.js';
import { useRotulosDosFundamentos } from '../funcionalidades/referencias/hooks.js';

// "2026-11-02" → "02/11/2026".
function dataCurta(dataLocal) {
  const [ano, mes, dia] = dataLocal.split('-');
  return `${dia}/${mes}/${ano}`;
}

function SemSessao() {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-cartao border border-perigo bg-superficie p-4">
      <p>Você precisa entrar para ver sua evolução.</p>
      <Botao para="/entrar" variante="secundario">
        Entrar
      </Botao>
    </div>
  );
}

function ConteudoDoPeriodo({ consulta, rotulos, comoTabela, aoAlternar }) {
  if (consulta.isPending) return <Carregando rotulo="Carregando sua evolução…" />;

  if (consulta.isError) {
    if (consulta.error?.response?.status === 401) return <SemSessao />;
    return (
      <MensagemDeErro
        erro={consulta.error}
        mensagem="Não foi possível carregar sua evolução. Tente novamente."
        aoTentarDeNovo={() => consulta.refetch()}
      />
    );
  }

  const estatisticas = consulta.data;
  if (ehPeriodoVazio(estatisticas)) {
    return (
      <EstadoVazio titulo="Você ainda não tem treinos neste período.">
        <Botao para="/treino" className="mt-2">
          Registrar um treino
        </Botao>
      </EstadoVazio>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-texto-secundario">
          Período de <time dateTime={estatisticas.inicio}>{dataCurta(estatisticas.inicio)}</time> a{' '}
          <time dateTime={estatisticas.fim}>{dataCurta(estatisticas.fim)}</time>
        </p>
        <Botao variante="secundario" aria-pressed={comoTabela} onClick={aoAlternar}>
          {comoTabela ? 'Ver gráficos' : 'Ver como tabela'}
        </Botao>
      </div>
      {comoTabela ? (
        <TabelaEstatisticas estatisticas={estatisticas} rotulos={rotulos} />
      ) : (
        <>
          <GraficoVolume volume={estatisticas.volume} />
          <BarrasDesempenho desempenho={estatisticas.desempenho} rotulos={rotulos} />
        </>
      )}
      <CartaoFrequencia frequencia={estatisticas.frequencia} />
    </div>
  );
}

export default function Evolucao() {
  const [periodo, setPeriodo] = useState(PERIODOS[0].id);
  const [comoTabela, setComoTabela] = useState(false);
  const consulta = useEstatisticas(periodo);
  const rotulos = useRotulosDosFundamentos();

  return (
    <Pagina titulo="Evolução">
      <Abas className="mt-4" itens={PERIODOS} ativa={periodo} aoMudar={setPeriodo} rotuloDoGrupo="Período" />
      {PERIODOS.map((item) => (
        <PainelDaAba key={item.id} id={item.id} ativa={periodo} className="mt-4 rounded-cartao">
          <ConteudoDoPeriodo
            consulta={consulta}
            rotulos={rotulos}
            comoTabela={comoTabela}
            aoAlternar={() => setComoTabela((atual) => !atual)}
          />
        </PainelDaAba>
      ))}
    </Pagina>
  );
}
