import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLarguraMinima } from './useLarguraMinima.js';

// Substituto de window.matchMedia só para o teste: o jsdom não tem matchMedia.
function instalarMatchMedia(inicial) {
  const ouvintes = new Set();
  const lista = {
    matches: inicial,
    addEventListener: vi.fn((tipo, ouvinte) => ouvintes.add(ouvinte)),
    removeEventListener: vi.fn((tipo, ouvinte) => ouvintes.delete(ouvinte)),
  };
  const matchMedia = vi.fn(() => lista);
  vi.stubGlobal('matchMedia', matchMedia);
  return {
    lista,
    matchMedia,
    ouvintes,
    mudarPara(valor) {
      lista.matches = valor;
      for (const ouvinte of [...ouvintes]) ouvinte({ matches: valor });
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('useLarguraMinima', () => {
  it('devolve false quando o navegador não tem matchMedia', () => {
    expect(window.matchMedia).toBeUndefined();
    const { result } = renderHook(() => useLarguraMinima(1024));
    expect(result.current).toBe(false);
  });

  it('devolve true quando a consulta de largura minima casa', () => {
    const { matchMedia } = instalarMatchMedia(true);
    const { result } = renderHook(() => useLarguraMinima(1024));
    expect(result.current).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('devolve false quando a consulta não casa', () => {
    instalarMatchMedia(false);
    const { result } = renderHook(() => useLarguraMinima(1024));
    expect(result.current).toBe(false);
  });

  it('acompanha a mudanca de largura e para de ouvir ao desmontar', () => {
    const midia = instalarMatchMedia(false);
    const { result, unmount } = renderHook(() => useLarguraMinima(1024));
    expect(result.current).toBe(false);
    act(() => midia.mudarPara(true));
    expect(result.current).toBe(true);
    act(() => midia.mudarPara(false));
    expect(result.current).toBe(false);
    expect(midia.lista.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(midia.ouvintes.size).toBe(0);
  });
});
