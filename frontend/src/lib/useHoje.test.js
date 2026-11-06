import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHoje } from './useHoje.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useHoje', () => {
  it('devolve o dia de Sao Paulo, nao o dia UTC', () => {
    // 23h30 de 11/11 em São Paulo = 02h30 UTC de 12/11.
    vi.setSystemTime(new Date('2026-11-12T02:30:00Z'));
    const { result } = renderHook(() => useHoje());
    expect(result.current).toBe('2026-11-11');
  });

  it('acompanha a virada do dia enquanto a tela fica aberta', () => {
    vi.setSystemTime(new Date('2026-11-12T02:59:30Z'));
    const { result } = renderHook(() => useHoje());
    expect(result.current).toBe('2026-11-11');
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toBe('2026-11-12');
  });

  it('para de observar ao desmontar', () => {
    vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));
    const { unmount } = renderHook(() => useHoje());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
