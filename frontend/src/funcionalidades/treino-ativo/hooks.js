import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { limparTreino, precisaGravar, salvarTreino } from './armazenamentoDoTreino.js';
import {
  ACOES,
  FASES,
  criarAcaoIniciar,
  deveVibrar,
  reducerDoTreino,
  selecionarSegundosAtivos,
  selecionarSegundosDaSerie,
  selecionarSegundosDeDescanso,
} from './maquinaDoTreino.js';
import { gerarIdCliente, vibrar } from './navegador.js';
import { prepararEnvio } from './montarSessao.js';

const CHAVE_DE_SONDAGEM = 'volleypro:treino-ativo:sondagem';

// Conferido uma vez, ao montar: um storage que recusa gravar (cheio, bloqueado) vira o aviso "sem persistência".
function storageFunciona(storage) {
  if (!storage) return false;
  try {
    storage.setItem(CHAVE_DE_SONDAGEM, '1');
    storage.removeItem(CHAVE_DE_SONDAGEM);
    return true;
  } catch {
    return false;
  }
}

// Um estado restaurado recebe um tique com o instante atual: descanso vencido avança, exercício continua contando.
function acordar(estado, agora) {
  return estado.fase === FASES.PREPARACAO ? estado : reducerDoTreino(estado, { tipo: ACOES.TIQUE, agora: agora() });
}

/**
 * Máquina do treino ativo ligada ao relógio, ao localStorage e à vibração.
 * `estadoInicial` vem de criarEstadoInicial(treino) ou de restaurarTreino(storage, usuarioId).
 * Devolve o estado, `despachar(tipo, extra)` (o instante atual entra sozinho), `iniciar()`, `finalizar()`
 * (corpo do POST /sessoes, sempre com o mesmo id_cliente), `limpar()` e os segundos derivados do estado.
 */
export function useTreinoAtivo({ estadoInicial, usuarioId, storage, agora = Date.now, gerarId = gerarIdCliente }) {
  const [estado, despacharAcao] = useReducer(reducerDoTreino, estadoInicial, (inicial) => acordar(inicial, agora));
  const [persistivel] = useState(() => storageFunciona(storage));
  const anterior = useRef(estadoInicial);

  const precisaRelogio = (estado.fase === FASES.EXERCICIO && !estado.pausado) || estado.fase === FASES.DESCANSO;
  useEffect(() => {
    if (!precisaRelogio) return undefined;
    const id = setInterval(() => despacharAcao({ tipo: ACOES.TIQUE, agora: agora() }), 1000);
    return () => clearInterval(id);
  }, [precisaRelogio, agora]);

  useEffect(() => {
    const antes = anterior.current;
    if (antes === estado) return;
    anterior.current = estado;
    if (deveVibrar(antes, estado)) vibrar();
    if (precisaGravar(antes, estado)) salvarTreino(storage, usuarioId, estado);
  }, [estado, storage, usuarioId]);

  const despachar = useCallback((tipo, extra = {}) => despacharAcao({ tipo, agora: agora(), ...extra }), [agora]);

  const iniciar = useCallback(() => despacharAcao(criarAcaoIniciar({ agora: agora(), gerarId })), [agora, gerarId]);

  function finalizar() {
    const instante = agora();
    const final = reducerDoTreino(estado, { tipo: ACOES.FINALIZAR, agora: instante });
    const envio = prepararEnvio(final, gerarId);
    if (envio.estado !== final) despacharAcao({ tipo: ACOES.DEFINIR_ID_CLIENTE, id_cliente: envio.estado.id_cliente });
    despacharAcao({ tipo: ACOES.FINALIZAR, agora: instante });
    return envio.corpo;
  }

  const limpar = useCallback(() => limparTreino(storage, usuarioId), [storage, usuarioId]);

  return {
    estado,
    despachar,
    iniciar,
    finalizar,
    limpar,
    persistivel,
    segundosDaSerie: selecionarSegundosDaSerie(estado),
    segundosAtivos: selecionarSegundosAtivos(estado),
    segundosDeDescanso: selecionarSegundosDeDescanso(estado),
  };
}
