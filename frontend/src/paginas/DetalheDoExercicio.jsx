import { useEffect } from 'react';
import { useParams } from 'react-router';
import Botao from '../componentes/Botao.jsx';
import Cabecalho from '../componentes/Cabecalho.jsx';
import EstadoVazio from '../componentes/EstadoVazio.jsx';
import Etiqueta from '../componentes/Etiqueta.jsx';
import MensagemDeErro from '../componentes/MensagemDeErro.jsx';
import Ilustracao from '../funcionalidades/exercicios/componentes/Ilustracao.jsx';
import PlayerVideo from '../funcionalidades/exercicios/componentes/PlayerVideo.jsx';
import { formatarDuracao } from '../funcionalidades/exercicios/formatos.js';
import { useExercicio } from '../funcionalidades/exercicios/hooks.js';
import { urlDeEmbedDoYoutube } from '../funcionalidades/exercicios/video.js';
import { descreverErro } from '../lib/erros.js';

const TITULO_GENERICO = 'Detalhe do exercício';

function Esqueleto() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="sr-only">
        Carregando exercício…
      </p>
      <div aria-hidden="true" className="h-6 w-40 animate-pulse rounded-botao bg-superficie" />
      <div aria-hidden="true" className="h-24 animate-pulse rounded-cartao bg-superficie" />
      <div aria-hidden="true" className="h-24 animate-pulse rounded-cartao bg-superficie" />
    </div>
  );
}

function Padroes({ exercicio }) {
  const temRepeticoes = exercicio.repeticoes_padrao != null && exercicio.repeticoes_padrao !== '';
  const duracao = formatarDuracao(exercicio.duracao_segundos_padrao);
  const descanso = formatarDuracao(exercicio.descanso_segundos);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      <dt className="text-texto-secundario">Séries</dt>
      <dd>{exercicio.series_padrao}</dd>
      {temRepeticoes && (
        <>
          <dt className="text-texto-secundario">Repetições</dt>
          <dd>{exercicio.repeticoes_padrao}</dd>
        </>
      )}
      {!temRepeticoes && duracao && (
        <>
          <dt className="text-texto-secundario">Duração</dt>
          <dd>{duracao}</dd>
        </>
      )}
      <dt className="text-texto-secundario">Descanso</dt>
      <dd>{descanso ?? 'Sem descanso'}</dd>
    </dl>
  );
}

function Conteudo({ exercicio }) {
  const temVideo = urlDeEmbedDoYoutube(exercicio.video_url) !== null;
  return (
    <>
      <div className="flex flex-wrap gap-1">
        <Etiqueta tipo="fundamento" valor={exercicio.fundamento}>
          {exercicio.fundamento_rotulo}
        </Etiqueta>
        <Etiqueta>{exercicio.nivel_rotulo}</Etiqueta>
      </div>

      {/* Sem vídeo não há player nem espaço reservado: entra só a ilustração do fundamento, decorativa. */}
      {temVideo ? (
        <PlayerVideo url={exercicio.video_url} nome={exercicio.nome} />
      ) : (
        <Ilustracao src={exercicio.imagem_url} className="mx-auto size-40" />
      )}

      <section className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Descrição</h2>
        <p className="whitespace-pre-line">{exercicio.descricao}</p>
      </section>

      {exercicio.foco && (
        <section className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Foco</h2>
          <p>{exercicio.foco}</p>
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Padrões</h2>
        <Padroes exercicio={exercicio} />
      </section>
    </>
  );
}

export default function DetalheDoExercicio() {
  const { exercicioId } = useParams();
  const consulta = useExercicio(exercicioId);
  const titulo = consulta.data?.nome ?? TITULO_GENERICO;

  useEffect(() => {
    document.title = `${titulo} · VOLLEY PRO`;
  }, [titulo]);

  const erro = consulta.isError ? descreverErro(consulta.error) : null;
  const naoEncontrado = erro?.status === 404;
  // 401 e 403 têm mensagem própria da API; os demais erros ganham a mensagem fixa.
  const mensagemDoErro =
    erro && (erro.status === 401 || erro.status === 403)
      ? undefined
      : 'Não foi possível carregar o exercício. Tente de novo.';

  return (
    <section className="pb-4">
      <Cabecalho titulo={titulo} voltarPara="/biblioteca" />
      <div className="flex flex-col gap-4 px-4">
        {consulta.isPending && <Esqueleto />}

        {naoEncontrado && (
          <EstadoVazio titulo="Exercício não encontrado" descricao="Ele pode ter sido removido da biblioteca.">
            <Botao variante="secundario" para="/biblioteca">
              Voltar para a Biblioteca
            </Botao>
          </EstadoVazio>
        )}

        {erro && !naoEncontrado && (
          <MensagemDeErro erro={consulta.error} mensagem={mensagemDoErro} aoTentarDeNovo={() => consulta.refetch()} />
        )}

        {consulta.isSuccess && <Conteudo exercicio={consulta.data} />}
      </div>
    </section>
  );
}
