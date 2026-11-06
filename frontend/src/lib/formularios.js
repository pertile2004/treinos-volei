/**
 * Aplica no formulário (React Hook Form) os erros por campo de uma resposta 422 da API
 * (`{ message, errors: { campo: ['mensagem'] }, request_id }`), com as mensagens em pt-BR que a API já manda.
 * Devolve true quando tratou um 422 com `errors` por campo; false nos demais casos (quem usa mostra o erro geral).
 * `setError` é o do useForm, ou uma função com a mesma assinatura (campo, erro, opcoes).
 */
export function aplicarErrosDaApi(erro, setError) {
  const resposta = erro?.response;
  const erros = resposta?.data?.errors;
  if (resposta?.status !== 422 || !erros || typeof erros !== 'object') return false;

  const entradas = Object.entries(erros);
  if (entradas.length === 0) return false;

  entradas.forEach(([campo, mensagens], indice) => {
    const mensagem = Array.isArray(mensagens) ? mensagens[0] : mensagens;
    setError(campo, { type: 'server', message: String(mensagem) }, { shouldFocus: indice === 0 });
  });
  return true;
}
