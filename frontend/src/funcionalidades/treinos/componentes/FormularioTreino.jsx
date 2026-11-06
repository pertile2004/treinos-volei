import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useMemo, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';
import Botao from '../../../componentes/Botao.jsx';
import CampoTexto from '../../../componentes/CampoTexto.jsx';
import Carregando from '../../../componentes/Carregando.jsx';
import MensagemDeErro from '../../../componentes/MensagemDeErro.jsx';
import { aplicarErrosDaApi } from '../../../lib/formularios.js';
import { useReferencias } from '../../referencias/hooks.js';
import { estadoParaCorpo } from '../corpoDoTreino.js';
import { esquemaDoTreino, visibilidadesDoPapel } from '../esquema.js';
import { useCriarTreino } from '../hooks.js';
import { ETAPAS, estadoInicial, montadorDeTreino } from '../montadorDeTreino.js';
import { validarTreino } from '../validarTreino.js';
import EtapaDoTreino from './EtapaDoTreino.jsx';

// Mesmo desenho do CampoTexto do design system, para o <select> e o <textarea> que ele não cobre.
const CLASSE_DO_CAMPO =
  'w-full rounded-botao border bg-superficie px-3 text-base text-texto placeholder:text-texto-secundario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria disabled:cursor-not-allowed disabled:opacity-50';

const ACOES_QUE_MUDAM_A_LISTA = ['adicionar_exercicio', 'remover_item', 'subir_item', 'descer_item'];

function ehErroDeItem(campo) {
  return campo === 'itens' || campo.startsWith('itens.');
}

function mensagemDoErroGeral(erro) {
  const status = erro?.response?.status;
  if (status === 401) return 'Você precisa entrar para criar um treino.';
  if (status === 403) return 'Você não tem permissão para criar treinos.';
  return 'Não foi possível salvar o treino.';
}

function Rotulo({ htmlFor, obrigatorio, children }) {
  return (
    <div className="flex items-baseline gap-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-texto">
        {children}
      </label>
      {obrigatorio && (
        <span aria-hidden="true" className="text-xs text-texto-secundario">
          (obrigatório)
        </span>
      )}
    </div>
  );
}

function Erro({ id, children }) {
  return (
    <p id={id} className="text-sm text-perigo">
      {children}
    </p>
  );
}

/** Campo de escolha (select) com rótulo visível e erro ligado por aria-describedby. Aceita `{...register()}`. */
function CampoDeEscolha({ rotulo, erro, obrigatorio = false, children, ref, ...resto }) {
  const id = useId();
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-1">
      <Rotulo htmlFor={id} obrigatorio={obrigatorio}>
        {rotulo}
      </Rotulo>
      <select
        ref={ref}
        id={id}
        required={obrigatorio || undefined}
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`${CLASSE_DO_CAMPO} min-h-11 ${erro ? 'border-perigo' : 'border-borda-controle'}`}
        {...resto}
      >
        {children}
      </select>
      {erro && <Erro id={idErro}>{erro}</Erro>}
    </div>
  );
}

/** Campo de texto longo (textarea) com rótulo visível e erro ligado por aria-describedby. Aceita `{...register()}`. */
function CampoDeTextoLongo({ rotulo, erro, ref, ...resto }) {
  const id = useId();
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-1">
      <Rotulo htmlFor={id}>{rotulo}</Rotulo>
      <textarea
        ref={ref}
        id={id}
        rows={3}
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`${CLASSE_DO_CAMPO} min-h-24 py-2 ${erro ? 'border-perigo' : 'border-borda-controle'}`}
        {...resto}
      />
      {erro && <Erro id={idErro}>{erro}</Erro>}
    </div>
  );
}

function rotuloDe(lista, valor) {
  return lista?.find((item) => item.valor === valor)?.rotulo ?? valor;
}

