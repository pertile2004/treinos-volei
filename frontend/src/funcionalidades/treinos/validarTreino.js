// Validação do estado do montador antes do envio (espelha o contrato do POST /treinos).
// As chaves dos erros são as mesmas do 422 do servidor: nome, nivel, itens, itens.0.series...
// O índice em "itens.N" é a posição do item em estado.itens, igual à posição no corpo enviado.

import { ETAPAS, LIMITES, MAXIMO_DE_ITENS } from './montadorDeTreino.js';

export const NOME_MAXIMO = 120;
export const DESCRICAO_MAXIMA = 2000;

export const VISIBILIDADES = Object.freeze(['privado', 'atletas', 'publico']);

export const VISIBILIDADES_POR_PAPEL = Object.freeze({
  jogador: Object.freeze(['privado']),
  treinador: Object.freeze(['privado', 'atletas']),
  admin: Object.freeze(['privado', 'atletas', 'publico']),
});

const MENSAGENS_DE_LIMITE = Object.freeze({
  series: 'As séries devem ficar entre 1 e 10.',
  repeticoes: 'As repetições devem ficar entre 1 e 100.',
  duracao_segundos: 'A duração deve ficar entre 10 e 3600 segundos.',
  descanso_segundos: 'O descanso deve ficar entre 0 e 600 segundos.',
});

function vazio(valor) {
  return valor === null || valor === undefined || valor === '';
}

function dentroDoLimite(campo, valor) {
  const { minimo, maximo } = LIMITES[campo];
  return Number.isInteger(valor) && valor >= minimo && valor <= maximo;
}

function erroDoNome(nome) {
  const texto = (nome ?? '').trim();
  if (texto === '') {
    return 'Informe o nome do treino.';
  }
  return texto.length > NOME_MAXIMO ? `O nome pode ter no máximo ${NOME_MAXIMO} caracteres.` : null;
}

function erroDaDescricao(descricao) {
  return (descricao ?? '').trim().length > DESCRICAO_MAXIMA
    ? `A descrição pode ter no máximo ${DESCRICAO_MAXIMA} caracteres.`
    : null;
}

function erroDoNivel(nivel, niveis) {
  if (vazio(nivel)) {
    return 'Escolha o nível do treino.';
  }
  return niveis && !niveis.includes(nivel) ? 'Nível inválido.' : null;
}

function erroDaVisibilidade(visibilidade, papel) {
  if (vazio(visibilidade)) {
    return 'Escolha a visibilidade do treino.';
  }
  if (!VISIBILIDADES.includes(visibilidade)) {
    return 'Visibilidade inválida.';
  }
  const permitidas = VISIBILIDADES_POR_PAPEL[papel];
  return permitidas && !permitidas.includes(visibilidade) ? 'Seu perfil não pode usar esta visibilidade.' : null;
}

function erroDaLista(itens) {
  if (itens.length === 0) {
    return 'Adicione pelo menos um exercício.';
  }
  return itens.length > MAXIMO_DE_ITENS ? `O treino pode ter no máximo ${MAXIMO_DE_ITENS} exercícios.` : null;
}

function errosDoItem(item) {
  const erros = {};
  if (!Number.isInteger(item.exercicio?.id) || item.exercicio.id < 1) {
    erros.exercicio_id = 'Exercício inválido.';
  }
  if (!ETAPAS.includes(item.etapa)) {
    erros.etapa = 'Etapa inválida.';
  }
  if (vazio(item.repeticoes) && vazio(item.duracao_segundos)) {
    erros.repeticoes = 'Informe as repetições ou a duração.';
    erros.duracao_segundos = 'Informe as repetições ou a duração.';
  }
  Object.keys(LIMITES).forEach((campo) => {
    const dispensado = LIMITES[campo].opcional && vazio(item[campo]);
    if (!dispensado && !dentroDoLimite(campo, item[campo])) {
      erros[campo] = MENSAGENS_DE_LIMITE[campo];
    }
  });
  return erros;
}

// opcoes.papel ('jogador' | 'treinador' | 'admin'): confere a visibilidade pelo papel.
// opcoes.niveis (lista de valores do GET /referencias): confere se o nível existe.
// Devolve { campo: 'mensagem' }; objeto vazio quando o treino é válido.
export function validarTreino(estado, opcoes = {}) {
  const itens = estado.itens ?? [];
  const erros = {};
  const gerais = {
    nome: erroDoNome(estado.nome),
    descricao: erroDaDescricao(estado.descricao),
    nivel: erroDoNivel(estado.nivel, opcoes.niveis),
    visibilidade: erroDaVisibilidade(estado.visibilidade, opcoes.papel),
    itens: erroDaLista(itens),
  };
  Object.entries(gerais).forEach(([campo, mensagem]) => {
    if (mensagem) {
      erros[campo] = mensagem;
    }
  });
  itens.forEach((item, indice) => {
    Object.entries(errosDoItem(item)).forEach(([campo, mensagem]) => {
      erros[`itens.${indice}.${campo}`] = mensagem;
    });
  });
  return erros;
}
