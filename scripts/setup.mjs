#!/usr/bin/env node
// Prepara a máquina do integrante: ativa os git hooks do projeto e confere o ambiente.
// Idempotente: pode rodar quantas vezes quiser. Uso: npm run setup
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { identidadeDeIA } from './lib/atribuicao.mjs';
import { RAIZ, capturar, comandoComposer } from './lib/processos.mjs';

const faltas = [];
const avisos = [];
const temBackend = existsSync(path.join(RAIZ, 'backend'));

function ok(texto) {
  console.log(`[OK] ${texto}`);
}

function falta(texto) {
  console.log(`[FALTA] ${texto}`);
  faltas.push(texto);
}

function aviso(texto) {
  console.log(`[AVISO] ${texto}`);
  avisos.push(texto);
}

const primeiraLinha = (texto) => texto.split(/\r?\n/)[0];

function versaoAtende(texto, maiorMinimo, menorMinimo = 0) {
  const achado = /(\d+)\.(\d+)/.exec(texto ?? '');
  if (!achado) return false;
  const maior = Number(achado[1]);
  const menor = Number(achado[2]);
  return maior > maiorMinimo || (maior === maiorMinimo && menor >= menorMinimo);
}

// 1. Git hooks do projeto (só neste repositório, nunca global).
function ativarGitHooks(temGit) {
  if (!temGit) return;
  if (capturar('git', ['rev-parse', '--is-inside-work-tree']) !== 'true') {
    falta('esta pasta não é um repositório Git: clone o repositório antes de rodar o setup');
    return;
  }
  try {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: RAIZ, stdio: 'ignore' });
    ok('git hooks do projeto ativados (core.hooksPath = .githooks)');
  } catch (erro) {
    falta(`não consegui ativar os git hooks: ${erro.message}`);
  }
}

// 2. Versões das ferramentas.
function conferirVersoes(versaoDoGit) {
  const node = process.versions.node;
  if (versaoAtende(node, 24)) ok(`node ${node}`);
  else falta(`node ${node} é antigo: instale o Node 24 ou mais novo`);

  if (versaoDoGit) ok(versaoDoGit);
  else falta('git não encontrado: instale o Git');

  const docker = capturar('docker', ['--version']);
  if (docker) ok(primeiraLinha(docker));
  else falta('docker não encontrado: instale o Docker Desktop');

  const gh = capturar('gh', ['--version']);
  if (!gh) {
    falta('gh não encontrado: instale o GitHub CLI');
  } else {
    ok(primeiraLinha(gh));
    if (capturar('gh', ['auth', 'status']) === null) falta('gh não autenticado: rode "gh auth login"');
    else ok('gh autenticado');
  }

  // PHP e Composer só geram aviso até o PR-01 (enquanto backend/ não existir).
  const registrar = temBackend ? falta : aviso;
  const sufixo = temBackend ? '' : ' (obrigatório a partir do PR-01)';

  const php = capturar('php', ['--version']);
  if (!php) registrar(`php não encontrado: instale o PHP 8.3 ou mais novo${sufixo}`);
  else if (!versaoAtende(php, 8, 3)) registrar(`${primeiraLinha(php)} é antigo: use o PHP 8.3 ou mais novo${sufixo}`);
  else ok(primeiraLinha(php));

  const composer = php ? comandoComposer() : null;
  const versaoDoComposer = composer ? capturar(composer.comando, [...composer.prefixo, '--version']) : null;
  if (versaoDoComposer) ok(primeiraLinha(versaoDoComposer));
  else registrar(`composer não encontrado: instale o Composer${sufixo}`);
}

// 3. Identidade do Git (só confere; nunca altera).
function conferirIdentidade(temGit) {
  if (!temGit) return;
  const nome = capturar('git', ['config', 'user.name']) ?? '';
  const email = capturar('git', ['config', 'user.email']) ?? '';
  if (nome === '' || email === '') {
    falta('identidade do Git vazia: configure o seu nome e o seu e-mail no Git (você mesmo, no seu terminal)');
  } else if (identidadeDeIA(nome) || identidadeDeIA(email)) {
    falta(`identidade do Git inválida (${nome} <${email}>): os commits saem no nome do integrante`);
  } else {
    ok(`identidade do Git: ${nome} <${email}>`);
  }
}

// 4. Arquivo de ambiente do backend (a partir do PR-01).
function prepararBackend() {
  if (!temBackend) return;
  const env = path.join(RAIZ, 'backend', '.env');
  const exemplo = path.join(RAIZ, 'backend', '.env.example');
  if (existsSync(env)) {
    ok('backend/.env já existe');
    return;
  }
  if (!existsSync(exemplo)) {
    aviso('backend/.env.example não existe: o backend/.env não foi criado');
    return;
  }
  copyFileSync(exemplo, env);
  ok('backend/.env criado a partir do backend/.env.example');
  try {
    execFileSync('php', ['backend/artisan', 'key:generate'], { cwd: RAIZ, stdio: 'inherit' });
    ok('chave da aplicação gerada (php backend/artisan key:generate)');
  } catch (erro) {
    // Desfaz a cópia feita agora, para a próxima execução refazer a cópia e a chave.
    rmSync(env, { force: true });
    falta(
      `não consegui gerar a chave da aplicação (${erro.message}): rode "composer --working-dir=backend install" e depois "npm run setup" de novo`,
    );
  }
}

// 5. Resumo.
function resumir() {
  console.log('');
  if (faltas.length === 0) {
    console.log('Resumo: ambiente pronto.');
  } else {
    console.log(`Resumo: falta resolver ${faltas.length} item(ns):`);
    for (const item of faltas) console.log(`  - ${item}`);
  }
  if (avisos.length > 0) {
    console.log(`Avisos (${avisos.length}):`);
    for (const item of avisos) console.log(`  - ${item}`);
  }
}

const versaoDoGit = capturar('git', ['--version']);
ativarGitHooks(versaoDoGit !== null);
conferirVersoes(versaoDoGit);
conferirIdentidade(versaoDoGit !== null);
prepararBackend();
resumir();
process.exitCode = faltas.length === 0 ? 0 : 1;
