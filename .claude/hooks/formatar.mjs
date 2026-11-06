#!/usr/bin/env node
// Hook PostToolUse (Edit e Write): formata o arquivo que acabou de ser alterado.
// Nunca bloqueia: sempre sai com 0, e erros viram aviso no stderr.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const PINT = 'backend/vendor/bin/pint';
const PRETTIER = 'frontend/node_modules/prettier/bin/prettier.cjs';
const EXTENSOES_DO_FRONT = new Set(['.js', '.jsx', '.css', '.json', '.md']);

async function lerEvento() {
  let texto = '';
  process.stdin.setEncoding('utf8');
  for await (const pedaco of process.stdin) texto += pedaco;
  return JSON.parse(texto.replace(/^﻿/, ''));
}

function formatar(arquivo) {
  // O caminho chega absoluto e com o separador nativo (barra invertida no Windows).
  const relativo = path.relative(RAIZ, path.resolve(RAIZ, arquivo)).split(path.sep).join('/');
  if (relativo.startsWith('..') || path.isAbsolute(relativo)) return;

  const extensao = path.extname(relativo).toLowerCase();
  const opcoes = { cwd: RAIZ, stdio: ['ignore', 'ignore', 'pipe'] };

  if (relativo.startsWith('backend/') && extensao === '.php' && existsSync(path.join(RAIZ, PINT))) {
    execFileSync('php', [PINT, relativo], opcoes);
    return;
  }

  const ehDoFront = relativo.startsWith('frontend/') && !relativo.startsWith('frontend/node_modules/');
  if (ehDoFront && EXTENSOES_DO_FRONT.has(extensao) && existsSync(path.join(RAIZ, PRETTIER))) {
    execFileSync(process.execPath, [PRETTIER, '--write', relativo], opcoes);
  }
}

try {
  const evento = await lerEvento();
  const arquivo = evento?.tool_input?.file_path;
  if (typeof arquivo === 'string' && arquivo !== '') formatar(arquivo);
} catch (erro) {
  const detalhe = erro?.stderr?.length ? erro.stderr : (erro?.message ?? erro);
  process.stderr.write(`formatar: aviso: ${String(detalhe).trim()}\n`);
}
process.exitCode = 0;
