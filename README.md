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
Sempre a partir da raiz do repositório (Windows: Git Bash ou PowerShell). O frontend entra com o PR-02.

Requisitos: Node 24, PHP 8.4 com a extensão pdo_pgsql, Composer e Docker Desktop (ou um PostgreSQL 17 local).

Primeira vez:
1. `npm run setup` — git hooks e conferência do ambiente.
2. `composer --working-dir=backend install`
3. Copie `backend/.env.example` para `backend/.env` e rode `php backend/artisan key:generate`.

Com Docker:
- `npm run dev` sobe o PostgreSQL e o Mailpit (`docker compose up -d --wait`), roda as migrations e inicia a API em http://127.0.0.1:8000.
- O Mailpit mostra os e-mails enviados em http://localhost:8025.

Sem Docker (PostgreSQL instalado na máquina):
1. Crie o usuário `volleypro` (senha `volleypro`, só para desenvolvimento) e os bancos `volleypro` e `volleypro_teste`, os dois com esse usuário como dono.
2. `php backend/artisan migrate`
3. `php backend/artisan serve --host=127.0.0.1 --port=8000`

Conferir: http://127.0.0.1:8000/up, http://127.0.0.1:8000/api/v1/saude e a documentação da API em http://127.0.0.1:8000/docs/api (só em desenvolvimento).

Testes e qualidade:
- `npm run teste:api` — testes do backend (usa o banco `volleypro_teste`). Se o npm não encontrar o Composer no Windows, rode `composer --working-dir=backend test`.
- `npm run verificar` — tudo que o CI roda.
- `composer --working-dir=backend formatar` — formata o PHP com o Pint.

## Equipe
docs/INTEGRANTES.md

## Aviso sobre idade (ECA Digital)
Este é um trabalho acadêmico e o cadastro não verifica idade. Um produto real acessível a menores precisaria atender à Lei 15.211/2025 (verificação de idade confiável e vínculo com responsável para menores de 16, entre outros pontos).
