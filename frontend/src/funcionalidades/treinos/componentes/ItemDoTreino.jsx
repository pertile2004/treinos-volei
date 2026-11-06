import Botao from '../../../componentes/Botao.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import Stepper from '../../../componentes/Stepper.jsx';
import { LIMITES } from '../montadorDeTreino.js';

const PASSO_EM_SEGUNDOS = 5;

function Seta({ paraCima }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paraCima ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  );
}

/** Stepper com legenda visível e a mensagem de erro ligada ao grupo. */
function Parametro({ rotulo, campo, valor, erro, idErro, aoMudar, passo = 1 }) {
  const { minimo, maximo } = LIMITES[campo];
  return (
    <div className="flex flex-col gap-1">
      {/* O nome acessível do grupo já é o rótulo: o texto visível fica fora da árvore de acessibilidade. */}
      <p aria-hidden="true" className="text-sm font-bold">
        {rotulo}
      </p>
      <Stepper
        rotulo={rotulo}
        valor={valor}
        min={minimo}
        max={maximo}
        passo={passo}
        aoMudar={aoMudar}
        aria-describedby={erro ? idErro : undefined}
      />
      {erro && (
        <p id={idErro} className="text-sm text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Um exercício dentro de uma etapa: parâmetros no Stepper, medida (repetições ou duração),
 * botões de mover e remover. `erros` tem as chaves do item (series, repeticoes, duracao_segundos,
 * descanso_segundos, exercicio_id, etapa) com a mensagem de cada uma.
 */
export default function ItemDoTreino({
  id,
  item,
  rotuloDoFundamento,
  podeSubir,
  podeDescer,
  erros = {},
  aoSubir,
  aoDescer,
  aoRemover,
  aoAjustar,
  aoDefinirMedida,
}) {
  const nome = item.exercicio.nome;
  const idTitulo = `${id}-titulo`;
  const porRepeticoes = item.repeticoes != null;
  const porDuracao = item.duracao_segundos != null;
  const erroGeral = erros.exercicio_id ?? erros.etapa;

  return (
    <li
      id={id}
      tabIndex={-1}
      aria-labelledby={idTitulo}
      className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h4 id={idTitulo} className="text-base font-bold break-words">
            {nome}
          </h4>
          <p className="flex flex-wrap gap-1">
            {item.exercicio.fundamento && (
              <Etiqueta tipo="fundamento" valor={item.exercicio.fundamento}>
                {rotuloDoFundamento?.(item.exercicio.fundamento) ?? item.exercicio.fundamento}
              </Etiqueta>
            )}
            {item.exercicio.removido && <Etiqueta>Removido da biblioteca</Etiqueta>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Botao
            id={`${id}-subir`}
            variante="secundario"
            tamanho="sm"
            aria-label={`Mover ${nome} para cima`}
            disabled={!podeSubir}
            onClick={aoSubir}
          >
            <Seta paraCima />
          </Botao>
          <Botao
            id={`${id}-descer`}
            variante="secundario"
            tamanho="sm"
            aria-label={`Mover ${nome} para baixo`}
            disabled={!podeDescer}
            onClick={aoDescer}
          >
            <Seta paraCima={false} />
          </Botao>
          <Botao variante="fantasma" tamanho="sm" aria-label={`Remover ${nome}`} onClick={aoRemover}>
            Remover
          </Botao>
        </div>
      </div>

      {erroGeral && <p className="text-sm text-perigo">{erroGeral}</p>}

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Parametro
          rotulo="Séries"
          campo="series"
          valor={item.series}
          erro={erros.series}
          idErro={`${id}-erro-series`}
          aoMudar={(valor) => aoAjustar('series', valor)}
        />

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-bold">Medida</legend>
          <div className="flex min-h-11 flex-wrap items-center gap-4">
            <label className="inline-flex min-h-8 items-center gap-2">
              <input
                type="radio"
                name={`${id}-medida`}
                value="repeticoes"
                checked={porRepeticoes && !porDuracao}
                onChange={() => aoDefinirMedida('repeticoes')}
                className="size-5 accent-primaria"
              />
              Repetições
            </label>
            <label className="inline-flex min-h-8 items-center gap-2">
              <input
                type="radio"
                name={`${id}-medida`}
                value="duracao_segundos"
                checked={porDuracao && !porRepeticoes}
                onChange={() => aoDefinirMedida('duracao_segundos')}
                className="size-5 accent-primaria"
              />
              Duração
            </label>
          </div>
        </fieldset>

        {porRepeticoes && (
          <Parametro
            rotulo="Repetições"
            campo="repeticoes"
            valor={item.repeticoes}
            erro={erros.repeticoes}
            idErro={`${id}-erro-repeticoes`}
            aoMudar={(valor) => aoAjustar('repeticoes', valor)}
          />
        )}
        {porDuracao && (
          <Parametro
            rotulo="Duração em segundos"
            campo="duracao_segundos"
            valor={item.duracao_segundos}
            erro={erros.duracao_segundos}
            idErro={`${id}-erro-duracao`}
            passo={PASSO_EM_SEGUNDOS}
            aoMudar={(valor) => aoAjustar('duracao_segundos', valor)}
          />
        )}
        {!porRepeticoes && !porDuracao && (
          <p className="text-sm text-perigo">{erros.repeticoes ?? 'Informe as repetições ou a duração.'}</p>
        )}

        <Parametro
          rotulo="Descanso em segundos"
          campo="descanso_segundos"
          valor={item.descanso_segundos}
          erro={erros.descanso_segundos}
          idErro={`${id}-erro-descanso`}
          passo={PASSO_EM_SEGUNDOS}
          aoMudar={(valor) => aoAjustar('descanso_segundos', valor)}
        />
      </div>
    </li>
  );
}
