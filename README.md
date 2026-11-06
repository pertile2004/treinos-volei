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
Pré-requisitos: Git, Node 24 ou mais novo e o GitHub CLI. As instruções do backend (PHP, Composer e Docker) entram com o PR-01.

1. `npm run setup` — git hooks e conferência do ambiente.
2. `npm ci` e `npm --prefix frontend ci` — dependências da raiz e do front.
3. `npm run dev:web` — sobe só o front em http://localhost:5173.
4. `npm run verificar` — o que o CI roda (documentação, autoria, lint, testes e build do front).

Outros comandos do front, sempre a partir da raiz:
- `npm run teste:web` — testes (Vitest); `npm --prefix frontend run test:cobertura` mostra a cobertura.
- `npm --prefix frontend run lint` e `npm --prefix frontend run formatar` — ESLint e Prettier.
- `npm --prefix frontend run build` e `npm --prefix frontend run preview` — build de produção e prévia em http://localhost:4173.
- `npm run dev` — banco (Docker), API e front juntos; depende do backend do PR-01.

O Vite encaminha /api, /sanctum e /docs para a API em http://127.0.0.1:8000. Sem a API no ar, as telas abrem e http://localhost:5173/dev/status mostra uma mensagem de erro com o botão "Tentar de novo". Para usar outras portas, defina E2E_WEB_PORT (front) e E2E_API_PORT (API) antes do comando.

## Equipe
docs/INTEGRANTES.md

## Aviso sobre idade (ECA Digital)
Este é um trabalho acadêmico e o cadastro não verifica idade. Um produto real acessível a menores precisaria atender à Lei 15.211/2025 (verificação de idade confiável e vínculo com responsável para menores de 16, entre outros pontos).
