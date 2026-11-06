# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-28 — Observabilidade e análise de qualidade — Integrante 5 — 2026-11-06 (branch feature/pr-28-observabilidade, feita a partir do PR-03 em paralelo com os cards 04 a 21; nesta branch as páginas ainda são espaços reservados).
- O que entrou: Laravel Pulse 1.8.1 com o painel /pulse só para admin (gate viewPulse; os outros recebem 403); middleware RegistrarRequisicao com uma linha JSON por requisição no canal `requisicoes` (request_id, método, padrão da rota, status, duração em ms, usuário), fonte da latência e da taxa de erros por rota; correlação conferida de ponta a ponta (front → X-Request-Id → JSON de erro e log → tela), com "Copiar código" e pedido para informar o código ao suporte na MensagemDeErro; link "Métricas" na área admin e proxy do Vite para /pulse e Livewire; sonar-project.properties e job `sonar` no CI, que só roda com o segredo SONAR_TOKEN.
- Antes dele: PR-03 — Design system (tokens, 14 componentes, /dev/componentes), PR-02 — esqueleto do frontend e PR-01 — esqueleto do backend (GET /api/v1/saude e /referencias, X-Request-Id, erros JSON).
- Como testar:
  1. `npm ci`, `npm --prefix frontend ci`, `composer --working-dir=backend install`; copie backend/.env.example para backend/.env, `php backend/artisan key:generate` e `php backend/artisan migrate` (cria também as tabelas pulse_*).
  2. `npm run verificar` (58 testes no backend, 328 no frontend, lint, análise e build).
  3. `npm run dev:api` e `npm run dev:web`; peça http://localhost:5173/api/v1/nao-existe e procure o `request_id` da resposta em backend/storage/logs/requisicoes-AAAA-MM-DD.log; abra http://localhost:5173/dev/status com a API parada para ver "Código do erro" e "Copiar código". /pulse só abre para admin (coluna papel chega com o PR-04).
- Próximo: PR-04 — Cadastro, Termos e Privacidade — Integrante 5 (depende do PR-01 e do PR-03, os dois concluídos). Os cards 04 a 21 estão sendo feitos em paralelo em outras branches; o PR-29 depende do PR-28 e dos não cortados de 22 a 28.

## Em andamento
- (nenhum)

## Pendências
- [ ] PR-28: abrir o painel /pulse num navegador real com um admin (a coluna users.papel chega com o PR-04) e conferir que os cartões carregam pelo proxy do Vite (/pulse e /livewire-<hash>/update); aqui só há teste Pest (200 com "Pulse" no HTML) e teste da regra do proxy.
- [ ] PR-28: fluxo Playwright da correlação (pedir um 404 real pela interface e conferir X-Request-Id no header, no JSON e no código da tela) entra quando o PR-05 trouxer playwright.config.js e o webServer; a correlação está coberta por Pest (header, JSON e log) e por Vitest com MSW (header enviado = código na tela e copiado).
- [ ] PR-28: dono do repositório cadastra o segredo SONAR_TOKEN e confirma `sonar.projectKey`/`sonar.organization` em sonar-project.properties; a primeira execução no GitHub confere o job `sonar`, a opção `--coverage-clover` do Pest e o mapeamento dos caminhos do lcov (esta máquina não tem Xdebug nem PCOV). Sem o segredo o job fica verde e pulado. O job não deve ser obrigatório para o merge.
- [ ] PR-28 (deploy, PR-30): o Pulse grava no banco a cada requisição; no Neon grátis decidir entre PULSE_ENABLED=false, amostragem (PULSE_*_SAMPLE_RATE) e retenção (PULSE_STORAGE_KEEP). Em produção, LOG_REQUISICOES_CHANNEL=stderr. Se a CSP do PR-29 bloquear o painel (Livewire com scripts inline), ajustar só para a rota /pulse.
- [ ] PR-28: no merge com os cards 05, 09 e 26, manter `<LinkMetricas />` na área admin, um só `test.exclude` no vite.config.js se o PR-05 trouxer e2e/, e /pulse e /livewire-* fora do fallback do service worker.
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
