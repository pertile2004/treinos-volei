import { descreverErro } from '../lib/erros.js';

export default function MensagemDeErro({ erro, mensagem, aoTentarDeNovo }) {
  const descricao = descreverErro(erro);
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-cartao border border-perigo bg-superficie p-4">
      <p>{mensagem ?? descricao.mensagem}</p>
      {descricao.requestId && (
        <p className="text-sm text-texto-secundario">
          Código do erro: <code>{descricao.requestId}</code>
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
  );
}
