#!/usr/bin/env node
// Hook commit-msg: remove atribuição de IA e exige Conventional Commits em português.
// Uso: node scripts/git/commit-msg.mjs <arquivo-da-mensagem>
// Autoteste: node scripts/git/commit-msg.mjs --autoteste
import { readFileSync, writeFileSync } from 'node:fs';
import { regraDeAtribuicao } from '../lib/atribuicao.mjs';

const TIPOS = ['feat', 'fix', 'docs', 'test', 'refactor', 'chore', 'ci', 'build', 'perf', 'style'];
const FORMATO = new RegExp(`^(${TIPOS.join('|')})(\\([^()]+\\))?: (.+)$`);

/** Remove as linhas de atribuição de IA e as linhas vazias que sobrarem no fim. */
function limpar(mensagem) {
  const linhas = mensagem.split(/\r?\n/).filter((linha) => !regraDeAtribuicao(linha));
  while (linhas.length > 0 && linhas.at(-1).trim() === '') linhas.pop();
  return linhas.length > 0 ? `${linhas.join('\n')}\n` : '';
}

/** Devolve null se a primeira linha for válida, ou o motivo da recusa. */
function validar(mensagem) {
  const primeira =
    mensagem.split(/\r?\n/).find((linha) => linha.trim() !== '' && !linha.startsWith('#')) ?? '';
  if (/^Merge /.test(primeira)) return null;
  const achado = FORMATO.exec(primeira);
  if (!achado) return `a primeira linha "${primeira}" não segue o formato tipo(escopo opcional): descrição`;
  if (achado[3].trim().length < 3) return 'a descrição precisa ter 3 ou mais caracteres';
  return null;
}

function explicar(motivo) {
  console.error(`Commit recusado: ${motivo}.`);
  console.error('Use Conventional Commits em português: tipo(escopo opcional): descrição');
  console.error(`Tipos aceitos: ${TIPOS.join(', ')}.`);
  console.error('Exemplo: feat(treinos): cadastro de treino');
}

function autoteste() {
  const comAtribuicao = [
    'feat(api): saude',
    '',
    'Corpo da mensagem.',
    '',
    'Co-Authored-By: Claude <noreply@anthropic.com>',
    'Claude-Session: x',
    '',
  ].join('\n');
  const casos = [
    [
      'mensagem com Co-Authored-By e Claude-Session sai limpa',
      () => limpar(comAtribuicao) === 'feat(api): saude\n\nCorpo da mensagem.\n',
    ],
    ['"feat(api): saude" passa', () => validar('feat(api): saude') === null],
    ['"arrumei coisas" falha', () => validar('arrumei coisas') !== null],
    ['"Merge branch main" passa', () => validar('Merge branch main') === null],
  ];

  let falhas = 0;
  for (const [nome, teste] of casos) {
    const passou = teste();
    if (!passou) falhas++;
    console.log(`${passou ? 'OK' : 'FALHOU'} - ${nome}`);
  }
  console.log(
    falhas === 0 ? `commit-msg: ${casos.length} casos OK.` : `commit-msg: ${falhas} caso(s) FALHOU.`,
  );
  return falhas === 0 ? 0 : 1;
}

function principal() {
  const argumento = process.argv[2];
  if (argumento === '--autoteste') return autoteste();
  if (!argumento) {
    console.error('Uso: node scripts/git/commit-msg.mjs <arquivo-da-mensagem> | --autoteste');
    return 1;
  }

  const original = readFileSync(argumento, 'utf8');
  const limpa = limpar(original);
  if (limpa !== original) writeFileSync(argumento, limpa);

  const motivo = validar(limpa);
  if (motivo) {
    explicar(motivo);
    return 1;
  }
  return 0;
}

process.exitCode = principal();