function Formulario({ referencias, papel, aoCriar }) {
  const niveis = referencias.niveis ?? [];
  const valoresDeNivel = niveis.map((nivel) => nivel.valor);
  const opcoesDeVisibilidade = visibilidadesDoPapel(papel).map((valor) => ({
    valor,
    rotulo: rotuloDe(referencias.visibilidades, valor),
  }));

  // O esquema só muda quando o papel ou a lista de níveis (vinda do cache do GET /referencias) mudam.
  const esquema = useMemo(
    () => esquemaDoTreino({ papel, niveis: referencias.niveis?.map((nivel) => nivel.valor) }),
    [papel, referencias.niveis],
  );
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { nome: '', descricao: '', nivel: '', visibilidade: opcoesDeVisibilidade[0]?.valor ?? 'privado' },
  });

  const [montador, despachar] = useReducer(montadorDeTreino, undefined, estadoInicial);
  const [errosDosItens, setErrosDosItens] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [anuncio, setAnuncio] = useState('');
  const [seletorAberto, setSeletorAberto] = useState(null);
  const criar = useCriarTreino();
  const idErroItens = useId();

  function despacharItens(acao) {
    despachar(acao);
    if (ACOES_QUE_MUDAM_A_LISTA.includes(acao.tipo)) setErrosDosItens({});
  }

  function estadoCompleto(valores) {
    return { ...montador, ...valores };
  }

  /** Confere os itens com as mesmas regras do servidor e guarda os erros (chaves iguais às do 422). */
  function validarItens(valores) {
    const erros = validarTreino(estadoCompleto(valores), { papel, niveis: valoresDeNivel });
    const dosItens = Object.fromEntries(Object.entries(erros).filter(([campo]) => ehErroDeItem(campo)));
    setErrosDosItens(dosItens);
    return dosItens;
  }

  function focarErroDosItens(dosItens) {
    const chaves = Object.keys(dosItens);
    if (chaves.length === 0) return;
    if (chaves.includes('itens')) {
      document.getElementById(idErroItens)?.focus();
      return;
    }
    const indice = Number(chaves[0].split('.')[1]);
    const item = montador.itens[indice];
    if (item) document.querySelector(`[id$="-item-${item.chave}"]`)?.focus();
  }

  // setError para o aplicarErrosDaApi: erros de item ficam no mapa dos itens; os demais vão ao React Hook Form.
  function aplicarErro(campo, erro, opcoes) {
    if (ehErroDeItem(campo)) {
      setErrosDosItens((atual) => ({ ...atual, [campo]: erro.message }));
      if (opcoes?.shouldFocus) focarErroDosItens({ [campo]: erro.message });
      return;
    }
    setError(campo, erro, opcoes);
  }

  async function aoEnviarValido(valores) {
    setErroGeral(null);
    const dosItens = validarItens(valores);
    if (Object.keys(dosItens).length > 0) {
      setAnuncio('Confira os exercícios do treino antes de salvar.');
      focarErroDosItens(dosItens);
      return;
    }
    try {
      const treino = await criar.mutateAsync(estadoParaCorpo(estadoCompleto(valores)));
      aoCriar?.(treino);
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, aplicarErro)) setErroGeral(erro);
    }
  }

  function aoEnviarInvalido() {
    setErroGeral(null);
    validarItens(getValues());
  }

  const temVariasVisibilidades = opcoesDeVisibilidade.length > 1;

  return (
    <form noValidate onSubmit={handleSubmit(aoEnviarValido, aoEnviarInvalido)} className="mt-4 flex flex-col gap-8">
      <p role="status" aria-label="Avisos do treino" aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-xl font-bold">Dados do treino</legend>
        <CampoTexto
          rotulo="Nome do treino"
          obrigatorio
          autoComplete="off"
          maxLength={120}
          erro={errors.nome?.message}
          {...register('nome')}
        />
        <CampoDeTextoLongo rotulo="Descrição (opcional)" erro={errors.descricao?.message} {...register('descricao')} />
        <CampoDeEscolha rotulo="Nível" obrigatorio erro={errors.nivel?.message} {...register('nivel')}>
          <option value="">Escolha o nível</option>
          {niveis.map((nivel) => (
            <option key={nivel.valor} value={nivel.valor}>
              {nivel.rotulo}
            </option>
          ))}
        </CampoDeEscolha>
        {temVariasVisibilidades ? (
          <CampoDeEscolha
            rotulo="Visibilidade"
            obrigatorio
            erro={errors.visibilidade?.message}
            {...register('visibilidade')}
          >
            {opcoesDeVisibilidade.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </CampoDeEscolha>
        ) : (
          <p className="text-sm">
            <span className="font-bold">Visibilidade:</span> {opcoesDeVisibilidade[0]?.rotulo}{' '}
            <span className="text-texto-secundario">(só você vê este treino)</span>
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Exercícios por etapa</h2>
          <p className="text-sm text-texto-secundario">
            De 1 a 30 exercícios, distribuídos nas quatro etapas do treino.
          </p>
          {errosDosItens.itens && (
            <p id={idErroItens} role="alert" tabIndex={-1} className="text-perigo">
              {errosDosItens.itens}
            </p>
          )}
        </div>
        {ETAPAS.map((etapa) => (
          <EtapaDoTreino
            key={etapa}
            etapa={etapa}
            rotulo={rotuloDe(referencias.etapas, etapa)}
            estado={montador}
            despachar={despacharItens}
            errosDosItens={errosDosItens}
            seletorAberto={seletorAberto === etapa}
            aoAlternarSeletor={(abrir) => setSeletorAberto(abrir ? etapa : null)}
            fundamentos={referencias.fundamentos ?? []}
            niveis={niveis}
            anunciar={setAnuncio}
          />
        ))}
      </div>

      {erroGeral && <MensagemDeErro erro={erroGeral} mensagem={mensagemDoErroGeral(erroGeral)} />}

      <div>
        <Botao type="submit" carregando={criar.isPending}>
          {criar.isPending ? 'Salvando…' : 'Salvar treino'}
        </Botao>
      </div>
    </form>
  );
}

/**
 * Formulário de criação de treino (PR-12): cabeçalho com React Hook Form + Zod e itens no reducer
 * montadorDeTreino. `papel` restringe a visibilidade (sem papel, o servidor decide); `aoCriar(treino)`
 * é chamado com a resposta da API depois de salvar.
 */
export default function FormularioTreino({ papel, aoCriar }) {
  const referencias = useReferencias();
  if (referencias.isPending) return <Carregando />;
  if (referencias.isError) {
    return (
      <MensagemDeErro
        erro={referencias.error}
        mensagem="Não foi possível carregar os dados do formulário."
        aoTentarDeNovo={() => referencias.refetch()}
      />
    );
  }
  return <Formulario referencias={referencias.data} papel={papel} aoCriar={aoCriar} />;
}
