#!/usr/bin/env node
// Hook SessionStart: mostra onde o projeto parou. O texto do stdout entra no contexto da sessão.
// Nunca falha: qualquer erro vira uma linha de aviso e o script sai com 0.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const linhas = [];
const dizer = (texto = '') => linhas.push(texto);

function git(raiz, args) {
  return execFileSync('git', args, {
    cwd: raiz,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 10_000,
  }).replace(/\s+$/, '');
}

/** Roda a ação; se ela falhar, registra um aviso e devolve null. */
function tentar(descricao, acao) {
  try {
    return acao();
  } catch (erro) {
    dizer(`(aviso: ${descricao}: ${String(erro?.message ?? erro).split(/\r?\n/)[0]})`);
    return null;
  }
}

function gitOuVazio(raiz, args) {
  try {
    return git(raiz, args);
  } catch {
    return '';
  }
}

function descobrirRaiz() {
  return process.env.CLAUDE_PROJECT_DIR || git(process.cwd(), ['rev-parse', '--show-toplevel']);
}

const ler = (raiz, relativo) => readFileSync(path.join(raiz, relativo), 'utf8');
const naoVazias = (texto) => texto.split(/\r?\n/).filter((linha) => linha.trim() !== '');

/** Devolve as linhas das seções "## <título>" pedidas, com o título junto. */
function secoes(texto, titulos) {
  const saida = [];
  let dentro = false;
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.startsWith('## ')) dentro = titulos.includes(linha.slice(3).trim());
    if (dentro) saida.push(linha);
  }
  return saida;
}

/** Devolve as linhas de dados das tabelas Markdown, cada uma como lista de células. */
function linhasDeTabela(texto) {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.startsWith('|'))
    .map((linha) =>
      linha
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((celula) => celula.trim()),
    )
    .filter((celulas) => /^\d+$/.test(celulas[0]));
}

const igual = (a, b) => Boolean(a) && Boolean(b) && a.toLowerCase() === b.toLowerCase();

function principal() {
  const raiz = tentar('raiz do projeto', descobrirRaiz) ?? process.cwd();

  // 1. Onde paramos.
  dizer('=== VOLLEY PRO — onde paramos ===');
  tentar('docs/ESTADO.md', () => {
    const trecho = secoes(ler(raiz, 'docs/ESTADO.md'), ['Agora', 'Em andamento', 'Pendências']);
    for (const linha of trecho.slice(0, 60)) dizer(linha);
  });

  // 2. Situação do Git.
  dizer('');
  tentar('branch atual', () => dizer(`Branch atual: ${git(raiz, ['rev-parse', '--abbrev-ref', 'HEAD'])}`));
  tentar('git status', () => {
    const alteracoes = naoVazias(git(raiz, ['status', '--short']));
    dizer(alteracoes.length > 0 ? 'Alterações locais (git status --short):' : 'Sem alterações locais.');
    for (const linha of alteracoes.slice(0, 15)) dizer(`  ${linha}`);
    if (alteracoes.length > 15) dizer(`  ... e mais ${alteracoes.length - 15}`);
  });
  tentar('git log', () => {
    dizer('Últimos commits:');
    for (const linha of naoVazias(git(raiz, ['log', '--oneline', '-5']))) dizer(`  ${linha}`);
  });

  // 3. Identidade do Git e integrante correspondente.
  dizer('');
  const nome = gitOuVazio(raiz, ['config', 'user.name']);
  const email = gitOuVazio(raiz, ['config', 'user.email']);
  dizer(`Identidade do Git: ${nome || '(nome vazio)'} <${email || 'e-mail vazio'}>`);

  let integrante = null;
  tentar('docs/INTEGRANTES.md', () => {
    const texto = ler(raiz, 'docs/INTEGRANTES.md');
    const linha = linhasDeTabela(texto).find(
      (celulas) => igual(celulas[3], email) || igual(celulas[1], nome) || igual(celulas[2], nome),
    );
    if (linha) {
      integrante = linha[0];
      dizer(`Integrante desta máquina: Integrante ${linha[0]} — ${linha[1]}`);
    } else if (texto.includes('PENDENTE')) {
      dizer('INTEGRANTES.md pendente: pergunte ao humano qual integrante (1 a 6) ele é');
    } else {
      dizer('A identidade do Git não está no docs/INTEGRANTES.md: pergunte ao humano qual integrante ele é');
    }
  });

  // 4. Próximo card a fazer desse integrante.
  if (integrante) {
    tentar('docs/ROADMAP.md', () => {
      const proximo = linhasDeTabela(ler(raiz, 'docs/ROADMAP.md')).find(
        (celulas) => igual(celulas[2], `Integrante ${integrante}`) && (celulas[5] ?? '').includes('☐'),
      );
      dizer(
        proximo
          ? `Próximo card deste integrante: PR-${proximo[0]} — ${proximo[1]} (depende de: ${proximo[3]})`
          : 'Nenhum card ☐ deste integrante no docs/ROADMAP.md.',
      );
    });
  }

  // 5. Como trabalhar.
  dizer('');
  dizer('Para trabalhar: /comecar. Para finalizar: /encerrar.');
}

try {
  principal();
} catch (erro) {
  dizer(`(aviso: contexto-da-sessao falhou: ${String(erro?.message ?? erro).split(/\r?\n/)[0]})`);
}
process.stdout.write(`${linhas.join('\n')}\n`);
process.exitCode = 0;
