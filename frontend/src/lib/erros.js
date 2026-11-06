const SEM_CONEXAO = 'Não foi possível conectar ao servidor. Confira sua conexão e tente de novo.';
const ERRO_GENERICO = 'Algo deu errado. Tente de novo em instantes.';

export function descreverErro(erro) {
  const resposta = erro?.response;
  const corpo = resposta?.data;
  const mensagemDaApi = typeof corpo?.message === 'string' && corpo.message !== '' ? corpo.message : null;
  return {
    status: resposta?.status ?? null,
    mensagem: mensagemDaApi ?? (resposta ? ERRO_GENERICO : SEM_CONEXAO),
    requestId:
      corpo?.request_id ?? resposta?.headers?.['x-request-id'] ?? erro?.config?.headers?.get?.('X-Request-Id') ?? null,
  };
}
