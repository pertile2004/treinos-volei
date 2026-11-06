import { describe, expect, it } from 'vitest';
import { esquemaDoTreino, visibilidadesDoPapel } from './esquema.js';

const NIVEIS = ['iniciante', 'intermediario', 'avancado'];

function validar(valores, opcoes = { niveis: NIVEIS }) {
  const resultado = esquemaDoTreino(opcoes).safeParse(valores);
  if (resultado.success) return { ok: true, dados: resultado.data, erros: {} };
  const erros = {};
  resultado.error.issues.forEach((issue) => {
    const campo = issue.path.join('.');
    erros[campo] ??= issue.message;
  });
  return { ok: false, erros };
}

const valido = { nome: 'Recepção e saque', descricao: '', nivel: 'intermediario', visibilidade: 'privado' };

describe('esquemaDoTreino', () => {
  it('aceita os campos do cabeçalho válidos e devolve nome e descrição sem espaços nas pontas', () => {
    const { ok, dados } = validar({ ...valido, nome: '  Terça  ', descricao: '  Passe  ' });
    expect(ok).toBe(true);
    expect(dados).toEqual({ nome: 'Terça', descricao: 'Passe', nivel: 'intermediario', visibilidade: 'privado' });
  });

  it('nome é obrigatório e tem no máximo 120 caracteres', () => {
    expect(validar({ ...valido, nome: '' }).erros.nome).toBe('Informe o nome do treino.');
    expect(validar({ ...valido, nome: '   ' }).erros.nome).toBe('Informe o nome do treino.');
    expect(validar({ ...valido, nome: 'a'.repeat(120) }).ok).toBe(true);
    expect(validar({ ...valido, nome: 'a'.repeat(121) }).erros.nome).toBe('O nome pode ter no máximo 120 caracteres.');
  });

  it('descrição é opcional e tem no máximo 2000 caracteres', () => {
    expect(validar({ ...valido, descricao: 'a'.repeat(2000) }).ok).toBe(true);
    expect(validar({ ...valido, descricao: 'a'.repeat(2001) }).erros.descricao).toBe(
      'A descrição pode ter no máximo 2000 caracteres.',
    );
  });

  it('nível é obrigatório e precisa estar na lista do GET /referencias', () => {
    expect(validar({ ...valido, nivel: '' }).erros.nivel).toBe('Escolha o nível do treino.');
    expect(validar({ ...valido, nivel: 'mestre' }).erros.nivel).toBe('Nível inválido.');
    expect(validar({ ...valido, nivel: 'mestre' }, {}).ok).toBe(true);
  });

  it('visibilidade é obrigatória e precisa ser conhecida', () => {
    expect(validar({ ...valido, visibilidade: '' }).erros.visibilidade).toBe('Escolha a visibilidade do treino.');
    expect(validar({ ...valido, visibilidade: 'secreto' }).erros.visibilidade).toBe('Visibilidade inválida.');
  });

  it.each([
    ['jogador', 'privado', true],
    ['jogador', 'atletas', false],
    ['jogador', 'publico', false],
    ['treinador', 'privado', true],
    ['treinador', 'atletas', true],
    ['treinador', 'publico', false],
    ['admin', 'privado', true],
    ['admin', 'atletas', true],
    ['admin', 'publico', true],
    [undefined, 'publico', true],
  ])('papel %s com visibilidade %s: permitido = %s', (papel, visibilidade, permitido) => {
    const { ok, erros } = validar({ ...valido, visibilidade }, { papel, niveis: NIVEIS });
    expect(ok).toBe(permitido);
    if (!permitido) expect(erros.visibilidade).toBe('Seu perfil não pode usar esta visibilidade.');
  });
});

describe('visibilidadesDoPapel', () => {
  it('devolve as opções do papel e, sem papel conhecido, todas', () => {
    expect(visibilidadesDoPapel('jogador')).toEqual(['privado']);
    expect(visibilidadesDoPapel('treinador')).toEqual(['privado', 'atletas']);
    expect(visibilidadesDoPapel('admin')).toEqual(['privado', 'atletas', 'publico']);
    expect(visibilidadesDoPapel(undefined)).toEqual(['privado', 'atletas', 'publico']);
  });
});
