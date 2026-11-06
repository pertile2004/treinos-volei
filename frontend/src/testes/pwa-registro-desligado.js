import { useState } from 'react';

/**
 * Substituto de `virtual:pwa-register/react` nos testes (alias em vite.config.js > test.alias): o mesmo registro
 * vazio que o vite-plugin-pwa entrega em dev. O runner do Vitest no Windows não carrega o id virtual do plugin.
 */
export function useRegisterSW() {
  const needRefresh = useState(false);
  const offlineReady = useState(false);
  return { needRefresh, offlineReady, updateServiceWorker: async () => {} };
}
