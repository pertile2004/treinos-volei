#!/usr/bin/env node
// Guarda de comandos do projeto: hook PreToolUse para as ferramentas Bash e PowerShell.
// Bloqueia (código 2) comandos destrutivos e troca de autoria, e exige a documentação
// viva antes de enviar. Recebe o JSON do evento pelo stdin.
// Autoteste: node .claude/hooks/guarda-comandos.mjs --autoteste
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTE_ARQUIVO = fileURLToPath(import.meta.url);
const RAIZ = path.resolve(path.dirname(ESTE_ARQUIVO), '..', '..');
const FERRAMENTAS = ['Bash', 'PowerShell'];

// ---------------------------------------------------------------------------
// Leitura do comando: separa em comandos simples e em palavras, respeitando aspas.
// ---------------------------------------------------------------------------

function fimDosParenteses(texto, abre) {
  // Em $(cat <<'FIM' ... FIM o corpo é só texto: os parênteses dele não contam.
  const corpo = /^\(\s*cat\s*<<-?\s*(['"])(\w+)\1[ \t]*\r?\n(?:[\s\S]*?\n)??[ \t]*\2[ \t]*\r?\n/.exec(
    texto.slice(abre),
  );
  let nivel = 1;
  for (let i = abre + (corpo ? corpo[0].length : 1); i < texto.length; i++) {
    if (texto[i] === '(') nivel++;
    else if (texto[i] === ')' && --nivel === 0) return i;
  }
  return texto.length;
}

/**
 * Devolve os comandos simples (cada um como lista de palavras) e os trechos de $(...) ou
 * crases que aparecem dentro de aspas duplas, para serem analisados à parte.
 * Fora de aspas, os separadores são ; | & quebra de linha ( ) { } e, no Bash, a crase.
 * Um (...) ou um par de crases no meio do comando vira outro comando simples, e o de fora continua.
 */
function lexar(texto, ferramenta) {
  const escape = ferramenta === 'PowerShell' ? '`' : '\\';
  const segmentos = [];
  const aninhados = [];
  const pilha = [];
  let tokens = [];
  let atual = '';
  let temToken = false;
  let aspas = null;

  const fecharToken = () => {
    if (temToken) tokens.push(atual);
    atual = '';
    temToken = false;
  };
  const fecharSegmento = () => {
    fecharToken();
    if (tokens.length > 0) segmentos.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas === "'") {
      if (c === "'") aspas = null;
      else atual += c;
    } else if (aspas === '"') {
      if (c === escape && i + 1 < texto.length) {
        // No Bash, dentro de aspas duplas, a barra só escapa $ ` " \ e a quebra de linha.
        if (escape === '\\' && texto[i + 1] === '\n') i++;
        else if (escape === '\\' && !'$`"\\'.includes(texto[i + 1])) atual += c;
        else atual += texto[++i];
      } else if (c === '"') {
        aspas = null;
      } else if (c === '$' && texto[i + 1] === '(') {
        const fim = fimDosParenteses(texto, i + 1);
        aninhados.push(texto.slice(i + 2, fim));
        atual += texto.slice(i, fim + 1);
        i = fim;
      } else if (c === '`' && escape !== '`' && texto.indexOf('`', i + 1) !== -1) {
        const fim = texto.indexOf('`', i + 1);
        aninhados.push(texto.slice(i + 1, fim));
        atual += texto.slice(i, fim + 1);
        i = fim;
      } else {
        atual += c;
      }
    } else if (escape === '`' && c === '@' && texto[i + 1] === "'" && /^[ \t]*\r?\n/.test(texto.slice(i + 2))) {
      // Here-string literal do PowerShell (@' ... '@): o corpo vira uma palavra só, mesmo com
      // apóstrofos dentro (os delimitadores ficam de fora, como acontece com as aspas).
      const fim = texto.indexOf("\n'@", i + 2);
      const ate = fim === -1 ? texto.length : fim + 3;
      atual += texto.slice(texto.indexOf('\n', i + 2) + 1, fim === -1 ? texto.length : fim);
      temToken = true;
      i = ate - 1;
    } else if (c === "'" || c === '"') {
      aspas = c;
      temToken = true;
    } else if (c === escape && i + 1 < texto.length) {
      const proximo = texto[++i];
      if (proximo === '\r' && texto[i + 1] === '\n') {
        i++; // continuação de linha com CRLF
      } else if (proximo !== '\n') {
        atual += proximo;
        temToken = true;
      }
    } else if (c === ' ' || c === '\t' || c === '\r') {
      fecharToken();
    } else if (pilha.length > 0 && c === pilha.at(-1).fecha) {
      // Fim de um (...) ou de um par de crases aberto no meio do comando.
      fecharSegmento();
      ({ tokens, atual, temToken } = pilha.pop());
      atual += '()';
      temToken = true;
    } else if (
      (c === '(' || (c === '`' && escape !== '`')) &&
      (temToken || tokens.length > 0 || pilha.length > 0)
    ) {
      // "(" ou crase no meio do comando: o de dentro vira outro comando simples e o de fora
      // continua depois do fechamento (assim "git push origin $(...) --force" é visto inteiro).
      pilha.push({ tokens, atual, temToken, fecha: c === '(' ? ')' : '`' });
      tokens = [];
      atual = '';
      temToken = false;
    } else if (
      c === '{' &&
      (temToken || tokens.length > 0 || pilha.length > 0) &&
      /^\{[^\s{}'"`\\]*\}/.test(texto.slice(i))
    ) {
      // Chaves sem espaço no meio do comando (${VAR}, repos/{owner}, {a,b}) fazem parte da palavra.
      const fim = texto.indexOf('}', i);
      atual += texto.slice(i, fim + 1);
      temToken = true;
      i = fim;
    } else if (';|&\n(){}'.includes(c) || c === '`') {
      fecharSegmento();
    } else {
      atual += c;
      temToken = true;
    }
  }
  fecharSegmento();
  while (pilha.length > 0) {
    ({ tokens, atual, temToken } = pilha.pop());
    fecharSegmento();
  }
  return { segmentos, aninhados };
}

const nomeDoComando = (token) =>
  token
    .split(/[\\/]/)
    .pop()
    .toLowerCase()
    .replace(/\.(exe|cmd|bat|ps1)$/, '');
const ehOpcaoCurta = (token) => /^-[a-zA-Z]+$/.test(token);
const semOpcoes = (tokens) => tokens.filter((t) => !t.startsWith('-')).map((t) => t.toLowerCase());

// ---------------------------------------------------------------------------
// Regras do Git
// ---------------------------------------------------------------------------

const GIT_GLOBAIS_COM_VALOR = new Set([
  '-C',
  '-c',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--exec-path',
  '--config-env',
]);

/** Pula as opções globais do git e devolve o subcomando, o resto e os valores de -c. */
function separarGit(args) {
  const configuracoes = [];
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    if (GIT_GLOBAIS_COM_VALOR.has(args[i])) {
      if (args[i] === '-c' && i + 1 < args.length) configuracoes.push(args[i + 1]);
      i += 2;
    } else {
      i += 1;
    }
  }
  return { sub: (args[i] ?? '').toLowerCase(), resto: args.slice(i + 1), configuracoes };
}

const PUSH_COM_VALOR = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);
const DESTINO_PROTEGIDO = 'git push com destino main ou master';

function regraPush(resto, contexto) {
  const posicionais = [];
  for (let i = 0; i < resto.length; i++) {
    const t = resto[i];
    if (/^\d*>/.test(t)) {
      // Redirecionamento de saída não é refspec; o destino pode vir na palavra seguinte.
      if (/^\d*>>?$/.test(t)) i++;
      continue;
    }
    if (t === '--force' || t === '--mirror') return `git push ${t}`;
    if (t === '--force-with-lease' || t.startsWith('--force-with-lease=')) return 'git push --force-with-lease';
    if (t === '--no-verify') return '--no-verify em git push';
    if (t === '--all' || t === '--branches') return DESTINO_PROTEGIDO;
    if (PUSH_COM_VALOR.has(t)) {
      i++;
    } else if (ehOpcaoCurta(t)) {
      if (t.includes('f')) return 'git push -f';
      if (t.endsWith('o')) i++;
    } else if (!t.startsWith('-')) {
      posicionais.push(t);
    }
  }

  const refspecs = posicionais.slice(1);
  for (const refspec of refspecs) {
    if (refspec.startsWith('+')) return 'git push com refspec iniciado por +';
    const destino = refspec.slice(refspec.lastIndexOf(':') + 1).replace(/^refs\/heads\//, '');
    if (destino === 'main' || destino === 'master') return DESTINO_PROTEGIDO;
  }

  // Sem refspec, com HEAD ou com refspec calculado ($(...), variável), o destino é a branch atual.
  if (refspecs.length === 0 || refspecs.some((r) => r === 'HEAD' || r === '@' || /[$`]|\(\)/.test(r))) {
    const ramo = contexto.ramoAtual?.();
    if (ramo === 'main' || ramo === 'master') return `${DESTINO_PROTEGIDO} (a branch atual)`;
  }
  return null;
}

const COMMIT_LONGAS_COM_VALOR = new Set([
  '--message',
  '--file',
  '--reuse-message',
  '--reedit-message',
  '--template',
  '--fixup',
  '--squash',
  '--date',
  '--cleanup',
  '--trailer',
  '--pathspec-from-file',
]);

function regraCommit(resto) {
  for (let i = 0; i < resto.length; i++) {
    const t = resto[i];
    if (t === '--') break;
    if (t === '--no-verify') return '--no-verify em git commit';
    if (t === '--author' || t.startsWith('--author=')) return 'git commit --author';
    if (COMMIT_LONGAS_COM_VALOR.has(t)) {
      i++;
    } else if (t.startsWith('-') && !t.startsWith('--')) {
      // Opções curtas agrupadas: -n é o --no-verify; m, F, C, c e t recebem um valor.
      const letras = t.slice(1);
      for (let j = 0; j < letras.length; j++) {
        if (letras[j] === 'n') return '--no-verify em git commit';
        if ('mFCct'.includes(letras[j])) {
          if (j === letras.length - 1) i++;
          break;
        }
        if ('Su'.includes(letras[j])) break;
      }
    }
  }
  return null;
}

const CONFIG_COM_VALOR = new Set(['--file', '-f', '--blob', '--default', '--type', '--comment']);
const CONFIG_LEITURA = new Set(['--get', '--get-all', '--get-regexp', '--get-urlmatch', '--list', '-l']);
const CONFIG_ESCRITA = new Set(['--add', '--replace-all', '--unset', '--unset-all']);
const CONFIG_SECAO = new Set(['--rename-section', '--remove-section', 'rename-section', 'remove-section']);
const CONFIG_MODOS = ['set', 'unset', 'get', 'list', 'edit', 'rename-section', 'remove-section'];
const TROCA_DE_IDENTIDADE = 'git config gravando user.name ou user.email';

function regraConfig(resto) {
  const posicionais = [];
  let leitura = false;
  let escrita = false;
  let secao = false;
  for (let i = 0; i < resto.length; i++) {
    const t = resto[i];
    if (/^\d*>>?(\/dev\/null|\$null|nul)?$/i.test(t)) {
      // Redirecionamento de saída (2>/dev/null, > arquivo) não é valor de configuração.
      if (/^\d*>>?$/.test(t)) i++;
    } else if (CONFIG_COM_VALOR.has(t)) i++;
    else if (CONFIG_LEITURA.has(t)) leitura = true;
    else if (CONFIG_ESCRITA.has(t)) escrita = true;
    else if (CONFIG_SECAO.has(t) && t.startsWith('-')) secao = true;
    else if (!t.startsWith('-')) posicionais.push(t);
  }

  let modo = null;
  if (CONFIG_MODOS.includes(posicionais[0])) modo = posicionais.shift();
  if (CONFIG_SECAO.has(modo)) secao = true;

  const chave = (posicionais[0] ?? '').toLowerCase();
  if (secao) return chave === 'user' ? TROCA_DE_IDENTIDADE : null;
  if (chave !== 'user.name' && chave !== 'user.email') return null;
  if (modo === 'set' || modo === 'unset') return TROCA_DE_IDENTIDADE;
  if (modo === 'get' || modo === 'list' || leitura) return null;
  // Só a chave, sem valor, é leitura; com valor (ou --unset, --add...) é gravação.
  return escrita || posicionais.length >= 2 ? TROCA_DE_IDENTIDADE : null;
}

function regraGit(args, contexto) {
  const { sub, resto, configuracoes } = separarGit(args);
  if (configuracoes.some((c) => /^user\.(name|email)=/i.test(c))) {
    return 'git -c user.name ou user.email (troca de autoria)';
  }
  const temForcaCurta = resto.some((t) => ehOpcaoCurta(t) && t.includes('f'));

  switch (sub) {
    case 'push':
      return regraPush(resto, contexto);
    case 'reset':
      return resto.includes('--hard') ? 'git reset --hard' : null;
    case 'clean':
      return 'git clean';
    case 'checkout':
      if (resto.some((t) => ['.', './', ':/', '--'].includes(t))) return 'git checkout com "." ou "--"';
      return resto.includes('--force') || temForcaCurta ? 'git checkout --force' : null;
    case 'switch':
      return resto.includes('--discard-changes') || resto.includes('--force') || temForcaCurta
        ? 'git switch descartando alterações locais'
        : null;
    case 'restore':
      return 'git restore';
    case 'rebase':
      return 'git rebase';
    case 'pull':
      return resto.some((t) => t === '--rebase' || t.startsWith('--rebase=') || (ehOpcaoCurta(t) && t.includes('r')))
        ? 'git pull --rebase'
        : null;
    case 'branch': {
      const apagaForcado = resto.some((t) => /^-[a-zA-Z]*D[a-zA-Z]*$/.test(t));
      const apaga = resto.some((t) => t === '--delete' || /^-[a-zA-Z]*d[a-zA-Z]*$/.test(t));
      return apagaForcado || (apaga && (resto.includes('--force') || temForcaCurta)) ? 'git branch -D' : null;
    }
    case 'stash': {
      const acao = semOpcoes(resto)[0];
      return acao === 'drop' || acao === 'clear' ? `git stash ${acao}` : null;
    }
    case 'filter-branch':
    case 'filter-repo':
      return `git ${sub}`;
    case 'update-ref':
      return resto.includes('-d') ? 'git update-ref -d' : null;
    case 'commit':
      return regraCommit(resto);
    case 'config':
      return regraConfig(resto);
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Outras regras por comando
// ---------------------------------------------------------------------------

const REMOCAO = new Set(['rm', 'del', 'erase', 'rd', 'rmdir', 'ri', 'remove-item']);
const REMOCAO_RECURSIVA = 'remoção recursiva (rm -r, Remove-Item -Recurse, rmdir /s ou del /s)';

function regraRemocao(resto) {
  for (const t of resto) {
    if (t === '--recursive') return REMOCAO_RECURSIVA;
    if (/^-[fiIrRdv]+$/.test(t) && /[rR]/.test(t)) return REMOCAO_RECURSIVA; // rm -r, -rf, -fr, -R
    if (/^-r(e(c(u(r(s(e)?)?)?)?)?)?(:.*)?$/i.test(t)) return REMOCAO_RECURSIVA; // -Recurse e abreviações
    if (/^\/s$/i.test(t)) return REMOCAO_RECURSIVA; // rmdir /s, del /s
  }
  return null;
}

const ARTISAN_PROIBIDOS = new Set([
  'migrate:fresh',
  'migrate:reset',
  'migrate:refresh',
  'migrate:rollback',
  'db:wipe',
]);

function regraArtisan(resto) {
  const achado = resto.map((t) => t.toLowerCase()).find((t) => ARTISAN_PROIBIDOS.has(t));
  return achado ? `artisan ${achado}` : null;
}

function regraDocker(palavra, resto) {
  const palavras = semOpcoes(resto);
  const depoisDe = (nome) => palavras[palavras.indexOf(nome) + 1];
  const compose = palavra === 'docker-compose' || palavras.includes('compose');
  const apagaVolumes = resto.some((t) => t === '--volumes' || (ehOpcaoCurta(t) && t.includes('v')));
  if (compose && palavras.includes('down') && apagaVolumes) return 'docker compose down com -v ou --volumes';
  if (palavras.includes('volume') && ['rm', 'remove', 'prune'].includes(depoisDe('volume'))) {
    return 'docker volume rm ou prune';
  }
  if (palavras.includes('system') && depoisDe('system') === 'prune') return 'docker system prune';
  return null;
}

function regraGh(resto) {
  const palavras = semOpcoes(resto);
  if (palavras[0] === 'repo' && palavras[1] === 'delete') return 'gh repo delete';
  if (palavras[0] === 'api') {
    for (let i = 0; i < resto.length; i++) {
      const junto = /^(?:-X|--method=)(.+)$/.exec(resto[i]);
      const metodo = resto[i] === '-X' || resto[i] === '--method' ? resto[i + 1] : junto?.[1];
      if ((metodo ?? '').toUpperCase() === 'DELETE') return 'gh api com o método DELETE';
    }
  }
  return null;
}

// Programas que recebem outro comando como texto (ex.: bash -c "...").
const INTERPRETADORES = new Map([
  ['bash', 'Bash'],
  ['sh', 'Bash'],
  ['zsh', 'Bash'],
  ['dash', 'Bash'],
  ['wsl', 'Bash'],
  ['eval', 'Bash'],
  ['cmd', 'PowerShell'],
  ['powershell', 'PowerShell'],
  ['pwsh', 'PowerShell'],
  ['iex', 'PowerShell'],
  ['invoke-expression', 'PowerShell'],
]);

/** Procura um comando proibido em qualquer posição do comando simples (cobre sudo, env, xargs...). */
function analisarSegmento(tokens, contexto) {
  for (let i = 0; i < tokens.length; i++) {
    const palavra = nomeDoComando(tokens[i]);
    const resto = tokens.slice(i + 1);
    let regra = null;
    if (palavra === 'git') regra = regraGit(resto, contexto);
    else if (REMOCAO.has(palavra)) regra = regraRemocao(resto);
    else if (palavra === 'artisan') regra = regraArtisan(resto);
    else if (palavra === 'docker' || palavra === 'docker-compose') regra = regraDocker(palavra, resto);
    else if (palavra === 'gh') regra = regraGh(resto);
    else if (INTERPRETADORES.has(palavra)) {
      for (const t of resto) {
        if (/\s/.test(t)) regra = analisar(t, INTERPRETADORES.get(palavra), contexto);
        if (regra) break;
      }
    }
    if (regra) return regra;
  }
  return null;
}

// Em "$(cat <<'FIM' ... FIM)" o corpo é só texto (mensagem de commit, corpo de PR). Vale apenas com o
// delimitador entre aspas: sem aspas, o Bash ainda executa $(...) dentro do corpo, que segue analisado.
const semCorpoDeHeredoc = (trecho) =>
  trecho.replace(/^(\s*cat\s*<<-?\s*(['"])(\w+)\2[ \t]*\r?)\n(?:[\s\S]*?\n)??[ \t]*\3[ \t]*\r?(?=\n|$)/, '$1');

/** Devolve o nome da regra que bloqueia o comando, ou null se ele pode rodar. */
function analisar(comando, ferramenta, contexto = {}) {
  // Regras sobre o texto inteiro (valem também dentro de aspas).
  if (/\bGIT_(AUTHOR|COMMITTER)_[A-Z]+/i.test(comando)) return 'variáveis GIT_AUTHOR_* ou GIT_COMMITTER_*';
  if (/\bdrop\s+(database|schema|table)\b/i.test(comando) || /\btruncate\b/i.test(comando)) {
    return 'DROP DATABASE, DROP SCHEMA, DROP TABLE ou TRUNCATE';
  }

  const { segmentos, aninhados } = lexar(comando, ferramenta);
  for (const tokens of segmentos) {
    const regra = analisarSegmento(tokens, contexto);
    if (regra) return regra;
  }
  for (const interno of aninhados) {
    const regra = analisar(semCorpoDeHeredoc(interno), ferramenta, contexto);
    if (regra) return regra;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Documentação viva: antes de enviar ou de finalizar o PR
// ---------------------------------------------------------------------------

/** 'push' antes de git push; 'pronto' antes de gh pr ready ou gh pr merge; null nos demais. */
function nivelDeDocs(comando, ferramenta) {
  const { segmentos, aninhados } = lexar(comando, ferramenta);
  let nivel = null;
  for (const tokens of segmentos) {
    for (let i = 0; i < tokens.length; i++) {
      const palavra = nomeDoComando(tokens[i]);
      const resto = tokens.slice(i + 1);
      if (palavra === 'git' && separarGit(resto).sub === 'push') nivel ??= 'push';
      if (palavra === 'gh') {
        const palavras = semOpcoes(resto);
        if (palavras[0] === 'pr' && (palavras[1] === 'ready' || palavras[1] === 'merge')) nivel = 'pronto';
      }
    }
  }
  for (const interno of aninhados) {
    const nivelInterno = nivelDeDocs(semCorpoDeHeredoc(interno), ferramenta);
    if (nivelInterno === 'pronto') nivel = 'pronto';
    else nivel ??= nivelInterno;
  }
  return nivel;
}

/** Roda o verificar-docs; devolve null se passou ou a saída dele se faltou algo. */
function rodarVerificarDocs(nivel) {
  const script = path.join(RAIZ, 'scripts', 'verificar-docs.mjs');
  try {
    execFileSync(process.execPath, [script, `--nivel=${nivel}`], {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return null;
  } catch (erro) {
    if (typeof erro.status === 'number' && erro.status !== 0) {
      return `${erro.stdout ?? ''}${erro.stderr ?? ''}`.trim();
    }
    throw erro;
  }
}

function ramoAtual(pasta) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: pasta && existsSync(pasta) ? pasta : RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Autoteste
// ---------------------------------------------------------------------------

const DEVEM_BLOQUEAR = [
  'git reset --hard HEAD~1',
  'npm test && git reset --hard',
  'git push --force origin feature/x',
  'git push -f',
  'git push --force-with-lease',
  'git push origin main',
  'git push origin +feature/x',
  'git clean -fd',
  'git checkout -- .',
  'git checkout .',
  'git restore app.js',
  'git rebase main',
  'git branch -D feature/x',
  'git stash clear',
  'git commit --no-verify -m "x"',
  'git commit --author="Fulano <f@x.com>" -m "x"',
  'git config user.email outro@x.com',
  'git config --global user.name Outro',
  'GIT_AUTHOR_NAME=Outro git commit -m x',
  'rm -rf backend/vendor',
  'Remove-Item -Recurse -Force node_modules',
  'php backend/artisan migrate:fresh --seed',
  'php artisan db:wipe',
  'docker compose down -v',
  'psql -c "drop table users"',
  'gh repo delete x --yes',
  // Regressões da revisão (além da lista da especificação):
  'git push origin $(git branch --show-current) --force',
  'gh api repos/{owner}/{repo}/git/refs/heads/x -X DELETE',
  'php "C:\\projetos\\volley pro\\backend\\artisan" migrate:fresh',
  'bash -c "$(cat <<\'EOF\'\nrm -rf x\nEOF\n)"',
  'bash -c @\'\nrm -rf x\n\'@',
  'bash -c "git push origin feature/x \\\n--force"',
];

const DEVEM_PASSAR = [
  'git status',
  'git commit -m "feat(api): saude"',
  'git config user.email',
  'git push -u origin feature/pr-01-backend',
  'git merge origin/main',
  'npm run verificar',
  'php backend/artisan migrate',
  'rm arquivo-temporario.txt',
  'docker compose up -d',
  'gh pr create --draft --title "PR-01: x"',
  // Regressões da revisão: ler a identidade com redirecionamento e citar um comando em um heredoc.
  'git config user.name 2>/dev/null',
  'git commit -m "$(cat <<\'EOF\'\ndocs: o guarda bloqueia git reset --hard\nEOF\n)"',
];

function autoteste() {
  // Não chama o verificar-docs: só testa a análise dos comandos.
  const contexto = { ramoAtual: () => 'feature/pr-00-exemplo' };
  let falhas = 0;
  const registrar = (passou, descricao) => {
    if (!passou) falhas++;
    console.log(`${passou ? 'OK' : 'FALHOU'} - ${descricao.replace(/\r?\n/g, '\\n')}`);
  };

  for (const comando of DEVEM_BLOQUEAR) {
    registrar(
      FERRAMENTAS.every((f) => analisar(comando, f, contexto) !== null),
      `bloqueia: ${comando}`,
    );
  }
  for (const comando of DEVEM_PASSAR) {
    registrar(
      FERRAMENTAS.every((f) => analisar(comando, f, contexto) === null),
      `permite: ${comando}`,
    );
  }

  // O próprio script como processo filho, recebendo o evento pelo stdin.
  const viaStdin = (comando, codigoEsperado) => {
    const evento = JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: comando },
    });
    let codigo = 0;
    try {
      execFileSync(process.execPath, [ESTE_ARQUIVO], { input: evento, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (erro) {
      codigo = typeof erro.status === 'number' ? erro.status : -1;
    }
    registrar(codigo === codigoEsperado, `via stdin, código ${codigoEsperado} (veio ${codigo}): ${comando}`);
  };
  viaStdin('git reset --hard HEAD~1', 2);
  viaStdin('git status', 0);

  const total = DEVEM_BLOQUEAR.length + DEVEM_PASSAR.length + 2;
  console.log(falhas === 0 ? `guarda-comandos: ${total} casos OK.` : `guarda-comandos: ${falhas} caso(s) FALHOU.`);
  return falhas === 0 ? 0 : 1;
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

async function lerEvento() {
  let texto = '';
  process.stdin.setEncoding('utf8');
  for await (const pedaco of process.stdin) texto += pedaco;
  return JSON.parse(texto.replace(/^﻿/, ''));
}

async function principal() {
  if (process.argv.includes('--autoteste')) return autoteste();

  const evento = await lerEvento();
  const ferramenta = evento?.tool_name;
  const comando = evento?.tool_input?.command;
  if (!FERRAMENTAS.includes(ferramenta) || typeof comando !== 'string' || comando.trim() === '') return 0;

  const regra = analisar(comando, ferramenta, { ramoAtual: () => ramoAtual(evento.cwd) });
  if (regra) {
    process.stderr.write(
      `Bloqueado pelo guarda do projeto: ${regra}. Se for realmente necessário, peça ao humano para executar.\n`,
    );
    return 2;
  }

  const nivel = nivelDeDocs(comando, ferramenta);
  if (nivel) {
    const saida = rodarVerificarDocs(nivel);
    if (saida !== null) {
      process.stderr.write(`Bloqueado pelo guarda do projeto: documentação viva incompleta (nível ${nivel}).\n${saida}\n`);
      return 2;
    }
  }
  return 0;
}

// Falha segura: qualquer erro interno bloqueia o comando.
try {
  process.exitCode = await principal();
} catch (erro) {
  process.stderr.write(`guarda-comandos falhou: ${erro?.message ?? erro}\n`);
  process.exitCode = 2;
}
