import { useId } from 'react';
import { Link } from 'react-router';
import Carregando from '../../../componentes/Carregando.jsx';
import MensagemDeErro from '../../../componentes/MensagemDeErro.jsx';
import { useAgendamentosDeHoje } from '../hooks.js';
import { EstadoDoAgendamento, HoraDoAgendamento } from './ItemDeAgendamento.jsx';

const LINK = 'inline-flex min-h-11 items-center font-bold text-primaria underline-offset-4 hover:underline';

/** Seção "Agenda do dia" para o Início: os agendamentos de hoje com hora, nome e estado. */
export default function AgendaDoDia() {
  const idTitulo = useId();
  const consulta = useAgendamentosDeHoje();

  let conteudo;
  if (consulta.isPending) {
    conteudo = <Carregando rotulo="Carregando agenda do dia…" />;
  } else if (consulta.isError) {
    conteudo = (
      <MensagemDeErro
        erro={consulta.error}
        mensagem="Não foi possível carregar a agenda do dia."
        aoTentarDeNovo={() => consulta.refetch()}
      />
    );
  } else if (consulta.data.length === 0) {
    conteudo = <p className="text-texto-secundario">Nada agendado para hoje.</p>;
  } else {
    conteudo = (
      <ul className="flex flex-col gap-2">
        {consulta.data.map((agendamento) => (
          <li
            key={agendamento.id}
            className="flex flex-wrap items-center gap-3 rounded-cartao border border-borda bg-superficie p-3"
          >
            <span className="w-20 shrink-0 text-sm text-texto-secundario">
              <HoraDoAgendamento hora={agendamento.hora} />
            </span>
            <span className="min-w-0 flex-1 font-bold">{agendamento.treino.nome}</span>
            <EstadoDoAgendamento concluido={agendamento.concluido} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-3">
      <h2 id={idTitulo} className="text-xl font-bold">
        Agenda do dia
      </h2>
      {conteudo}
      <Link to="/agenda" className={LINK}>
        Abrir agenda
      </Link>
    </section>
  );
}
