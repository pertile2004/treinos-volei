#!/usr/bin/env node
// Ambiente de desenvolvimento do backend.
// Sem argumentos: prepara o ambiente (banco e Mailpit pelo Docker e as migrations) e termina.
// Com --api: inicia só a API (a porta vem de E2E_API_PORT; padrão 8000).
// O `npm run dev` roda a preparação e depois sobe a API e o front juntos, com o concurrently.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { RAIZ } from './lib/processos.mjs';

const porta = process.env.E2E_API_PORT ?? '8000';

/** Roda uma etapa até o fim; se falhar, explica e encerra. */
function etapa(nome, comando, args, dica) {
  console.log(`\n=== ${nome} ===`);
  try {
    execFileSync(comando, args, { cwd: RAIZ, stdio: 'inherit' });
  } catch (erro) {
    if (typeof erro.status !== 'number') console.error(String(erro.message));
    console.error(`\n[FALHOU] ${nome}. ${dica}`);
    process.exit(1);
  }
}

if (!existsSync(path.join(RAIZ, 'backend', 'vendor'))) {
  console.error('[FALTA] backend/vendor: rode `composer --working-dir=backend install`.');
  process.exit(1);
}
if (!existsSync(path.join(RAIZ, 'backend', '.env'))) {
  console.error(
    '[FALTA] backend/.env: copie backend/.env.example para backend/.env e rode `php backend/artisan key:generate`.',
  );
  process.exit(1);
}

if (process.argv.includes('--api')) {
  console.log(`\n=== API em http://127.0.0.1:${porta} (Ctrl+C para parar) ===`);
  const api = spawn('php', ['backend/artisan', 'serve', '--host=127.0.0.1', `--port=${porta}`], {
    cwd: RAIZ,
    stdio: 'inherit',
  });
  api.on('error', (erro) => {
    console.error(`[FALHOU] não consegui iniciar a API: ${erro.message}`);
    process.exitCode = 1;
  });
  api.on('exit', (codigo) => {
    process.exitCode = codigo ?? 0;
  });
} else {
  etapa(
    'Docker: PostgreSQL e Mailpit',
    'docker',
    ['compose', 'up', '-d', '--wait'],
    'Confira se o Docker Desktop está aberto. Sem Docker, veja no README como usar um PostgreSQL local.',
  );
  etapa(
    'Migrations',
    'php',
    ['backend/artisan', 'migrate', '--force'],
    'Confira os dados do banco em backend/.env.',
  );
}
