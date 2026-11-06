# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-01 — Esqueleto do backend — Integrante 2 — 2026-11-06
- O que entrou: API Laravel 13 (PHP 8.4) em backend/ com PostgreSQL; GET /api/v1/saude e GET /api/v1/referencias; seis enums com rótulo em pt-BR; X-Request-Id em toda resposta e em cada linha do log JSON; erros de /api/* em JSON padrão; cabeçalhos de segurança; mensagens de validação em pt_BR; Pest, Larastan nível 6, Pint, Scramble e Laravel Boost; docker-compose.yml (PostgreSQL 17 e Mailpit); `npm run dev` e `npm run teste:api`; job `backend` no CI. Ainda não há autenticação, models de domínio nem frontend.
- Próximo: PR-02 — Esqueleto base do frontend — Integrante 3 (depende só do PR-00). Depois dele, PR-03 — Design system a partir do Figma — Integrante 4.
- Como testar o que existe:
  1. `composer --working-dir=backend install`, copie backend/.env.example para backend/.env e rode `php backend/artisan key:generate`.
  2. `npm run dev` (com Docker) ou, com PostgreSQL local, `php backend/artisan migrate` e `php backend/artisan serve`; abra http://127.0.0.1:8000/api/v1/saude e /api/v1/referencias.
  3. `npm run verificar`.

## Em andamento
- (nenhum)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores.
- [ ] Antes do PR-03: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/.
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): o docker-compose.yml, o script de init do banco de teste e o caminho completo do `npm run dev`. Quem tiver Docker: rode `npm run dev` e confira /up e /api/v1/saude em http://127.0.0.1:8000.
- [ ] PR-01: o job `backend` do CI (com cobertura por pcov) só roda no GitHub, depois do push; confira que ficou verde antes do merge.
- [ ] PR-01: o grupo precisa confirmar os valores do enum Nivel (iniciante, intermediario, avancado), que a especificação não lista (ADR-019).
- [ ] PR-01: backend/AGENTS.md é o arquivo que vem no esqueleto do Laravel (o Boost foi instalado só para o Claude Code e não o reescreveu); ele manda instalar o PHP por script remoto e rodar o boost:install de novo. O grupo decide se remove.
- [ ] PR-01: `npm run teste:api` precisa do `composer` visível para o cmd do Windows (composer.bat). Se o npm não achar o Composer, use `composer --working-dir=backend test` ou `npm run verificar`.
- [ ] PR-01: a falha real do banco na rota de saúde (VerificadorBancoPdo) só tem evidência manual (503 com a API apontada para uma porta fechada); o teste automatizado troca a implementação.

## Ideias para depois
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
