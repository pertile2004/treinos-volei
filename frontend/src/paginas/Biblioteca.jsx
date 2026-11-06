import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import Abas, { PainelDaAba } from '../componentes/Abas.jsx';
import Botao from '../componentes/Botao.jsx';
import EstadoVazio from '../componentes/EstadoVazio.jsx';
import MensagemDeErro from '../componentes/MensagemDeErro.jsx';
import Pagina from '../componentes/Pagina.jsx';
import CartaoExercicio from '../funcionalidades/exercicios/componentes/CartaoExercicio.jsx';
import FiltrosExercicios from '../funcionalidades/exercicios/componentes/FiltrosExercicios.jsx';
import Paginacao from '../funcionalidades/exercicios/componentes/Paginacao.jsx';
import { resumirResultado } from '../funcionalidades/exercicios/formatos.js';
import { useExercicios } from '../funcionalidades/exercicios/hooks.js';
import { useReferencias } from '../funcionalidades/referencias/hooks.js';
import { descreverErro } from '../lib/erros.js';

const ABAS = [
  { id: 'prontos', rotulo: 'Treinos Prontos' },
  { id: 'meus', rotulo: 'Meus Treinos' },
];

const CHAVES_DE_FILTRO = ['fundamento', 'nivel', 'busca'];
const GRADE = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

// Os filtros moram na URL: voltar do detalhe mantém a busca, e o link pode ser compartilhado.
function lerFiltros(parametros) {
  return {
    fundamento: parametros.get('fundamento') ?? '',
    nivel: parametros.get('nivel') ?? '',
    busca: parametros.get('busca') ?? '',
    pagina: parametros.get('pagina') ?? 1,
  };
}

// 401 e 403 têm mensagem própria da API ("Não autenticado.", "Ação não autorizada."); o resto ganha a fixa.
function mensagemDoErro(erro, fixa) {
  const { status } = descreverErro(erro);
  return status === 401 || status === 403 ? undefined : fixa;
}

function Esqueleto() {
  return (
    <div aria-busy="true" className={GRADE}>
      <p role="status" className="sr-only">
        Carregando exercícios…
      </p>
      {Array.from({ length: 6 }, (_, indice) => (
        <div key={indice} aria-hidden="true" className="h-28 animate-pulse rounded-cartao bg-superficie" />
      ))}
    </div>
  );
}

function TreinosProntos() {
  const [parametros, setParametros] = useSearchParams();
  const filtros = lerFiltros(parametros);
  const temFiltro = CHAVES_DE_FILTRO.some((chave) => filtros[chave] !== '');

  const referencias = useReferencias();
  const consulta = useExercicios(filtros, { placeholderData: keepPreviousData });

  // Filtro novo volta para a página 1; só a própria paginação mantém a página.
  const atualizar = useCallback(
    (parcial) => {
      setParametros((atuais) => {
        const novos = new URLSearchParams(atuais);
        for (const [chave, valor] of Object.entries(parcial)) {
          if (valor) novos.set(chave, String(valor));
          else novos.delete(chave);
        }
        if (!Object.hasOwn(parcial, 'pagina')) novos.delete('pagina');
        return novos;
      });
    },
    [setParametros],
  );

  const pagina = consulta.data;
  const vazio = consulta.isSuccess && pagina.data.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {referencias.isError ? (
        <MensagemDeErro
          erro={referencias.error}
          mensagem="Não foi possível carregar os filtros."
          aoTentarDeNovo={() => referencias.refetch()}
        />
      ) : (
        <FiltrosExercicios
          fundamentos={referencias.data?.fundamentos}
          niveis={referencias.data?.niveis}
          filtros={filtros}
          aoMudar={atualizar}
        />
      )}

      <p aria-live="polite" aria-atomic="true" className={vazio ? 'sr-only' : 'text-sm text-texto-secundario'}>
        {consulta.isSuccess ? resumirResultado(pagina.meta.total) : ''}
      </p>

      {consulta.isPending && <Esqueleto />}

      {consulta.isError && (
        <MensagemDeErro
          erro={consulta.error}
          mensagem={mensagemDoErro(consulta.error, 'Não foi possível carregar os exercícios. Tente de novo.')}
          aoTentarDeNovo={() => consulta.refetch()}
        />
      )}

      {vazio && (
        <EstadoVazio titulo="Nenhum exercício encontrado" descricao="Ajuste os filtros ou a busca.">
          {temFiltro && (
            <Botao variante="secundario" onClick={() => setParametros({})}>
              Limpar filtros
            </Botao>
          )}
        </EstadoVazio>
      )}

      {consulta.isSuccess && !vazio && (
        <>
          <ul aria-label="Exercícios" aria-busy={consulta.isFetching || undefined} className={GRADE}>
            {pagina.data.map((exercicio) => (
              <CartaoExercicio key={exercicio.id} exercicio={exercicio} />
            ))}
          </ul>
          <Paginacao
            atual={pagina.meta.current_page}
            total={pagina.meta.last_page}
            aoMudar={(nova) => atualizar({ pagina: nova > 1 ? nova : '' })}
          />
        </>
      )}
    </div>
  );
}

export default function Biblioteca() {
  const [aba, setAba] = useState('prontos');
  return (
    <Pagina titulo="Biblioteca">
      <Abas itens={ABAS} ativa={aba} aoMudar={setAba} rotuloDoGrupo="Seções da biblioteca" className="mt-4" />
      <PainelDaAba id="prontos" ativa={aba} className="mt-4">
        <TreinosProntos />
      </PainelDaAba>
      <PainelDaAba id="meus" ativa={aba} className="mt-4">
        {/* As sequências montadas pelo usuário chegam com os treinos (RF-07); até lá o painel só informa. */}
        <EstadoVazio
          titulo="Meus Treinos"
          descricao="Seus treinos vão aparecer aqui quando a criação de treinos estiver disponível."
        />
      </PainelDaAba>
    </Pagina>
  );
}
