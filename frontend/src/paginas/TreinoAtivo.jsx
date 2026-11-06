import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Botao from '../componentes/Botao.jsx';
import Carregando from '../componentes/Carregando.jsx';
import EstadoVazio from '../componentes/EstadoVazio.jsx';
import MensagemDeErro from '../componentes/MensagemDeErro.jsx';
import ModalDeConfirmacao from '../componentes/ModalDeConfirmacao.jsx';
import Pagina from '../componentes/Pagina.jsx';
import { limparTreino, restaurarTreino } from '../funcionalidades/treino-ativo/armazenamentoDoTreino.js';
import ExecucaoDoTreino from '../funcionalidades/treino-ativo/componentes/ExecucaoDoTreino.jsx';
import { criarEstadoInicial } from '../funcionalidades/treino-ativo/maquinaDoTreino.js';
import { USUARIO_DO_ARMAZENAMENTO, obterStorage } from '../funcionalidades/treino-ativo/navegador.js';
import { useTreino } from '../funcionalidades/treinos/hooks.js';

const PAGINA_TREINO = '/treino';

/** /treinar/:treinoId — executa o treino e salva a sessão. Um treino em andamento sobrevive a recarregar a página. */
export default function TreinoAtivo() {
  const { treinoId } = useParams();
  const navegar = useNavigate();
  const storage = obterStorage();
  const [salvo, setSalvo] = useState(() => restaurarTreino(storage, USUARIO_DO_ARMAZENAMENTO));

  const retomavel = salvo !== null && String(salvo.treino_id) === String(treinoId);
  const outroEmAndamento = salvo !== null && !retomavel;
  // Com o andamento guardado, a tela abre sem depender da rede (o retrato do treino está no estado).
  const consulta = useTreino(retomavel ? null : treinoId);
  const estadoNovo = useMemo(
    () => (consulta.data && consulta.data.itens?.length > 0 ? criarEstadoInicial(consulta.data) : null),
    [consulta.data],
  );

  function descartarOutro() {
    limparTreino(storage, USUARIO_DO_ARMAZENAMENTO);
    setSalvo(null);
  }

  const aoSalvar = () => navegar(PAGINA_TREINO, { state: { mensagem: 'Treino salvo.' } });
  const aoSair = () => navegar(PAGINA_TREINO);

  let conteudo;
  if (retomavel) {
    conteudo = (
      <ExecucaoDoTreino
        key={`salvo-${salvo.treino_id}`}
        estadoInicial={salvo}
        usuarioId={USUARIO_DO_ARMAZENAMENTO}
        storage={storage}
        aoSalvar={aoSalvar}
        aoSair={aoSair}
        voltarPara={PAGINA_TREINO}
      />
    );
  } else if (consulta.isPending) {
    conteudo = <Carregando rotulo="Carregando treino…" />;
  } else if (consulta.isError && consulta.error?.response?.status === 404) {
    conteudo = (
      <EstadoVazio
        titulo="Treino não encontrado."
        descricao="Ele pode ter sido excluído ou não está disponível para você."
      >
        <Botao variante="secundario" para={PAGINA_TREINO}>
          Voltar
        </Botao>
      </EstadoVazio>
    );
  } else if (consulta.isError) {
    conteudo = (
      <MensagemDeErro
        erro={consulta.error}
        mensagem="Não foi possível carregar o treino."
        aoTentarDeNovo={() => consulta.refetch()}
      />
    );
  } else if (!estadoNovo) {
    conteudo = (
      <EstadoVazio
        titulo="Este treino não tem exercícios."
        descricao="Adicione exercícios ao treino antes de executá-lo."
      >
        <Botao variante="secundario" para={PAGINA_TREINO}>
          Voltar
        </Botao>
      </EstadoVazio>
    );
  } else if (outroEmAndamento) {
    conteudo = null;
  } else {
    conteudo = (
      <ExecucaoDoTreino
        key={`novo-${treinoId}`}
        estadoInicial={estadoNovo}
        usuarioId={USUARIO_DO_ARMAZENAMENTO}
        storage={storage}
        aoSalvar={aoSalvar}
        aoSair={aoSair}
        voltarPara={PAGINA_TREINO}
      />
    );
  }

  return (
    <Pagina titulo="Treino ativo">
      <div className="mx-auto mt-4 max-w-xl">{conteudo}</div>
      <ModalDeConfirmacao
        aberto={outroEmAndamento}
        perigo
        titulo="Você tem um treino em andamento"
        descricao={`"${salvo?.treino?.nome ?? ''}" ainda não foi finalizado. Retome esse treino ou descarte-o para iniciar este.`}
        rotuloConfirmar="Descartar e iniciar este"
        rotuloCancelar="Retomar"
        aoConfirmar={descartarOutro}
        aoCancelar={() => navegar(`/treinar/${salvo.treino_id}`)}
      />
    </Pagina>
  );
}
