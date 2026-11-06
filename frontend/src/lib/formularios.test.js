import { describe, expect, it, vi } from 'vitest';
import { aplicarErrosDaApi } from './formularios.js';

function erroDaApi(status, corpo) {
  return { response: { status, data: corpo, headers: {} } };
}

describe('aplicarErrosDaApi', () => {
  it('num 422 aplica a primeira mensagem de cada campo, foca o primeiro e devolve true', () => {
    const setError = vi.fn();
    const erro = erroDaApi(422, {
      message: 'O e-mail já está em uso.',
      errors: { email: ['O e-mail já está em uso.', 'Outra mensagem.'], nome: ['Informe seu nome.'] },
      request_id: 'abc-123',
    });

    expect(aplicarErrosDaApi(erro, setError)).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'email',
      { type: 'server', message: 'O e-mail já está em uso.' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenNthCalledWith(
      2,
      'nome',
      { type: 'server', message: 'Informe seu nome.' },
      { shouldFocus: false },
    );
  });

  it('aceita a mensagem do campo como string e campos aninhados com ponto', () => {
    const setError = vi.fn();
    const erro = erroDaApi(422, { message: 'x', errors: { 'etapas.0.nome': 'Informe o nome da etapa.' } });
    expect(aplicarErrosDaApi(erro, setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith(
      'etapas.0.nome',
      { type: 'server', message: 'Informe o nome da etapa.' },
      { shouldFocus: true },
    );
  });

  it('422 sem errors por campo devolve false e não chama setError', () => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erroDaApi(422, { message: 'Inválido.', request_id: 'r' }), setError)).toBe(false);
    expect(aplicarErrosDaApi(erroDaApi(422, { message: 'Inválido.', errors: {} }), setError)).toBe(false);
    expect(aplicarErrosDaApi(erroDaApi(422, { message: 'Inválido.', errors: { email: [] } }), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it('outros status e erro de rede devolvem false', () => {
    const setError = vi.fn();
    expect(aplicarErrosDaApi(erroDaApi(429, { message: 'Muitas tentativas.', request_id: 'r' }), setError)).toBe(false);
    expect(aplicarErrosDaApi(erroDaApi(500, { message: 'Erro.', errors: { email: ['x'] } }), setError)).toBe(false);
    expect(aplicarErrosDaApi(new Error('Network Error'), setError)).toBe(false);
    expect(aplicarErrosDaApi(undefined, setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
