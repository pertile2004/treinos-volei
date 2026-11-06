#!/usr/bin/env node
// Hook pre-push: só deixa enviar se a documentação viva estiver em dia (nível push).
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const verificarDocs = path.resolve(import.meta.dirname, '..', 'verificar-docs.mjs');

try {
  execFileSync(process.execPath, [verificarDocs, '--nivel=push'], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
} catch (erro) {
  process.exitCode = typeof erro.status === 'number' && erro.status !== 0 ? erro.status : 1;
}
