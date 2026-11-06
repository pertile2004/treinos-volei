import Botao from '../../../componentes/Botao.jsx';
import Cartao from '../../../componentes/Cartao.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import { formatarMinutos } from '../../../lib/formatos.js';

/** Hora do agendamento ("18:30") ou "Sem horário", em texto. */
export function HoraDoAgendamento({ hora }) {
  return hora ? <time dateTime={hora}>{hora}</time> : <span>Sem horário</span>;
}

/** Etiqueta de estado em texto (não só cor): Pendente ou Concluído. */
export function EstadoDoAgendamento({ concluido }) {
  return <Etiqueta>{concluido ? 'Concluído' : 'Pendente'}</Etiqueta>;
}

/**
 * Um agendamento na lista da semana. "Iniciar treino" só para pendente de hoje em diante (RN-13: concluir
 * acontece ao salvar a sessão); "Editar" só para pendente; "Remover" sempre.
 */
export default function ItemDeAgendamento({ agendamento, hoje, aoEditar, aoRemover }) {
  const { treino, hora, concluido, data } = agendamento;
  const podeIniciar = !concluido && data >= hoje;
  const duracao = treino.duracao_estimada_minutos;

  return (
    <Cartao como="li" className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{treino.nome}</p>
        <p className="flex flex-wrap gap-x-2 text-sm text-texto-secundario">
          <HoraDoAgendamento hora={hora} />
          {typeof duracao === 'number' && <span>{formatarMinutos(duracao)}</span>}
        </p>
      </div>
      <EstadoDoAgendamento concluido={concluido} />
      <div className="flex flex-wrap gap-2">
        {podeIniciar && (
          <Botao para={`/treinar/${treino.id}`} tamanho="sm">
            Iniciar treino
          </Botao>
        )}
        {!concluido && (
          <Botao variante="secundario" tamanho="sm" onClick={() => aoEditar(agendamento)}>
            Editar
          </Botao>
        )}
        <Botao variante="fantasma" tamanho="sm" onClick={() => aoRemover(agendamento)}>
          Remover
        </Botao>
      </div>
    </Cartao>
  );
}
