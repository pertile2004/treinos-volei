# VOLLEY PRO
Plataforma web de treino individual de vôlei: monte treinos por fundamento, execute com cronômetro, registre acertos e veja sua evolução em números.

Status: em desenvolvimento — veja docs/ESTADO.md.

## Stack
- API: Laravel 13 (PHP 8.4, Eloquent, PostgreSQL, Sanctum)
- Front: React + Vite + Tailwind
- Testes: Pest, Vitest e Playwright
- CI: GitHub Actions

## Documentação
docs/ESPECIFICACAO.md · docs/ARQUITETURA.md · docs/MODELO-DE-DADOS.md · docs/API.md · docs/DESIGN.md · docs/ROADMAP.md

## Como rodar
Sempre a partir da raiz do repositório (Windows: Git Bash ou PowerShell).

Requisitos: Git, Node 24 ou mais novo, PHP 8.4 com a extensão pdo_pgsql, Composer, o GitHub CLI e Docker Desktop (ou um PostgreSQL 17 local).

Primeira vez:
1. `npm run setup` — git hooks e conferência do ambiente.
2. `npm ci` e `npm --prefix frontend ci` — dependências da raiz e do front.
3. `composer --working-dir=backend install`
4. Copie `backend/.env.example` para `backend/.env` e rode `php backend/artisan key:generate`.

Com Docker:
- `npm run dev` sobe o PostgreSQL e o Mailpit (`docker compose up -d --wait`), roda as migrations e inicia juntos a API em http://127.0.0.1:8000 e o front em http://localhost:5173.
- O Mailpit mostra os e-mails enviados em http://localhost:8025.

Sem Docker (PostgreSQL instalado na máquina):
1. Crie o usuário `volleypro` (senha `volleypro`, só para desenvolvimento) e os bancos `volleypro` e `volleypro_teste`, os dois com esse usuário como dono.
2. `php backend/artisan migrate`
3. `npm run dev:api` — só a API em http://127.0.0.1:8000.
4. Em outro terminal, `npm run dev:web` — só o front em http://localhost:5173.

Conferir: http://127.0.0.1:8000/up, http://127.0.0.1:8000/api/v1/saude, a documentação da API em http://127.0.0.1:8000/docs/api (só em desenvolvimento) e http://localhost:5173/dev/status.

O Vite encaminha /api, /sanctum e /docs para a API em http://127.0.0.1:8000. Sem a API no ar, as telas abrem e http://localhost:5173/dev/status mostra uma mensagem de erro com o botão "Tentar de novo". Para usar outras portas, defina E2E_WEB_PORT (front) e E2E_API_PORT (API) antes do comando.

O catálogo do design system fica em http://localhost:5173/dev/componentes (só em desenvolvimento): todos os componentes de frontend/src/componentes/ em todos os estados. Os tokens e a tabela de contraste estão no docs/DESIGN.md.

Testes e qualidade:
- `npm run verificar` — tudo que o CI roda (documentação, autoria, lint, análise e testes do backend, lint, testes e build do front).
- `npm run teste:api` — testes do backend (usa o banco `volleypro_teste`). Se o npm não encontrar o Composer no Windows, rode `composer --working-dir=backend test`.
- `npm run teste:web` — testes do front (Vitest); `npm --prefix frontend run test:cobertura` mostra a cobertura.
- `composer --working-dir=backend formatar` — formata o PHP com o Pint.
- `npm --prefix frontend run lint` e `npm --prefix frontend run formatar` — ESLint e Prettier.
- `npm --prefix frontend run build` e `npm --prefix frontend run preview` — build de produção e prévia em http://localhost:4173. É na prévia (não no `dev`) que o PWA existe: manifest, service worker e a oferta de instalação do Chrome/Edge. Se o navegador ficar preso numa versão antiga, clique em "Atualizar" no aviso ou use DevTools > Application > Service Workers > Unregister.

## Equipe
docs/INTEGRANTES.md

## Aviso sobre idade (ECA Digital)
Este é um trabalho acadêmico e o cadastro não verifica idade. Um produto real acessível a menores precisaria atender à Lei 15.211/2025 (verificação de idade confiável e vínculo com responsável para menores de 16, entre outros pontos).
