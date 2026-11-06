import { useCallback, useSyncExternalStore } from 'react';

const temMatchMedia = () => typeof window.matchMedia === 'function';

/**
 * Diz se a janela tem pelo menos `pixels` de largura e acompanha a mudança.
 * Sem `matchMedia` (jsdom, navegador muito antigo), devolve `false`: vale o layout de celular.
 */
export function useLarguraMinima(pixels) {
  const consulta = `(min-width: ${pixels}px)`;

  const assinar = useCallback(
    (avisar) => {
      if (!temMatchMedia()) return () => {};
      const lista = window.matchMedia(consulta);
      lista.addEventListener('change', avisar);
      return () => lista.removeEventListener('change', avisar);
    },
    [consulta],
  );

  return useSyncExternalStore(assinar, () => (temMatchMedia() ? window.matchMedia(consulta).matches : false));
}
