#!/usr/bin/env node
// Garante a documentação viva: PR que mexe em código atualiza os docs.
// Uso: node scripts/verificar-docs.mjs [--nivel=push|pronto]   (padrão: pronto)
// Base de comparação: variável BASE_REF ou origin/main.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const BASE = process.env.BASE_REF || 'origin/main';
const NIVEIS = ['push', 'pronto'];
const MANIFESTOS = ['package.json', 'frontend/package.json', 'backend/composer.json'];

function git(args, opcoes = {}) {
  return execFileSync('git', args, {
    cwd: RAIZ,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opcoes,
  });
}

function lerNivel() {
  const argumento = process.argv.slice(2).find((a) => a.startsWith('--nivel='));
  const nivel = argumento ? argumento.slice('--nivel='.length) : 'pronto';
  if (!NIVEIS.includes(nivel)) {
    throw new Error(`nível inválido "${nivel}". Use --nivel=push ou --nivel=pronto.`);
  }
  return nivel;
}

/** Tenta atualizar a base; offline ou sem remoto, segue com a base local. */
function atualizarBase() {
  try {
    git(['fetch', 'origin', 'main', '--quiet'], {
      timeout: 30_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
  } catch {
    // Sem rede ou sem remoto: a comparação usa a base que já existe localmente.
  }
}

function arquivosAlterados() {
  const saida = git(['-c', 'core.quotepath=off', 'diff', '--name-only', `${BASE}...HEAD`]);
  return saida
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);
}

/** O número XX vem da branch feature/pr-XX-...; no GitHub Actions, de GITHUB_HEAD_REF. */
function numeroDoPr() {
  let ramo = process.env.GITHUB_HEAD_REF;
  if (!ramo) {
    try {
      ramo = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
    } catch {
      ramo = '';
    }
  }
  const achado = /^feature\/pr-(\d+)-/.exec(ramo);
  return { ramo, numero: achado ? achado[1] : null };
}

function verificar(nivel) {
  const alterados = arquivosAlterados();
  const mudou = (arquivo) => alterados.includes(arquivo);
  const mudouEm = (prefixo) => alterados.some((arquivo) => arquivo.startsWith(prefixo));
  const faltas = [];

  // Dependências: vale em qualquer nível, mesmo em PR só de docs ou de configuração.
  const manifestos = MANIFESTOS.filter(mudou);
  if (manifestos.length > 0 && !mudou('docs/DECISOES.md')) {
    faltas.push(`docs/DECISOES.md: registre a mudança de dependências (${manifestos.join(', ')}).`);
  }

  const mudouCodigo = mudouEm('backend/') || mudouEm('frontend/');
  if (mudouCodigo) {
    for (const doc of ['docs/ESTADO.md', 'docs/ROADMAP.md']) {
      if (!mudou(doc)) faltas.push(`${doc}: não foi alterado neste PR.`);
    }
    if (mudouEm('backend/database/migrations/') && !mudou('docs/MODELO-DE-DADOS.md')) {
      faltas.push('docs/MODELO-DE-DADOS.md: há migration nova ou alterada.');
    }
    if (mudouEm('backend/routes/') && !mudou('docs/API.md')) {
      faltas.push('docs/API.md: há rota nova ou alterada.');
    }
    if (nivel === 'pronto') {
      if (!mudou('CHANGELOG.md')) faltas.push('CHANGELOG.md: falta a entrada em "Não lançado".');
      const { ramo, numero } = numeroDoPr();
      if (!numero) {
        faltas.push(`branch "${ramo}": não descobri o número do PR (esperado feature/pr-XX-descricao).`);
      } else {
        const historico = `docs/historico/PR-${numero}.md`;
        if (!mudou(historico)) faltas.push(`${historico}: crie o histórico deste PR.`);
        const estado = path.join(RAIZ, 'docs', 'ESTADO.md');
        const texto = existsSync(estado) ? readFileSync(estado, 'utf8') : '';
        if (!texto.includes(`PR-${numero}`)) faltas.push(`docs/ESTADO.md: precisa citar "PR-${numero}".`);
      }
    }
  }
  return { alterados, faltas, mudouCodigo };
}

function principal() {
  let nivel;
  try {
    nivel = lerNivel();
  } catch (erro) {
    console.error(`verificar-docs: ${erro.message}`);
    return 1;
  }

  atualizarBase();

  let resultado;
  try {
    resultado = verificar(nivel);
  } catch (erro) {
    console.error(`verificar-docs: não consegui comparar com a base "${BASE}".`);
    console.error('Confira se a base existe (git fetch origin) ou defina BASE_REF.');
    console.error(String(erro.stderr || erro.message).trim());
    return 1;
  }

  const { alterados, faltas, mudouCodigo } = resultado;
  const contexto = `nível ${nivel}, base ${BASE}`;
  if (faltas.length === 0) {
    const detalhe = mudouCodigo ? '' : '; sem mudança em backend/ ou frontend/';
    console.log(`verificar-docs: OK (${contexto}, ${alterados.length} arquivo(s) alterado(s)${detalhe}).`);
    return 0;
  }

  console.error(`verificar-docs: FALHOU (${contexto}) - falta atualizar a documentação viva:`);
  for (const falta of faltas) console.error(`  - ${falta}`);
  console.error('Como resolver: rode /encerrar (ele atualiza os docs vivos) e faça o commit.');
  return 1;
}

process.exitCode = principal();
