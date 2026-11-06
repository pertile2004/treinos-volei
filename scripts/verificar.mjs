#!/usr/bin/env node
// Roda localmente o que o CI roda e imprime um resumo com [OK] ou [FALHOU] por item.
// Uso: npm run verificar [-- --pronto] [-- --e2e]
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { RAIZ, comandoComposer, comandoNpm } from './lib/processos.mjs';

const argumentos = process.argv.slice(2);
const nivel = argumentos.includes('--pronto') ? 'pronto' : 'push';
const resultados = [];

/** Roda um item e registra o resultado; continua depois de uma falha, para mostrar tudo. */
function rodar(nome, programa, args) {
  console.log(`\n=== ${nome} ===`);
  let passou = false;
  if (!programa) {
    console.error(`Não encontrei o programa necessário para "${nome}".`);
  } else {
    try {
      execFileSync(programa.comando, [...programa.prefixo, ...args], { cwd: RAIZ, stdio: 'inherit' });
      passou = true;
    } catch (erro) {
      if (typeof erro.status !== 'number') console.error(String(erro.message));
    }
  }
  resultados.push({ nome, passou });
}

const node = { comando: process.execPath, prefixo: [] };
rodar(`documentação viva (nível ${nivel})`, node, ['scripts/verificar-docs.mjs', `--nivel=${nivel}`]);
rodar('autoria dos commits', node, ['scripts/verificar-autoria.mjs']);

if (existsSync(path.join(RAIZ, 'backend', 'vendor'))) {
  const composer = comandoComposer();
  for (const script of ['lint', 'analise', 'test']) {
    rodar(`backend: ${script}`, composer, ['--working-dir=backend', script]);
  }
}

const npm = comandoNpm();
if (existsSync(path.join(RAIZ, 'frontend', 'node_modules'))) {
  rodar('frontend: lint', npm, ['--prefix', 'frontend', 'run', 'lint']);
  rodar('frontend: test', npm, ['--prefix', 'frontend', 'run', 'test', '--', '--run']);
  rodar('frontend: build', npm, ['--prefix', 'frontend', 'run', 'build']);
}

if (argumentos.includes('--e2e')) rodar('e2e', npm, ['run', 'teste:e2e']);

console.log('\n=== Resumo ===');
for (const { nome, passou } of resultados) console.log(`${passou ? '[OK]' : '[FALHOU]'} ${nome}`);
const falhas = resultados.filter((resultado) => !resultado.passou).length;
console.log(falhas === 0 ? 'Tudo certo.' : `${falhas} item(ns) falharam.`);
process.exitCode = falhas === 0 ? 0 : 1;
