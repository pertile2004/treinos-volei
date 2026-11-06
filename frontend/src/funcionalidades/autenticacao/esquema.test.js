import { describe, expect, it } from 'vitest';
import { esquemaCadastro } from './esquema.js';

const VALIDO = {
  nome: 'Ana Souza',
  email: 'ana@example.com',
  password: 'segredo123',
  password_confirmation: 'segredo123',
  papel: 'jogador',
  aceite_termos: true,
};

function mensagens(dados) {
  const resultado = esquemaCadastro.safeParse(dados);
  if (resultado.success) return {};
  return Object.fromEntries(resultado.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
}

describe('esquemaCadastro', () => {
  it('aceita o cadastro válido e apara espaços do nome e do e-mail', () => {
    const resultado = esquemaCadastro.safeParse({ ...VALIDO, nome: '  Ana Souza ', email: ' ana@example.com ' });
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual(VALIDO);
  });

  it('aceita o papel treinador e recusa admin', () => {
    expect(esquemaCadastro.safeParse({ ...VALIDO, papel: 'treinador' }).success).toBe(true);
    expect(mensagens({ ...VALIDO, papel: 'admin' })).toEqual({ papel: 'Escolha se você é jogador ou treinador' });
  });

  it('exige nome de 2 a 100 caracteres', () => {
    expect(mensagens({ ...VALIDO, nome: '' }).nome).toBe('Informe seu nome (mínimo de 2 caracteres)');
    expect(mensagens({ ...VALIDO, nome: 'A' }).nome).toBe('Informe seu nome (mínimo de 2 caracteres)');
    expect(mensagens({ ...VALIDO, nome: 'a'.repeat(101) }).nome).toBe('O nome pode ter no máximo 100 caracteres');
    expect(mensagens({ ...VALIDO, nome: 'a'.repeat(100) }).nome).toBeUndefined();
  });

  it('exige e-mail válido', () => {
    expect(mensagens({ ...VALIDO, email: '' }).email).toBe('Informe um e-mail válido');
    expect(mensagens({ ...VALIDO, email: 'ana@' }).email).toBe('Informe um e-mail válido');
  });

  it('exige senha com no mínimo 8 caracteres e confirmação igual', () => {
    expect(mensagens({ ...VALIDO, password: 'abcdefg', password_confirmation: 'abcdefg' })).toEqual({
      password: 'A senha precisa ter no mínimo 8 caracteres',
    });
    expect(mensagens({ ...VALIDO, password_confirmation: 'segredo124' })).toEqual({
      password_confirmation: 'As senhas não conferem',
    });
  });

  it('exige o aceite dos termos', () => {
    expect(mensagens({ ...VALIDO, aceite_termos: false })).toEqual({ aceite_termos: 'Você precisa aceitar os termos' });
  });
});
