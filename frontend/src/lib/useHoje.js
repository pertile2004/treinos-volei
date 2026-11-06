import { useEffect, useState } from 'react';
import { dataLocal } from './datas.js';

// De minuto em minuto basta: a data só muda na virada do dia.
const INTERVALO_MS = 60_000;

/** Dia de hoje em São Paulo (AAAA-MM-DD). Acompanha a virada do dia enquanto a tela fica aberta. */
export function useHoje() {
  const [hoje, setHoje] = useState(() => dataLocal(Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const atual = dataLocal(Date.now());
      setHoje((anterior) => (anterior === atual ? anterior : atual));
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return hoje;
}
