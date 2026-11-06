import { useState } from 'react';
import { useLocation } from 'react-router';
import Botao from '../componentes/Botao.jsx';
import Carregando from '../componentes/Carregando.jsx';
import Cartao from '../componentes/Cartao.jsx';
import EstadoVazio from '../componentes/EstadoVazio.jsx';
import MensagemDeErro from '../componentes/MensagemDeErro.jsx';
import ModalDeConfirmacao from '../componentes/ModalDeConfirmacao.jsx';
import Pagina from '../componentes/Pagina.jsx';
import { limparTreino, restaurarTreino } from '../funcionalidades/treino-ativo/armazenamentoDoTreino.js';
import { selecionarRotuloDoExercicio } from '../funcionalidades/treino-ativo/maquinaDoTreino.js';
import { USUARIO_DO_ARMAZENAMENTO, obterStorage } from '../funcionalidades/treino-ativo/navegador.js';
import { useTreinos } from '../funcionalidades/treinos/hooks.js';

const plural = (quantidade, singular, pluralDaPalavra) =>
  `${quantidade} ${quantidade === 1 ? singular : pluralDaPalavra}`;

function descreverTreino(treino) {
  const partes = [];
  if (typeof treino.duracao_estimada_minutos === 'number') partes.push(`${treino.duracao_estimada_minutos} min`);
  if (typeof treino.total_exercicios === 'number') {
    partes.push(plural(treino.total_exercicios, 'exercício', 'exercícios'));
  }
  return partes.join(' · ');
}

/** Cartão do treino guardado neste aparelho, com Retomar e Descartar (com confirmação). */
function TreinoEmAndamento({ emAndamento, aoDescartar }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <Cartao como="section" elevado aria-labelledby="titulo-em-andamento" className="flex flex-col gap-3">
      <h2 id="titulo-em-andamento" className="text-xl font-bold">
        Treino em andamento
      </h2>
      <p>
        <span className="font-bold">{emAndamento.treino.nome}</span>
        <span className="block text-sm text-texto-secundario">{selecionarRotuloDoExercicio(emAndamento)}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Botao para={`/treinar/${emAndamento.treino_id}`}>Retomar</Botao>
        <Botao variante="secundario" onClick={() => setConfirmando(true)}>
          Descartar
        </Botao>
      </div>
      <ModalDeConfirmacao
        aberto={confirmando}
        perigo
        titulo="Descartar o treino em andamento?"
        descricao="O andamento guardado neste aparelho será apagado e nada será salvo."
        rotuloConfirmar="Descartar"
        aoConfirmar={() => {
          setConfirmando(false);
          aoDescartar();
        }}
        aoCancelar={() => setConfirmando(false)}
      />
    </Cartao>
  );
}

/** /treino — escolher um treino para executar ou retomar o que está em andamento. */
export default function Treino() {
  const { state } = useLocation();
  const storage = obterStorage();
  const [emAndamento, setEmAndamento] = useState(() => restaurarTreino(storage, USUARIO_DO_ARMAZENAMENTO));
  const [page, setPage] = useState(1);
  const consulta = useTreinos({ escopo: 'meus', page });

  function descartar() {
    limparTreino(storage, USUARIO_DO_ARMAZENAMENTO);
    setEmAndamento(null);
  }

  let lista;
  if (consulta.isPending) {
    lista = <Carregando rotulo="Carregando seus treinos…" />;
  } else if (consulta.isError) {
    lista = (
      <MensagemDeErro
        erro={consulta.error}
        mensagem="Não foi possível carregar seus treinos."
        aoTentarDeNovo={() => consulta.refetch()}
      />
    );
  } else if (consulta.data.data.length === 0) {
    lista = (
      <EstadoVazio titulo="Você ainda não tem treinos." descricao="Crie um treino para começar a treinar.">
        <Botao para="/treinos/novo">Criar treino</Botao>
      </EstadoVazio>
    );
  } else {
    const { links } = consulta.data;
    lista = (
      <>
        <ul className="flex flex-col gap-3">
          {consulta.data.data.map((treino) => (
            <Cartao key={treino.id} como="li" className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold break-words">{treino.nome}</h3>
                {descreverTreino(treino) && <p className="text-sm text-texto-secundario">{descreverTreino(treino)}</p>}
              </div>
              <Botao para={`/treinar/${treino.id}`} aria-label={`Iniciar treino ${treino.nome}`}>
                Iniciar treino
              </Botao>
            </Cartao>
          ))}
        </ul>
        {(links?.prev || links?.next) && (
          <nav aria-label="Paginação dos treinos" className="flex justify-between gap-2">
            <Botao variante="secundario" disabled={!links?.prev} onClick={() => setPage((atual) => atual - 1)}>
              Anterior
            </Botao>
            <Botao variante="secundario" disabled={!links?.next} onClick={() => setPage((atual) => atual + 1)}>
              Próxima
            </Botao>
          </nav>
        )}
      </>
    );
  }

  return (
    <Pagina titulo="Treino">
      <div className="mx-auto mt-4 flex max-w-xl flex-col gap-6">
        {state?.mensagem && (
          <p role="status" className="rounded-cartao border border-primaria bg-superficie p-3 font-bold">
            {state.mensagem}
          </p>
        )}
        {emAndamento && <TreinoEmAndamento emAndamento={emAndamento} aoDescartar={descartar} />}
        <section aria-labelledby="titulo-meus-treinos" className="flex flex-col gap-3">
          <h2 id="titulo-meus-treinos" className="text-xl font-bold">
            Meus treinos
          </h2>
          {lista}
        </section>
      </div>
    </Pagina>
  );
}
