import { useState } from 'react';
import Botao from '../../../componentes/Botao.jsx';
import ModalDeConfirmacao from '../../../componentes/ModalDeConfirmacao.jsx';
import { useRegistrarSessao } from '../../sessoes/hooks.js';
import { useTreinoAtivo } from '../hooks.js';
import { ACOES, FASES } from '../maquinaDoTreino.js';
import AnuncioDaFase from './AnuncioDaFase.jsx';
import Descanso from './Descanso.jsx';
import ExercicioAtivo from './ExercicioAtivo.jsx';
import Preparacao from './Preparacao.jsx';
import ProximoExercicio from './ProximoExercicio.jsx';
import Resumo from './Resumo.jsx';

/**
 * Execução do treino a partir de um estado inicial (novo ou restaurado). Percorre as fases, grava o andamento
 * no storage, salva a sessão ao finalizar (`aoSalvar(sessao)`) e abandona com confirmação (`aoSair()`).
 */
export default function ExecucaoDoTreino({ estadoInicial, usuarioId, storage, aoSalvar, aoSair, voltarPara }) {
  const treino = useTreinoAtivo({ estadoInicial, usuarioId, storage });
  const registrar = useRegistrarSessao();
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const { estado, despachar } = treino;

  function finalizar() {
    const corpo = treino.finalizar();
    registrar.mutate(corpo, {
      onSuccess: (sessao) => {
        treino.limpar();
        aoSalvar(sessao);
      },
    });
  }

  function sair() {
    treino.limpar();
    setConfirmandoSaida(false);
    aoSair();
  }

  // A chave remonta a fase a cada transição, para o título receber o foco também entre séries iguais.
  const chaveDaFase = `${estado.fase}-${estado.indice_exercicio}-${estado.serie_atual}`;
  let fase;
  if (estado.fase === FASES.PREPARACAO) {
    fase = (
      <Preparacao
        key={chaveDaFase}
        estado={estado}
        aoIniciar={treino.iniciar}
        aoAlternarVibrar={(valor) => despachar(ACOES.ALTERNAR_VIBRAR, { valor })}
      />
    );
  } else if (estado.fase === FASES.EXERCICIO) {
    fase = (
      <ExercicioAtivo
        key={chaveDaFase}
        estado={estado}
        segundosDaSerie={treino.segundosDaSerie}
        despachar={despachar}
      />
    );
  } else if (estado.fase === FASES.DESCANSO) {
    fase = (
      <Descanso
        key={chaveDaFase}
        estado={estado}
        segundosDeDescanso={treino.segundosDeDescanso}
        despachar={despachar}
      />
    );
  } else if (estado.fase === FASES.PROXIMO) {
    fase = <ProximoExercicio key={chaveDaFase} estado={estado} despachar={despachar} />;
  } else {
    fase = (
      <Resumo
        key={chaveDaFase}
        estado={estado}
        despachar={despachar}
        aoFinalizar={finalizar}
        salvando={registrar.isPending}
        erro={registrar.isError ? registrar.error : null}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!treino.persistivel && (
        <p role="note" className="rounded-cartao border border-borda-controle bg-superficie p-3 text-sm">
          Este navegador não guarda o andamento: se a página recarregar, o treino recomeça do início.
        </p>
      )}
      <AnuncioDaFase estado={estado} />
      {fase}
      {estado.fase === FASES.PREPARACAO ? (
        <Botao variante="fantasma" para={voltarPara}>
          Voltar
        </Botao>
      ) : (
        <Botao variante="fantasma" onClick={() => setConfirmandoSaida(true)}>
          Sair do treino
        </Botao>
      )}
      <ModalDeConfirmacao
        aberto={confirmandoSaida}
        perigo
        titulo="Sair do treino?"
        descricao="O andamento deste treino será descartado e nada será salvo."
        rotuloConfirmar="Sair"
        rotuloCancelar="Continuar treinando"
        aoConfirmar={sair}
        aoCancelar={() => setConfirmandoSaida(false)}
      />
    </div>
  );
}
