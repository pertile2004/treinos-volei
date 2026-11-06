import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import AvisoNovaVersao from '../componentes/AvisoNovaVersao.jsx';

/**
 * Registra o service worker e mostra o AvisoNovaVersao quando há uma versão nova esperando.
 * O módulo virtual vem do vite-plugin-pwa: no build de produção registra /sw.js; em dev e nos testes é vazio.
 * "Atualizar" manda o service worker novo assumir (skipWaiting) e a página recarrega quando ele passa a controlar.
 */
export default function AtualizacaoDoApp() {
  const [atualizando, setAtualizando] = useState(false);
  const {
    needRefresh: [novaVersao, setNovaVersao],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(erro) {
      console.error('Não foi possível registrar o service worker.', erro);
    },
  });

  function atualizar() {
    setAtualizando(true);
    updateServiceWorker(true);
  }

  return (
    <AvisoNovaVersao
      aberto={novaVersao}
      atualizando={atualizando}
      aoAtualizar={atualizar}
      aoAdiar={() => setNovaVersao(false)}
    />
  );
}
