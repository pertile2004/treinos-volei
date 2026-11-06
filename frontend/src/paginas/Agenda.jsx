import { useRef, useState } from 'react';
import Botao from '../componentes/Botao.jsx';
import Carregando from '../componentes/Carregando.jsx';
import EstadoVazio from '../componentes/EstadoVazio.jsx';
import MensagemDeErro from '../componentes/MensagemDeErro.jsx';
import ModalDeConfirmacao from '../componentes/ModalDeConfirmacao.jsx';
import Pagina from '../componentes/Pagina.jsx';
import FormularioDeAgendamento from '../funcionalidades/agenda/componentes/FormularioDeAgendamento.jsx';
import ItemDeAgendamento from '../funcionalidades/agenda/componentes/ItemDeAgendamento.jsx';
import { useAgendamentos, useRemoverAgendamento } from '../funcionalidades/agenda/hooks.js';
import { agruparPorDia, intervaloDaSemana, rotuloDaSemana } from '../funcionalidades/agenda/semana.js';
import { somarDias } from '../lib/datas.js';
import { useHoje } from '../lib/useHoje.js';

const AVISOS = { criado: 'Treino agendado.', atualizado: 'Agendamento atualizado.', removido: 'Agendamento removido.' };

function mensagemDoErro(erro) {
  const status = erro?.response?.status;
  if (status === 401) return 'Entre na sua conta para ver a agenda.';
  if (status === 403) return 'Você não tem permissão para ver esta agenda.';
  return 'Não foi possível carregar a agenda.';
}

function descreverAgendamento(agendamento, dias) {
  const dia = dias.find((d) => d.data === agendamento.data);
  const quando = dia ? `${dia.nome.toLocaleLowerCase('pt-BR')}, ${dia.curta}` : agendamento.data;
  const hora = agendamento.hora ? ` às ${agendamento.hora}` : '';
  return `${agendamento.treino.nome}, ${quando}${hora}. A sessão já registrada, se houver, continua no histórico.`;
}

export default function Agenda() {
  const hoje = useHoje();
  const [inicio, setInicio] = useState(() => intervaloDaSemana(hoje).de);
  const [formulario, setFormulario] = useState(null); // null | { agendamento: null | {...} }
  const [remocao, setRemocao] = useState(null);
  const [aviso, setAviso] = useState('');
  const [erroDaRemocao, setErroDaRemocao] = useState(null);
  const acionador = useRef(null);

  const fim = somarDias(inicio, 6);
  const consulta = useAgendamentos({ de: inicio, ate: fim });
  const remover = useRemoverAgendamento();
  const dias = agruparPorDia(consulta.data ?? [], inicio);
  const vazio = consulta.isSuccess && consulta.data.length === 0;

  function abrirFormulario(agendamento = null) {
    acionador.current = document.activeElement;
    setAviso('');
    setFormulario({ agendamento });
  }

  function fecharFormulario() {
    setFormulario(null);
    const alvo = acionador.current;
    if (alvo instanceof HTMLElement && alvo.isConnected) alvo.focus();
  }

  function aoSalvar(agendamento, acao) {
    fecharFormulario();
    setAviso(AVISOS[acao]);
  }

  async function confirmarRemocao() {
    setErroDaRemocao(null);
    try {
      await remover.mutateAsync(remocao.id);
      setAviso(AVISOS.removido);
    } catch (erro) {
      setErroDaRemocao(erro);
    } finally {
      setRemocao(null);
    }
  }

  return (
    <Pagina titulo="Agenda">
      <div className="mt-4 flex flex-col gap-4">
        <nav aria-label="Semanas" className="flex flex-wrap items-center gap-2">
          <Botao variante="secundario" onClick={() => setInicio((atual) => somarDias(atual, -7))}>
            Semana anterior
          </Botao>
          <Botao variante="secundario" onClick={() => setInicio(intervaloDaSemana(hoje).de)}>
            Hoje
          </Botao>
          <Botao variante="secundario" onClick={() => setInicio((atual) => somarDias(atual, 7))}>
            Próxima semana
          </Botao>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-bold">{rotuloDaSemana(inicio, fim)}</p>
          <Botao onClick={() => abrirFormulario()}>Agendar treino</Botao>
        </div>

        <p aria-live="polite" aria-atomic="true" className="min-h-6 text-sm font-bold text-primaria">
          {aviso}
        </p>

        {formulario && (
          <FormularioDeAgendamento
            key={formulario.agendamento?.id ?? 'novo'}
            hoje={hoje}
            agendamento={formulario.agendamento}
            aoSalvar={aoSalvar}
            aoCancelar={fecharFormulario}
          />
        )}

        {erroDaRemocao && <MensagemDeErro erro={erroDaRemocao} mensagem="Não foi possível remover o agendamento." />}

        <div aria-busy={consulta.isPending || undefined} className="flex flex-col gap-6">
          {consulta.isPending && <Carregando rotulo="Carregando agenda…" />}
          {consulta.isError && (
            <MensagemDeErro
              erro={consulta.error}
              mensagem={mensagemDoErro(consulta.error)}
              aoTentarDeNovo={() => consulta.refetch()}
            />
          )}
          {vazio && (
            <EstadoVazio
              titulo="Nenhum treino agendado nesta semana."
              descricao="Use o botão Agendar treino para escolher um treino, o dia e a hora."
            />
          )}
          {consulta.isSuccess &&
            !vazio &&
            dias.map((dia) => (
              <section
                key={dia.data}
                aria-labelledby={`dia-${dia.data}`}
                aria-current={dia.data === hoje ? 'date' : undefined}
                className={`flex flex-col gap-2 border-l-4 pl-3 ${dia.data === hoje ? 'border-primaria' : 'border-borda'}`}
              >
                <h2 id={`dia-${dia.data}`} className="flex items-baseline gap-2 text-base font-bold">
                  {dia.nome}{' '}
                  <time dateTime={dia.data} className="text-sm font-normal text-texto-secundario">
                    {dia.curta}
                  </time>
                  {dia.data === hoje && <span className="text-sm font-normal text-primaria">(hoje)</span>}
                </h2>
                {dia.itens.length === 0 ? (
                  <p className="text-sm text-texto-secundario">Nada agendado.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dia.itens.map((agendamento) => (
                      <ItemDeAgendamento
                        key={agendamento.id}
                        agendamento={agendamento}
                        hoje={hoje}
                        aoEditar={abrirFormulario}
                        aoRemover={(alvo) => {
                          setAviso('');
                          setRemocao(alvo);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))}
        </div>
      </div>

      <ModalDeConfirmacao
        aberto={remocao !== null}
        titulo="Remover este agendamento?"
        descricao={remocao ? descreverAgendamento(remocao, dias) : undefined}
        rotuloConfirmar="Remover"
        perigo
        carregando={remover.isPending}
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setRemocao(null)}
      />
    </Pagina>
  );
}
