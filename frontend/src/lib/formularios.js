/**
 * Leva os erros de validação da API (422, `errors: { campo: [mensagens] }`) para os campos do React Hook Form.
 * Devolve true quando aplicou pelo menos um erro; false para qualquer outro erro (quem chamou mostra a mensagem geral).
 */
export function aplicarErrosDaApi(erro, setError) {
  const resposta = erro?.response;
  if (resposta?.status !== 422) return false;
  const erros = resposta.data?.errors;
  if (!erros || typeof erros !== 'object') return false;

  let aplicou = false;
  for (const [campo, mensagens] of Object.entries(erros)) {
    const mensagem = Array.isArray(mensagens) ? mensagens[0] : mensagens;
    if (typeof mensagem !== 'string' || mensagem === '') continue;
    setError(campo, { type: 'server', message: mensagem });
    aplicou = true;
  }
  return aplicou;
}
