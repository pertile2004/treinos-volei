import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Botao from '../../../componentes/Botao.jsx';
import CampoTexto from '../../../componentes/CampoTexto.jsx';
import MensagemDeErro from '../../../componentes/MensagemDeErro.jsx';
import { aplicarErrosDaApi } from '../../../lib/formularios.js';
import { useTreinos } from '../../treinos/hooks.js';
import { useAtualizarAgendamento, useCriarAgendamento } from '../hooks.js';
import CampoSelecao from './CampoSelecao.jsx';

const DATA_LOCAL = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

function criarEsquema(hoje, comTreino) {
  const campos = {
    data: z
      .string()
      .regex(DATA_LOCAL, { error: 'Informe a data.' })
      .refine((data) => !DATA_LOCAL.test(data) || data >= hoje, { error: 'A data não pode ser anterior a hoje.' }),
    hora: z.union([z.literal(''), z.string().regex(HORA, { error: 'Informe a hora no formato HH:MM.' })]),
  };
  if (comTreino) campos.treino_id = z.string().min(1, { error: 'Escolha um treino.' });
  return z.object(campos);
}

/** Treinos que o usuário pode agendar (RN-06): os dele e os prontos, da primeira página de cada escopo. */
function SeletorDeTreino({ erro, registro }) {
  const meus = useTreinos({ escopo: 'meus' });
  const destaque = useTreinos({ escopo: 'destaque' });
  const carregando = meus.isPending || destaque.isPending;
  const meusTreinos = meus.data?.data ?? [];
  const treinosProntos = destaque.data?.data ?? [];

  if (meus.isError || destaque.isError) {
    return (
      <MensagemDeErro
        erro={meus.error ?? destaque.error}
        mensagem="Não foi possível carregar seus treinos."
        aoTentarDeNovo={() => {
          meus.refetch();
          destaque.refetch();
        }}
      />
    );
  }

  if (!carregando && meusTreinos.length === 0 && treinosProntos.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>Você ainda não tem treinos. Crie um na Biblioteca.</p>
        <Botao para="/biblioteca" variante="secundario">
          Ir para a Biblioteca
        </Botao>
      </div>
    );
  }

  return (
    <CampoSelecao rotulo="Treino" obrigatorio disabled={carregando} erro={erro} {...registro}>
      <option value="">{carregando ? 'Carregando treinos…' : 'Escolha um treino'}</option>
      {meusTreinos.length > 0 && (
        <optgroup label="Meus treinos">
          {meusTreinos.map((treino) => (
            <option key={treino.id} value={String(treino.id)}>
              {treino.nome}
            </option>
          ))}
        </optgroup>
      )}
      {treinosProntos.length > 0 && (
        <optgroup label="Treinos prontos">
          {treinosProntos.map((treino) => (
            <option key={treino.id} value={String(treino.id)}>
              {treino.nome}
            </option>
          ))}
        </optgroup>
      )}
    </CampoSelecao>
  );
}

/**
 * Agenda um treino (sem `agendamento`) ou altera data e hora de um existente.
 * O 422 do servidor vai para o campo; a chave `agendamento` (ex.: já concluído) aparece como aviso geral.
 * `aoSalvar(agendamento, acao)` recebe 'criado' ou 'atualizado'; `aoCancelar` fecha sem salvar.
 */
export default function FormularioDeAgendamento({ hoje, agendamento = null, aoSalvar, aoCancelar }) {
  const editando = agendamento !== null;
  const idTitulo = useId();
  const refTitulo = useRef(null);
  const [erroGeral, setErroGeral] = useState(null);
  const criar = useCriarAgendamento();
  const atualizar = useAtualizarAgendamento();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(criarEsquema(hoje, !editando)),
    defaultValues: { treino_id: '', data: agendamento?.data ?? '', hora: agendamento?.hora ?? '' },
  });

  useEffect(() => {
    refTitulo.current?.focus();
  }, []);

  async function enviar(valores) {
    setErroGeral(null);
    const dados = { data: valores.data, hora: valores.hora === '' ? null : valores.hora };
    try {
      if (editando) {
        aoSalvar(await atualizar.mutateAsync({ id: agendamento.id, ...dados }), 'atualizado');
      } else {
        aoSalvar(await criar.mutateAsync({ treino_id: Number(valores.treino_id), ...dados }), 'criado');
      }
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError)) setErroGeral(erro);
    }
  }

  const salvando = isSubmitting || criar.isPending || atualizar.isPending;

  return (
    <form
      aria-labelledby={idTitulo}
      noValidate
      onSubmit={handleSubmit(enviar)}
      className="flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-4"
    >
      <h2 id={idTitulo} ref={refTitulo} tabIndex={-1} className="text-xl font-bold">
        {editando ? 'Editar agendamento' : 'Agendar treino'}
      </h2>

      {editando ? (
        <p>
          Treino: <strong>{agendamento.treino.nome}</strong>
        </p>
      ) : (
        <SeletorDeTreino erro={errors.treino_id?.message} registro={register('treino_id')} />
      )}

      <CampoTexto rotulo="Data" tipo="date" obrigatorio min={hoje} erro={errors.data?.message} {...register('data')} />
      <CampoTexto
        rotulo="Hora"
        tipo="time"
        ajuda="Opcional. Deixe em branco para agendar sem horário."
        erro={errors.hora?.message}
        {...register('hora')}
      />

      {errors.agendamento && (
        <p role="alert" className="text-sm font-bold text-perigo">
          {errors.agendamento.message}
        </p>
      )}
      {erroGeral && <MensagemDeErro erro={erroGeral} />}

      <div className="flex flex-wrap gap-2">
        <Botao type="submit" carregando={salvando}>
          Salvar
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
