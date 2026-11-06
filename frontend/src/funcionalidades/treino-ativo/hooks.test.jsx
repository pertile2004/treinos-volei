import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chaveDoTreinoAtivo } from './armazenamentoDoTreino.js';
import { T0, criarStorageFalso, estadoIniciado, estadoNoResumo, seg, treinoDeExemplo } from './apoioDeTeste.js';
import { useTreinoAtivo } from './hooks.js';
import { ACOES, FASES, criarEstadoInicial } from './maquinaDoTreino.js';

const USUARIO = 'u1';

function montar(estadoInicial, extras = {}) {
  const storage = criarStorageFalso();
  const resultado = renderHook(() =>
    useTreinoAtivo({ estadoInicial, usuarioId: USUARIO, storage, gerarId: () => 'id-gerado', ...extras }),
  );
  return { storage, ...resultado };
}

const lerSalvo = (storage) => JSON.parse(storage.getItem(chaveDoTreinoAtivo(USUARIO)));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useTreinoAtivo', () => {
  it('começa na preparação sem gravar nada e sem relógio', () => {
    const { result, storage } = montar(criarEstadoInicial(treinoDeExemplo()));
    expect(result.current.estado.fase).toBe(FASES.PREPARACAO);
    act(() => vi.advanceTimersByTime(5000));
    expect(storage.tamanho).toBe(0);
    expect(result.current.persistivel).toBe(true);
  });

  it('INICIAR gera o id_cliente, grava no storage e o relógio da série anda a cada segundo', () => {
    const { result, storage } = montar(criarEstadoInicial(treinoDeExemplo()));
    act(() => result.current.iniciar());
    expect(result.current.estado.fase).toBe(FASES.EXERCICIO);
    expect(result.current.estado.id_cliente).toBe('id-gerado');
    expect(result.current.estado.iniciada_em).toBe(new Date(T0).toISOString());
    expect(lerSalvo(storage).id_cliente).toBe('id-gerado');

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.segundosDaSerie).toBe(3);
    expect(result.current.segundosAtivos).toBe(3);
  });

  it('cada ação grava o estado; o tique que só adianta o relógio não regrava', () => {
    const { result, storage } = montar(estadoIniciado());
    const antes = storage.getItem(chaveDoTreinoAtivo(USUARIO));
    act(() => vi.advanceTimersByTime(2000));
    expect(storage.getItem(chaveDoTreinoAtivo(USUARIO))).toBe(antes);

    act(() => result.current.despachar(ACOES.MAIS_ACERTO));
    expect(lerSalvo(storage).atual.acertos).toBe(1);
    act(() => result.current.despachar(ACOES.MAIS_ERRO));
    act(() => result.current.despachar(ACOES.DESFAZER));
    expect(lerSalvo(storage).atual).toMatchObject({ acertos: 1, erros: 0 });
  });

  it('pausar congela o tempo ativo e continuar retoma', () => {
    const { result } = montar(estadoIniciado());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.despachar(ACOES.PAUSAR));
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.estado.pausado).toBe(true);
    expect(result.current.segundosDaSerie).toBe(2);
    act(() => result.current.despachar(ACOES.RETOMAR));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.segundosDaSerie).toBe(3);
  });

  it('o descanso conta sozinho até zerar e avança para a próxima série', () => {
    const { result } = montar(estadoIniciado());
    act(() => result.current.despachar(ACOES.CONCLUIR_SERIE));
    expect(result.current.estado.fase).toBe(FASES.DESCANSO);
    expect(result.current.segundosDeDescanso).toBe(45);
    act(() => vi.advanceTimersByTime(44_000));
    expect(result.current.estado.fase).toBe(FASES.DESCANSO);
    expect(result.current.segundosDeDescanso).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.estado.fase).toBe(FASES.EXERCICIO);
    expect(result.current.estado.serie_atual).toBe(2);
  });

  it('+15 s soma 15 ao descanso e Pular avança na hora', () => {
    const { result } = montar(estadoIniciado());
    act(() => result.current.despachar(ACOES.CONCLUIR_SERIE));
    act(() => result.current.despachar(ACOES.MAIS_15));
    expect(result.current.segundosDeDescanso).toBe(60);
    act(() => result.current.despachar(ACOES.PULAR));
    expect(result.current.estado.fase).toBe(FASES.EXERCICIO);
    expect(result.current.estado.serie_atual).toBe(2);
  });

  it('vibra no fim da contagem só com a opção ligada e com suporte do navegador', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, vibrate });

    const semOpcao = montar(estadoIniciado());
    act(() => semOpcao.result.current.despachar(ACOES.CONCLUIR_SERIE));
    act(() => vi.advanceTimersByTime(45_000));
    expect(semOpcao.result.current.estado.fase).toBe(FASES.EXERCICIO);
    expect(vibrate).not.toHaveBeenCalled();
    semOpcao.unmount();

    const comOpcao = montar(estadoIniciado());
    act(() => comOpcao.result.current.despachar(ACOES.ALTERNAR_VIBRAR));
    act(() => comOpcao.result.current.despachar(ACOES.CONCLUIR_SERIE));
    act(() => vi.advanceTimersByTime(45_000));
    expect(vibrate).toHaveBeenCalledTimes(1);

    // Pular não é fim de contagem: não vibra.
    act(() => comOpcao.result.current.despachar(ACOES.CONCLUIR_SERIE));
    act(() => comOpcao.result.current.despachar(ACOES.PULAR));
    expect(vibrate).toHaveBeenCalledTimes(1);
    comOpcao.unmount();

    vi.stubGlobal('navigator', { ...navigator, vibrate: undefined });
    const semSuporte = montar(estadoIniciado());
    act(() => semSuporte.result.current.despachar(ACOES.ALTERNAR_VIBRAR));
    act(() => semSuporte.result.current.despachar(ACOES.CONCLUIR_SERIE));
    expect(() => act(() => vi.advanceTimersByTime(45_000))).not.toThrow();
    expect(semSuporte.result.current.estado.fase).toBe(FASES.EXERCICIO);
  });

  it('ao restaurar, um descanso já vencido avança sozinho e o exercício em andamento continua contando', () => {
    const emDescanso = montar(estadoIniciado());
    act(() => emDescanso.result.current.despachar(ACOES.CONCLUIR_SERIE));
    const salvo = lerSalvo(emDescanso.storage);
    emDescanso.unmount();

    vi.setSystemTime(seg(120));
    const retomado = montar(salvo);
    expect(retomado.result.current.estado.fase).toBe(FASES.EXERCICIO);
    expect(retomado.result.current.estado.serie_atual).toBe(2);
    expect(retomado.result.current.segundosDaSerie).toBe(0);
    retomado.unmount();

    vi.setSystemTime(T0);
    const emExercicio = montar(estadoIniciado());
    act(() => vi.advanceTimersByTime(5000));
    act(() => emExercicio.result.current.despachar(ACOES.MAIS_ACERTO));
    const salvoNoExercicio = lerSalvo(emExercicio.storage);
    emExercicio.unmount();

    vi.setSystemTime(seg(30));
    const voltou = montar(salvoNoExercicio);
    expect(voltou.result.current.segundosDaSerie).toBe(30);
    expect(voltou.result.current.estado.atual.acertos).toBe(1);
  });

  it('finalizar monta o corpo do POST com o mesmo id_cliente em todas as tentativas', () => {
    vi.setSystemTime(seg(300));
    const { result, storage } = montar(estadoNoResumo());
    let corpo;
    act(() => {
      corpo = result.current.finalizar();
    });
    expect(corpo).toMatchObject({
      id_cliente: 'id-do-teste',
      origem: 'cronometro',
      treino_id: 12,
      iniciada_em: new Date(T0).toISOString(),
      finalizada_em: new Date(seg(300)).toISOString(),
      duracao_segundos: 185,
      observacao: null,
    });
    expect(corpo.series).toHaveLength(3);
    expect(corpo.series[0]).toEqual({
      exercicio_id: 5,
      numero: 1,
      repeticoes: 10,
      acertos: 2,
      erros: 1,
      duracao_segundos: 95,
    });
    expect(lerSalvo(storage).finalizada_em).toBe(new Date(seg(300)).toISOString());

    vi.setSystemTime(seg(400));
    let segundoCorpo;
    act(() => {
      segundoCorpo = result.current.finalizar();
    });
    expect(segundoCorpo).toEqual(corpo);
  });

  it('finalizar gera o id_cliente se o estado restaurado veio sem ele', () => {
    const semId = { ...estadoNoResumo(), id_cliente: null };
    const { result } = montar(semId);
    let corpo;
    act(() => {
      corpo = result.current.finalizar();
    });
    expect(corpo.id_cliente).toBe('id-gerado');
    expect(result.current.estado.id_cliente).toBe('id-gerado');
  });

  it('a observação do resumo entra no corpo', () => {
    const { result } = montar(estadoNoResumo());
    act(() => result.current.despachar(ACOES.DEFINIR_OBSERVACAO, { valor: '  Bom treino  ' }));
    let corpo;
    act(() => {
      corpo = result.current.finalizar();
    });
    expect(corpo.observacao).toBe('Bom treino');
  });

  it('sem storage utilizável a tela segue funcionando e avisa que não persiste', () => {
    const quebrado = {
      getItem: () => null,
      setItem: () => {
        throw new Error('cheio');
      },
      removeItem: () => {},
    };
    const { result } = renderHook(() =>
      useTreinoAtivo({ estadoInicial: estadoIniciado(), usuarioId: USUARIO, storage: quebrado }),
    );
    expect(result.current.persistivel).toBe(false);
    act(() => result.current.despachar(ACOES.MAIS_ACERTO));
    expect(result.current.estado.atual.acertos).toBe(1);

    const semStorage = renderHook(() =>
      useTreinoAtivo({ estadoInicial: estadoIniciado(), usuarioId: USUARIO, storage: null }),
    );
    expect(semStorage.result.current.persistivel).toBe(false);
  });

  it('limpar apaga a chave do storage', () => {
    const { result, storage } = montar(estadoIniciado());
    act(() => result.current.despachar(ACOES.MAIS_ACERTO));
    expect(storage.tamanho).toBe(1);
    act(() => result.current.limpar());
    expect(storage.tamanho).toBe(0);
  });
});
