#!/usr/bin/env node
// Garante que nenhum commit nem o PR atribui o trabalho a uma IA.
// Uso: node scripts/verificar-autoria.mjs
// Base de comparação: variável BASE_REF ou origin/main.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { identidadeDeIA, regraDeAtribuicao } from './lib/atribuicao.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const BASE = process.env.BASE_REF || 'origin/main';
const SEPARADOR_DE_CAMPO = '\x1f';
const SEPARADOR_DE_REGISTRO = '\x1e';

function lerCommits() {
  const formato = `${['%H', '%an', '%ae', '%cn', '%ce', '%B'].join('%x1f')}%x1e`;
  const saida = execFileSync('git', ['log', `--format=${formato}`, `${BASE}..HEAD`], {
    cwd: RAIZ,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  return saida
    .split(SEPARADOR_DE_REGISTRO)
    .map((registro) => registro.replace(/^\s+/, ''))
    .filter(Boolean)
    .map((registro) => {
      const [hash, autorNome, autorEmail, committerNome, committerEmail, mensagem = ''] =
        registro.split(SEPARADOR_DE_CAMPO);
      return { hash, autorNome, autorEmail, committerNome, committerEmail, mensagem };
    });
}

function problemasDoTexto(texto, onde) {
  const problemas = [];
  for (const linha of texto.split(/\r?\n/)) {
    const regra = regraDeAtribuicao(linha);
    if (regra) problemas.push(`${onde}: ${regra} -> "${linha.trim()}"`);
  }
  return problemas;
}

function problemasDoCommit(commit) {
  const assunto = commit.mensagem.split(/\r?\n/)[0];
  const onde = `commit ${commit.hash.slice(0, 8)} (${assunto})`;
  const problemas = problemasDoTexto(commit.mensagem, onde);
  const pessoas = [
    ['autor', commit.autorNome, commit.autorEmail],
    ['committer', commit.committerNome, commit.committerEmail],
  ];
  for (const [papel, nome, email] of pessoas) {
    if (identidadeDeIA(nome) || identidadeDeIA(email)) {
      problemas.push(`${onde}: ${papel} com identidade de IA -> ${nome} <${email}>`);
    }
  }
  return problemas;
}

/** No GitHub Actions, aplica as mesmas regras ao título e ao corpo do PR. */
function problemasDoPullRequest() {
  const caminho = process.env.GITHUB_EVENT_PATH;
  if (!caminho) return [];
  const pullRequest = JSON.parse(readFileSync(caminho, 'utf8')).pull_request;
  if (!pullRequest) return [];
  return [
    ...problemasDoTexto(pullRequest.title ?? '', 'título do PR'),
    ...problemasDoTexto(pullRequest.body ?? '', 'corpo do PR'),
  ];
}

function principal() {
  let commits;
  try {
    commits = lerCommits();
  } catch (erro) {
    console.error(`verificar-autoria: não consegui ler os commits de ${BASE}..HEAD.`);
    console.error('Confira se a base existe (git fetch origin) ou defina BASE_REF.');
    console.error(String(erro.stderr || erro.message).trim());
    return 1;
  }

  const problemas = [...commits.flatMap(problemasDoCommit), ...problemasDoPullRequest()];
  if (problemas.length === 0) {
    console.log(`verificar-autoria: OK (${commits.length} commit(s) conferido(s) em ${BASE}..HEAD).`);
    return 0;
  }

  console.error('verificar-autoria: FALHOU - há atribuição de IA em commits ou no PR:');
  for (const problema of problemas) console.error(`  - ${problema}`);
  console.error('Como resolver: a autoria é sempre do integrante. Peça ao humano para corrigir');
  console.error('esses commits ou o texto do PR. O hook commit-msg evita isso: rode "npm run setup".');
  return 1;
}

process.exitCode = principal();
