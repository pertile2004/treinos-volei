# Changelog
Formato Keep a Changelog, em português. Versões em SemVer.

## [Não lançado]
### Adicionado
- Fundação do repositório: documentação, regras de trabalho, verificações de documentação e de autoria e CI de governança.
- Esqueleto do backend (PR-01): API Laravel 13 em backend/ com PostgreSQL, GET /api/v1/saude e GET /api/v1/referencias, X-Request-Id em toda resposta e no log JSON, erros de /api/* em JSON padrão, cabeçalhos de segurança e mensagens de validação em pt_BR.
- Ambiente de desenvolvimento: docker-compose.yml (PostgreSQL 17 e Mailpit), `npm run dev:api` e `npm run teste:api`; o `npm run dev` prepara o banco e sobe a API e o front juntos.
- Qualidade do backend: Pest 4, Larastan nível 6, Pint, Scramble (/docs/api em desenvolvimento), Laravel Boost e o job `backend` no CI.
- Esqueleto do frontend (PR-02): app React navegável em frontend/ com as rotas de todas as telas (só o título), página 404, AppShell com a navegação principal, cliente HTTP (X-Request-Id, repetição única em 419 e ida para /entrar em 401), componentes Carregando, MensagemDeErro e EstadoVazio e a página /dev/status (só em desenvolvimento).
- Scripts `npm run dev:web` e `npm run teste:web` na raiz e job `frontend` no CI (lint, testes com cobertura, build e auditoria das dependências).
