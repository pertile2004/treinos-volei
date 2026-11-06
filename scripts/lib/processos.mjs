// Utilidades de processo dos scripts da raiz. Tudo roda sem shell (execFileSync),
// para funcionar igual no Windows, no macOS e no Linux.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath funciona também em Node antigo, para o setup conseguir avisar que o Node é antigo.
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Roda um comando na raiz e devolve o stdout em texto, ou null se ele falhar ou não existir. */
export function capturar(comando, args) {
  try {
    return execFileSync(comando, args, {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Como chamar o Composer sem shell. No Windows ele é um .bat, que não roda sem shell,
 * então usamos `php <composer.phar>`. Devolve null se o Composer não estiver no PATH.
 */
export function comandoComposer() {
  const nomes = process.platform === 'win32' ? ['composer.phar'] : ['composer', 'composer.phar'];
  const pastas = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  for (const pasta of pastas) {
    for (const nome of nomes) {
      const caminho = path.join(pasta, nome);
      if (existsSync(caminho)) return { comando: 'php', prefixo: [caminho] };
    }
  }
  return null;
}

/**
 * Como chamar o npm sem shell. No Windows ele é um .cmd, que não roda sem shell,
 * então usamos `node <npm-cli.js>`. Devolve null se o npm-cli.js não for encontrado.
 */
export function comandoNpm() {
  if (process.platform !== 'win32') return { comando: 'npm', prefixo: [] };
  const candidatos = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const cli = candidatos.find((c) => c && /npm-cli\.js$/.test(c) && existsSync(c));
  return cli ? { comando: process.execPath, prefixo: [cli] } : null;
}
