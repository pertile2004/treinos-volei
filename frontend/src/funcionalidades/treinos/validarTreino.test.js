import { describe, expect, it } from 'vitest';
import { validarTreino } from './validarTreino.js';

function item(mudancas = {}) {
  return {
    chave: 1,
    etapa: 'tecnica',
    ordem: 1,
    exercicio: { id: 15, nome: 'Recepção em manchete', fundamento: 'recepcao', removido: false },
    series: 3,
    repeticoes: 10,
    duracao_segundos: null,
    descanso_segundos: 45,
    ...mudancas,
  };
}

function treino(mudancas = {}) {
  return {
    nome: 'Recepção e saque',
    descricao: '',
    nivel: 'intermediario',
    visibilidade: 'privado',
    itens: [item()],
    proximaChave: 2,
    ...mudancas,
  };
}

describe('validarTreino', () => {
  it('treino válido não tem erros', () => {
    expect(validarTreino(treino())).toEqual({});
  });

  it('nome é obrigatório (vazio ou só espaços)', () => {
    expect(validarTreino(treino({ nome: '' })).nome).toBe('Informe o nome do treino.');
    expect(validarTreino(treino({ nome: '   ' })).nome).toBe('Informe o nome do treino.');
  });

  it('nome tem no máximo 120 caracteres', () => {
    expect(validarTreino(treino({ nome: 'a'.repeat(120) }))).toEqual({});
    expect(validarTreino(treino({ nome: 'a'.repeat(121) })).nome).toBe('O nome pode ter no máximo 120 caracteres.');
  });

  it('descrição é opcional e tem no máximo 2000 caracteres', () => {
    expect(validarTreino(treino({ descricao: null }))).toEqual({});
    expect(validarTreino(treino({ descricao: 'a'.repeat(2000) }))).toEqual({});
    expect(validarTreino(treino({ descricao: 'a'.repeat(2001) })).descricao).toBe(
      'A descrição pode ter no máximo 2000 caracteres.',
    );
  });

  it('nível é obrigatório e, com a lista de níveis, precisa estar nela', () => {
    expect(validarTreino(treino({ nivel: '' })).nivel).toBe('Escolha o nível do treino.');
    const niveis = ['iniciante', 'intermediario', 'avancado'];
    expect(validarTreino(treino(), { niveis })).toEqual({});
    expect(validarTreino(treino({ nivel: 'mestre' }), { niveis }).nivel).toBe('Nível inválido.');
  });

  it('visibilidade é obrigatória e precisa ser conhecida', () => {
    expect(validarTreino(treino({ visibilidade: '' })).visibilidade).toBe('Escolha a visibilidade do treino.');
    expect(validarTreino(treino({ visibilidade: 'secreto' })).visibilidade).toBe('Visibilidade inválida.');
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
  ])('papel %s com visibilidade %s: permitido = %s', (papel, visibilidade, permitido) => {
    const erros = validarTreino(treino({ visibilidade }), { papel });
    expect(erros.visibilidade).toBe(permitido ? undefined : 'Seu perfil não pode usar esta visibilidade.');
  });

  it('precisa de pelo menos 1 item', () => {
    expect(validarTreino(treino({ itens: [] })).itens).toBe('Adicione pelo menos um exercício.');
  });

  it('aceita 30 itens e recusa 31', () => {
    const trinta = Array.from({ length: 30 }, (_, i) => item({ chave: i + 1, ordem: i + 1 }));
    expect(validarTreino(treino({ itens: trinta }))).toEqual({});
    const trintaEUm = [...trinta, item({ chave: 31, ordem: 31 })];
    expect(validarTreino(treino({ itens: trintaEUm })).itens).toBe('O treino pode ter no máximo 30 exercícios.');
  });

  it('cada item precisa de repetições ou duração', () => {
    const erros = validarTreino(treino({ itens: [item({ repeticoes: null })] }));
    expect(erros).toEqual({
      'itens.0.repeticoes': 'Informe as repetições ou a duração.',
      'itens.0.duracao_segundos': 'Informe as repetições ou a duração.',
    });
  });

  it('aceita só duração e aceita os dois preenchidos', () => {
    expect(validarTreino(treino({ itens: [item({ repeticoes: null, duracao_segundos: 60 })] }))).toEqual({});
    expect(validarTreino(treino({ itens: [item({ duracao_segundos: 60 })] }))).toEqual({});
  });

  it.each([
    ['series', 0, 'As séries devem ficar entre 1 e 10.'],
    ['series', 11, 'As séries devem ficar entre 1 e 10.'],
    ['series', null, 'As séries devem ficar entre 1 e 10.'],
    ['series', 2.5, 'As séries devem ficar entre 1 e 10.'],
    ['repeticoes', 0, 'As repetições devem ficar entre 1 e 100.'],
    ['repeticoes', 101, 'As repetições devem ficar entre 1 e 100.'],
    ['duracao_segundos', 9, 'A duração deve ficar entre 10 e 3600 segundos.'],
    ['duracao_segundos', 3601, 'A duração deve ficar entre 10 e 3600 segundos.'],
    ['descanso_segundos', -1, 'O descanso deve ficar entre 0 e 600 segundos.'],
    ['descanso_segundos', 601, 'O descanso deve ficar entre 0 e 600 segundos.'],
    ['descanso_segundos', null, 'O descanso deve ficar entre 0 e 600 segundos.'],
  ])('limite: %s = %s', (campo, valor, mensagem) => {
    const erros = validarTreino(treino({ itens: [item({ [campo]: valor })] }));
    expect(erros[`itens.0.${campo}`]).toBe(mensagem);
  });

  it.each([
    ['series', 1],
    ['series', 10],
    ['repeticoes', 1],
    ['repeticoes', 100],
    ['duracao_segundos', 10],
    ['duracao_segundos', 3600],
    ['descanso_segundos', 0],
    ['descanso_segundos', 600],
  ])('borda aceita: %s = %s', (campo, valor) => {
    expect(validarTreino(treino({ itens: [item({ [campo]: valor })] }))).toEqual({});
  });

  it('a chave do erro usa a posição do item na lista (a mesma do corpo e do 422)', () => {
    const itens = [item(), item({ chave: 2, ordem: 2, series: 99 })];
    expect(validarTreino(treino({ itens }))).toEqual({
      'itens.1.series': 'As séries devem ficar entre 1 e 10.',
    });
  });

  it('item sem exercício ou com etapa desconhecida', () => {
    const erros = validarTreino(treino({ itens: [item({ exercicio: null }), item({ etapa: 'alongamento' })] }));
    expect(erros['itens.0.exercicio_id']).toBe('Exercício inválido.');
    expect(erros['itens.1.etapa']).toBe('Etapa inválida.');
  });

  it('junta os erros de vários campos', () => {
    const erros = validarTreino(treino({ nome: '', nivel: '', itens: [] }));
    expect(Object.keys(erros).sort()).toEqual(['itens', 'nivel', 'nome']);
  });
});
