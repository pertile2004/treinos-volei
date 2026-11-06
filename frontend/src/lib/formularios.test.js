import { describe, expect, it, vi } from 'vitest';
import { aplicarErrosDaApi } from './formularios.js';

function erroHttp(status, data) {
  return { response: { status, data, headers: {} } };
}

describe('aplicarErrosDaApi', () => {
  it('aplica a primeira mensagem de cada campo de um 422 e devolve true', () => {
    const setError = vi.fn();
    const erro = erroHttp(422, {
      message: 'O campo nome é obrigatório. (e mais 1 erro)',
      errors: {
        nome: ['O campo nome é obrigatório.', 'O campo nome deve ter no máximo 120 caracteres.'],
        'itens.0.exercicio_id': ['O exercício selecionado é inválido.'],
      },
      request_id: 'req-422',
    });
    expect(aplicarErrosDaApi(erro, setError)).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'nome',
      { type: 'server', message: 'O campo nome é obrigatório.' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenNthCalledWith(
      2,
      'itens.0.exercicio_id',
      { type: 'server', message: 'O exercício selecionado é inválido.' },
      { shouldFocus: false },
    );
  });

  it('aceita mensagem em texto simples no lugar da lista', () => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erroHttp(422, { errors: { nivel: 'Nível inválido.' } }), setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith(
      'nivel',
      { type: 'server', message: 'Nível inválido.' },
      { shouldFocus: true },
    );
  });

  it('devolve false em 422 sem errors por campo, sem chamar setError', () => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erroHttp(422, { message: 'Inválido.' }), setError)).toBe(false);
    expect(aplicarErrosDaApi(erroHttp(422, { message: 'Inválido.', errors: {} }), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it.each([
    ['500', erroHttp(500, { message: 'Erro interno do servidor.', errors: { nome: ['x'] } })],
    ['401', erroHttp(401, { message: 'Não autenticado.' })],
    ['sem resposta', { message: 'Network Error' }],
    ['nulo', null],
  ])('devolve false para %s', (_, erro) => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erro, setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
