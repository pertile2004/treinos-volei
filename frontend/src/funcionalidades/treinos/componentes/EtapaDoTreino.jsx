import { useEffect, useId, useRef } from 'react';
import Botao from '../../../componentes/Botao.jsx';
import { acoes, itensDaEtapa, montadorDeTreino, podeAdicionar, podeDescer, podeSubir } from '../montadorDeTreino.js';
import ItemDoTreino from './ItemDoTreino.jsx';
import SeletorDeExercicios from './SeletorDeExercicios.jsx';

/** Erros de um item a partir do mapa geral (`itens.N.campo` → mensagem), com N = posição em estado.itens. */
function errosDoItem(errosDosItens, indice) {
  const prefixo = `itens.${indice}.`;
  const erros = {};
  Object.entries(errosDosItens).forEach(([chave, mensagem]) => {
    if (chave.startsWith(prefixo)) erros[chave.slice(prefixo.length)] = mensagem;
  });
  return erros;
}

/**
 * Uma das quatro etapas do treino: lista de itens (ou o vazio), botão "Adicionar exercício" e o seletor.
 * O estado é o do reducer montadorDeTreino; `despachar` recebe as ações; `anunciar` fala na região aria-live.
 */
export default function EtapaDoTreino({
  etapa,
  rotulo,
  estado,
  despachar,
  errosDosItens = {},
  seletorAberto = false,
  aoAlternarSeletor,
  fundamentos,
  niveis,
  anunciar,
}) {
  const idBase = useId();
  const idTitulo = `${idBase}-titulo`;
  const idSeletor = `${idBase}-seletor`;
  const refBotao = useRef(null);
  const refFocoPendente = useRef(null);

  const itens = itensDaEtapa(estado, etapa);
  const idDoItem = (chave) => `${idBase}-item-${chave}`;
  const rotuloDoFundamento = (valor) => fundamentos?.find((item) => item.valor === valor)?.rotulo;

  // Depois de mover, o foco fica no mesmo botão; se ele desabilitou (chegou à borda), vai para o irmão.
  useEffect(() => {
    if (!refFocoPendente.current) return;
    const { chave, direcao } = refFocoPendente.current;
    refFocoPendente.current = null;
    const outra = direcao === 'subir' ? 'descer' : 'subir';
    const botao = document.getElementById(`${idDoItem(chave)}-${direcao}`);
    const alvo = botao && !botao.disabled ? botao : document.getElementById(`${idDoItem(chave)}-${outra}`);
    alvo?.focus();
  });

  function adicionar(exercicio) {
    const proximo = montadorDeTreino(estado, acoes.adicionarExercicio(etapa, exercicio));
    if (proximo === estado) return;
    despachar(acoes.adicionarExercicio(etapa, exercicio));
    anunciar?.(`${exercicio.nome} adicionado em ${rotulo}, posição ${itensDaEtapa(proximo, etapa).length}.`);
  }

  function mover(item, direcao) {
    const acao = direcao === 'subir' ? acoes.subirItem(item.chave) : acoes.descerItem(item.chave);
    const proximo = montadorDeTreino(estado, acao);
    if (proximo === estado) return;
    despachar(acao);
    const daEtapa = itensDaEtapa(proximo, etapa);
    const posicao = daEtapa.findIndex((outro) => outro.chave === item.chave) + 1;
    anunciar?.(`${item.exercicio.nome} movido para a posição ${posicao} de ${daEtapa.length} em ${rotulo}.`);
    refFocoPendente.current = { chave: item.chave, direcao };
  }

  function remover(item) {
    despachar(acoes.removerItem(item.chave));
    anunciar?.(`${item.exercicio.nome} removido de ${rotulo}.`);
    refBotao.current?.focus();
  }

  function fecharSeletor() {
    aoAlternarSeletor?.(false);
    refBotao.current?.focus();
  }

  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={idTitulo} className="text-xl font-bold">
          {rotulo}
        </h3>
        <p className="text-sm text-texto-secundario">
          {itens.length === 0 ? 'Sem exercícios' : `${itens.length} ${itens.length === 1 ? 'exercício' : 'exercícios'}`}
        </p>
      </div>

      {itens.length === 0 ? (
        <p className="rounded-cartao border border-borda bg-superficie p-4 text-texto-secundario">
          Nenhum exercício nesta etapa.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {itens.map((item, posicao) => (
            <ItemDoTreino
              key={item.chave}
              id={idDoItem(item.chave)}
              item={item}
              rotuloDoFundamento={rotuloDoFundamento}
              podeSubir={podeSubir(estado, item.chave)}
              podeDescer={podeDescer(estado, item.chave)}
              erros={errosDoItem(errosDosItens, estado.itens.indexOf(item))}
              aoSubir={() => mover(item, 'subir')}
              aoDescer={() => mover(item, 'descer')}
              aoRemover={() => remover(item, posicao)}
              aoAjustar={(campo, valor) => despachar(acoes.ajustarItem(item.chave, campo, valor))}
              aoDefinirMedida={(medida) => despachar(acoes.definirMedida(item.chave, medida))}
            />
          ))}
        </ol>
      )}

      <div>
        <Botao
          ref={refBotao}
          variante="secundario"
          aria-label={`Adicionar exercício em ${rotulo}`}
          aria-expanded={seletorAberto}
          aria-controls={seletorAberto ? idSeletor : undefined}
          onClick={() => aoAlternarSeletor?.(!seletorAberto)}
        >
          Adicionar exercício
        </Botao>
      </div>

      {seletorAberto && (
        <SeletorDeExercicios
          id={idSeletor}
          etapaRotulo={rotulo}
          fundamentos={fundamentos}
          niveis={niveis}
          podeAdicionar={podeAdicionar(estado)}
          aoAdicionar={adicionar}
          aoFechar={fecharSeletor}
        />
      )}
    </section>
  );
}
