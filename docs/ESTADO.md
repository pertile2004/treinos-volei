# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-01 — Esqueleto do backend — Integrante 2 — 2026-11-06 (o PR-02 — Esqueleto base do frontend — Integrante 3 entrou na main no mesmo dia, antes dele).
- O que entrou no PR-01: API Laravel 13 (PHP 8.4) em backend/ com PostgreSQL; GET /api/v1/saude e GET /api/v1/referencias; seis enums com rótulo em pt-BR; X-Request-Id em toda resposta e em cada linha do log JSON; erros de /api/* em JSON padrão; cabeçalhos de segurança; CORS só para a origem do front (FRONTEND_URL), com credenciais; mensagens de validação em pt_BR; Pest, Larastan nível 6, Pint, Scramble e Laravel Boost; docker-compose.yml (PostgreSQL 17 e Mailpit); `npm run dev:api` e `npm run teste:api`; job `backend` no CI. Ainda não há autenticação nem models de domínio.
- O que já estava na main (PR-02): frontend/ com Vite 8, React 19, Tailwind 4, React Router e TanStack Query; src/lib/http.js (X-Request-Id, 419 repete uma vez, 401 manda para /entrar) e src/lib/erros.js; AppShell com a navegação (Início, Biblioteca, Treino, Evolução); as 23 telas da especificação só com o título, a 404 e a /dev/status (só em dev); os componentes Pagina, Carregando, MensagemDeErro e EstadoVazio; ESLint, Prettier e Vitest com Testing Library e MSW; scripts `dev:web` e `teste:web`; job `frontend` no CI.
- Juntos: `npm run dev` prepara o banco (Docker e migrations) e sobe a API e o front com o concurrently; `npm run verificar` roda backend e frontend.
- Próximo: PR-03 — Design system a partir do Figma — Integrante 4 (depende do PR-02 e das telas do Figma em docs/design/telas/). Depois, PR-04 — Cadastro, Termos e Privacidade — Integrante 5 (depende do PR-01 e do PR-03).
- Como testar o que existe:
  1. `npm run setup`, `npm ci`, `npm --prefix frontend ci` e `composer --working-dir=backend install`; copie backend/.env.example para backend/.env e rode `php backend/artisan key:generate`.
  2. `npm run dev` (com Docker) ou, com PostgreSQL local, `php backend/artisan migrate`, `npm run dev:api` e `npm run dev:web`; abra http://127.0.0.1:8000/api/v1/saude, /api/v1/referencias e http://localhost:5173/dev/status.
  3. `npm run verificar`.

## Em andamento
- (nada)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores.
- [ ] Antes do PR-03: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/.
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): o docker-compose.yml, o script de init do banco de teste e o caminho completo do `npm run dev` (Docker, migrations, API e front juntos). Quem tiver Docker: rode `npm run dev` e confira /up e /api/v1/saude em http://127.0.0.1:8000 e a /dev/status em http://localhost:5173.
- [ ] PR-01: o job `backend` do CI (com cobertura por pcov) só roda no GitHub, depois do push; confira que ficou verde antes do merge.
- [ ] PR-01: o grupo precisa confirmar os valores do enum Nivel (iniciante, intermediario, avancado), que a especificação não lista (ADR-021).
- [ ] PR-01: backend/AGENTS.md é o arquivo que vem no esqueleto do Laravel (o Boost foi instalado só para o Claude Code e não o reescreveu); ele manda instalar o PHP por script remoto e rodar o boost:install de novo. O grupo decide se remove.
- [ ] PR-01: `npm run teste:api` precisa do `composer` visível para o cmd do Windows (composer.bat). Se o npm não achar o Composer, use `composer --working-dir=backend test` ou `npm run verificar`.
- [ ] PR-01: a falha real do banco na rota de saúde (VerificadorBancoPdo) só tem evidência manual (503 com a API apontada para uma porta fechada); o teste automatizado troca a implementação.
- [ ] PR-01 (revisão): não há rate limit na API. Não entrou no /saude porque o throttle usa o cache, que fica no banco (CACHE_STORE=database), e derrubaria a rota junto com o banco. Definir no PR-04/PR-05 (login) o throttle das rotas e o armazenamento do contador.
- [ ] PR-01 (revisão): no deploy, definir LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL com a origem real e configurar trustProxies se houver proxy terminando o TLS.
- [ ] Depois do merge do PR-01: abrir /dev/status com a API real e conferir o formato de /api/v1/saude (a página aceita os campos na raiz ou dentro de `data`). No PR-02 isso foi conferido só com MSW e com o proxy respondendo 502 sem a API.
- [ ] PR-03: conferir no navegador o AppShell (navegação fixa embaixo, coluna lateral a partir de 1024 px e o link "Pular para o conteúdo"). No PR-02 o layout foi conferido só por testes de componente, sem abrir o navegador.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
