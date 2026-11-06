import { useState } from 'react';
import { descreverErro } from '../lib/erros.js';
import Botao from './Botao.jsx';

const COPIADO = 'Código copiado.';
const NAO_COPIADO = 'Não foi possível copiar. Selecione o código e copie manualmente.';

/**
 * Erro de uma consulta ou envio. O request_id (o mesmo X-Request-Id enviado ao servidor e gravado no log)
 * aparece como código para o usuário reportar, com botão para copiar. O botão fica fora do `role="alert"`,
 * que só carrega o texto anunciado; o resultado da cópia é anunciado em `aria-live="polite"`.
 */
export default function MensagemDeErro({ erro, mensagem, aoTentarDeNovo }) {
  const descricao = descreverErro(erro);
  const [aviso, setAviso] = useState('');

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(descricao.requestId);
      setAviso(COPIADO);
    } catch {
      setAviso(NAO_COPIADO);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        role="alert"
        className="flex w-full flex-col items-start gap-2 rounded-cartao border border-perigo bg-superficie p-4"
      >
        <p>{mensagem ?? descricao.mensagem}</p>
        {descricao.requestId && (
          <p className="text-sm text-texto-secundario">
            Código do erro: <code className="select-all text-texto">{descricao.requestId}</code>. Se o problema
            continuar, informe este código ao suporte.
          </p>
        )}
        {aoTentarDeNovo && (
          <button
            type="button"
            onClick={aoTentarDeNovo}
            className="min-h-11 rounded-botao bg-primaria px-4 font-bold text-sobre-primaria"
          >
            Tentar de novo
          </button>
        )}
      </div>
      {descricao.requestId && (
        <>
          <Botao variante="secundario" onClick={copiarCodigo}>
            Copiar código
          </Botao>
          <p aria-live="polite" className="min-h-5 text-sm text-texto-secundario">
            {aviso}
          </p>
        </>
      )}
    </div>
  );
}
