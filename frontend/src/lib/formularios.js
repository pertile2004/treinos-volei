/**
 * Leva os erros de validação da API (422 com `errors` por campo, formato do docs/API.md) para os campos do
 * React Hook Form. Devolve true quando tratou o erro: a tela não precisa mostrar uma mensagem geral.
 * A primeira mensagem de cada campo é usada e o primeiro campo com erro recebe o foco.
 */
export function aplicarErrosDaApi(erro, setError) {
  const resposta = erro?.response;
  const errors = resposta?.data?.errors;
  if (resposta?.status !== 422 || !errors || typeof errors !== 'object') return false;

  const campos = Object.entries(errors)
    .map(([campo, mensagens]) => [campo, Array.isArray(mensagens) ? mensagens[0] : mensagens])
    .filter(([, mensagem]) => typeof mensagem === 'string' && mensagem !== '');
  if (campos.length === 0) return false;

  campos.forEach(([campo, mensagem], indice) => {
    setError(campo, { type: 'server', message: mensagem }, { shouldFocus: indice === 0 });
  });
  return true;
}
