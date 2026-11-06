import { describe, expect, it, vi } from 'vitest';
import { aplicarErrosDaApi } from './formularios.js';

function erroHttp(status, data) {
  return { response: { status, data } };
}

describe('aplicarErrosDaApi', () => {
  it('aplica a primeira mensagem de cada campo de um 422 e devolve true', () => {
    const setError = vi.fn();
    const erro = erroHttp(422, {
      message: 'Os dados informados são inválidos.',
      errors: { data: ['A data não pode ser anterior a hoje.', 'Outra.'], hora: ['Hora inválida.'] },
    });
    expect(aplicarErrosDaApi(erro, setError)).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('data', { type: 'server', message: 'A data não pode ser anterior a hoje.' });
    expect(setError).toHaveBeenCalledWith('hora', { type: 'server', message: 'Hora inválida.' });
  });

  it('422 sem errors nao aplica nada e devolve false', () => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erroHttp(422, { message: 'Inválido.' }), setError)).toBe(false);
    expect(aplicarErrosDaApi(erroHttp(422, { message: 'Inválido.', errors: {} }), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it.each([401, 404, 500])('status %s devolve false sem tocar no formulario', (status) => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erroHttp(status, { message: 'x', errors: { a: ['b'] } }), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it('erro sem resposta (sem conexao) devolve false', () => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(new Error('Network Error'), setError)).toBe(false);
    expect(aplicarErrosDaApi(undefined, setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
