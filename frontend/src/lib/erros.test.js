import { AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { descreverErro } from './erros.js';

const SEM_CONEXAO = 'Não foi possível conectar ao servidor. Confira sua conexão e tente de novo.';
const GENERICA = 'Algo deu errado. Tente de novo em instantes.';

function configComId(id) {
  return { headers: new AxiosHeaders({ 'X-Request-Id': id }) };
}

describe('descreverErro', () => {
  it('usa a mensagem e o request_id do corpo da resposta', () => {
    const erro = {
      config: configComId('id-enviado'),
      response: {
        status: 503,
        data: { message: 'Banco de dados indisponível.', request_id: 'id-do-corpo' },
        headers: { 'x-request-id': 'id-do-header' },
      },
    };
    expect(descreverErro(erro)).toEqual({
      status: 503,
      mensagem: 'Banco de dados indisponível.',
      requestId: 'id-do-corpo',
    });
  });

  it('sem request_id no corpo usa o header da resposta e a mensagem generica', () => {
    const erro = {
      config: configComId('id-enviado'),
      response: { status: 500, data: '<html>erro</html>', headers: { 'x-request-id': 'id-do-header' } },
    };
    expect(descreverErro(erro)).toEqual({ status: 500, mensagem: GENERICA, requestId: 'id-do-header' });
  });

  it('sem resposta avisa da conexao e usa o id enviado', () => {
    const erro = { config: configComId('id-enviado') };
    expect(descreverErro(erro)).toEqual({ status: null, mensagem: SEM_CONEXAO, requestId: 'id-enviado' });
  });

  it('sem nenhum id devolve requestId nulo', () => {
    expect(descreverErro(new Error('falhou'))).toEqual({ status: null, mensagem: SEM_CONEXAO, requestId: null });
    expect(descreverErro({ response: { status: 500, data: {}, headers: {} } })).toEqual({
      status: 500,
      mensagem: GENERICA,
      requestId: null,
    });
  });
});
