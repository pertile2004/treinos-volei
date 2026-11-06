# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-03 — Design system a partir do Figma — Integrante 4 — 2026-11-06
- O que entrou: tokens finais no `@theme` do Tailwind (novos: `borda-controle`, `font-sans`, `text-destaque` e `text-cronometro`) e redução de movimento; os 14 componentes do docs/DESIGN.md em frontend/src/componentes/ (Botao, CampoTexto, Cartao, ChipFiltro, Etiqueta, Abas, Cabecalho, NavInferior, BarraLateral, Stepper, BarraDeProgresso, Cronometro, Avatar e ModalDeConfirmacao), cada um com teste de Testing Library e axe; o catálogo /dev/componentes (só em desenvolvimento); o AppShell com NavInferior abaixo de 1024 px e BarraLateral a partir daí; a tabela de contraste no docs/DESIGN.md; vitest-axe 0.1.0.
- Feito sem o Figma e sem as telas exportadas (ADR-022): vale o docs/DESIGN.md; a comparação com o Figma está nas pendências.
- Do PR-01 — Esqueleto do backend — Integrante 2 (mesmo dia): backend no ar em backend/ (Laravel 13, PostgreSQL), com GET /api/v1/saude e GET /api/v1/referencias; `npm run dev` sobe banco, API e front e `npm run verificar` roda backend e frontend juntos.
- Como testar:
  1. `npm run setup`, `npm ci`, `npm --prefix frontend ci` e `composer --working-dir=backend install`; copie backend/.env.example para backend/.env e rode `php backend/artisan key:generate`.
  2. `npm run dev` (com Docker) ou, com PostgreSQL local, `php backend/artisan migrate`, `npm run dev:api` e `npm run dev:web`; abra http://127.0.0.1:8000/api/v1/saude, /api/v1/referencias e http://localhost:5173/dev/componentes (navegue com Tab; teste em 360 px e em 1440 px).
  3. `npm run verificar` (backend e frontend).
- Próximo: PR-04 — Cadastro, Termos e Privacidade — Integrante 5 (depende do PR-01 e do PR-03, os dois concluídos).

## Em andamento
- (nenhum)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores. O job `frontend` só roda no GitHub quando o PR é aberto; no PR-02 e no PR-03 a mesma sequência foi rodada só na máquina.
- [ ] PR-03 (revisão): o PR #4 tem base na main mas está em cima da branch do PR-01 (#3, aberto). Mergear o #3 antes e, antes de mergear o #4, conferir que `git diff origin/main...HEAD --stat` ficou só com frontend/ e docs do PR-03 (~59 arquivos).
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
