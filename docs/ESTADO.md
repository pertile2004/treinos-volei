# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-26 — PWA instalável — Integrante 3 — 2026-11-06 (frente paralela; as telas 04–21 estão sendo construídas em outras branches a partir da mesma base do PR-03)
- O que entrou: vite-plugin-pwa 2.0.0 em frontend/vite.config.js com manifest em pt-BR ("VOLLEY PRO", tema #0E0E0E, ícones 192/512 any e maskable em frontend/public/icones/), pré-cache do app shell, fallback de navegação fora de /api, /sanctum, /docs, /up e /pulse e stale-while-revalidate só para GET de /exercicios e /treinos (só 200; /eu nunca cacheado); AvisoNovaVersao (15º componente do design system) e src/app/AtualizacaoDoApp.jsx (registro do service worker e "Atualizar"/"Depois"); src/lib/pwa.js com limparCachesDoApp() (chamada em todo 401) e encerrarSessaoLocal(queryClient) para o logout do PR-05. ADR-026.
- Antes: PR-03 — Design system (Integrante 4), PR-02 — Esqueleto do frontend e PR-01 — Esqueleto do backend (Integrante 2), todos em 2026-11-06; veja docs/historico/.
- Como testar:
  1. `npm ci`, `npm --prefix frontend ci`, `composer --working-dir=backend install`; copie backend/.env.example para backend/.env e rode `php backend/artisan key:generate`.
  2. `npm run verificar` (o build do front imprime "PWA v2.0.0 ... precache 18 entries" e gera frontend/dist/sw.js e manifest.webmanifest).
  3. `npm --prefix frontend run build` e `npm --prefix frontend run preview`; no Chrome/Edge abra http://localhost:4173 > DevTools > Application > Manifest (sem erros, com a opção de instalar); rode o build de novo e recarregue para ver "Nova versão disponível."; em desenvolvimento (`npm run dev`) o service worker não existe.
- Próximo: PR-04 — Cadastro, Termos e Privacidade — Integrante 5 (depende do PR-01 e do PR-03). O PR-27 (modo offline do treino) depende deste PR-26 e do PR-16.

## Em andamento
- (nenhum)

## Pendências
- [ ] PR-26, aceite não conferido nesta máquina (sem navegador real): abrir o build servido (`vite preview`) no Chrome/Edge, confirmar em DevTools > Application que não há erro de instalabilidade e que o navegador oferece instalar; provocar uma versão nova e conferir o aviso e o "Atualizar". Registrar a evidência em docs/historico/PR-26.md.
- [ ] PR-26: frontend/e2e/pwa.spec.js foi escrito mas não executado (não há Playwright nesta branch). Quem criar o playwright.config.js (PR-05) roda esse spec contra o `vite preview` (não o dev) e ajusta o que ele supõe das telas; o aceite "sem rede mostra a biblioteca já vista" completo (Biblioteca e detalhes) só pode ser conferido quando as telas (PR-08+) e o login (PR-05) existirem.
- [ ] PR-05: no sucesso de "sair" e no DELETE /eu, chamar `encerrarSessaoLocal(queryClient)` de frontend/src/lib/pwa.js (limpa o TanStack Query e os caches de API do service worker).
- [ ] PR-26, janela aceita do stale-while-revalidate: um exercício excluído ou que perdeu visibilidade (RN-06/RN-07) pode aparecer por um carregamento na lista em cache; a revalidação corrige na leitura seguinte. Mensagem própria de "offline sem cache" fica para quando as telas existirem.
- [ ] PR-30 (deploy no Laravel): servir sw.js e manifest.webmanifest da raiz do site, sem cache HTTP longo no sw.js e sem cair no fallback do index.html; a CSP precisa permitir o service worker e o manifest da mesma origem.
- [ ] `npm audit` do frontend passa a listar também vulnerabilidades low/moderate transitivas do workbox-build (glob, minimatch, deepmerge), via vite-plugin-pwa; não barra o CI (nível high).
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores. O job `frontend` só roda no GitHub quando o PR é aberto; no PR-02 e no PR-03 a mesma sequência foi rodada só na máquina.
- [ ] PR-03, aceite sem evidência: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar lado a lado com /dev/componentes; se houver diferença, ajustar os tokens (frontend/src/estilos/tokens.css e docs/DESIGN.md) e confirmar a fonte (ADR-022).
- [ ] PR-03, não conferido: leitor de tela real (o botão de senha troca o nome e também usa `aria-pressed`; o Cronometro anuncia a cada minuto), área segura do iPhone na NavInferior e navegador com fonte padrão diferente de 16 px (o limite de 1024 px do `useLarguraMinima` deixa de coincidir com o `lg` do Tailwind).
- [ ] PR-03: conferir no navegador o AppShell (navegação fixa embaixo, coluna lateral a partir de 1024 px e o link "Pular para o conteúdo"). No PR-02 o layout foi conferido só por testes de componente, sem abrir o navegador.
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): o docker-compose.yml, o script de init do banco de teste e o caminho completo do `npm run dev` (Docker, migrations, API e front juntos). Quem tiver Docker: rode `npm run dev` e confira /up e /api/v1/saude em http://127.0.0.1:8000 e a /dev/status em http://localhost:5173.
- [ ] PR-01: o job `backend` do CI (com cobertura por pcov) só roda no GitHub, depois do push; confira que ficou verde antes do merge.
- [ ] PR-01: o grupo precisa confirmar os valores do enum Nivel (iniciante, intermediario, avancado), que a especificação não lista (ADR-021).
- [ ] PR-01: backend/AGENTS.md é o arquivo que vem no esqueleto do Laravel (o Boost foi instalado só para o Claude Code e não o reescreveu); ele manda instalar o PHP por script remoto e rodar o boost:install de novo. O grupo decide se remove.
- [ ] PR-01: `npm run teste:api` precisa do `composer` visível para o cmd do Windows (composer.bat). Se o npm não achar o Composer, use `composer --working-dir=backend test` ou `npm run verificar`.
- [ ] PR-01: a falha real do banco na rota de saúde (VerificadorBancoPdo) só tem evidência manual (503 com a API apontada para uma porta fechada); o teste automatizado troca a implementação.
- [ ] PR-01 (revisão): não há rate limit na API. Não entrou no /saude porque o throttle usa o cache, que fica no banco (CACHE_STORE=database), e derrubaria a rota junto com o banco. Definir no PR-04/PR-05 (login) o throttle das rotas e o armazenamento do contador.
- [ ] PR-01 (revisão): no deploy, definir LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL com a origem real e configurar trustProxies se houver proxy terminando o TLS.
- [ ] Backend e frontend juntos: abrir /dev/status com a API real e conferir o formato de /api/v1/saude (a página aceita os campos na raiz ou dentro de `data`). No PR-02 isso foi conferido só com MSW e com o proxy respondendo 502 sem a API.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- Componentes fora da lista do PR-03: Select, Toast e Tabela.
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
