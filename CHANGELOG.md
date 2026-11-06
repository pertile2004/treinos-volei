# Changelog
Formato Keep a Changelog, em português. Versões em SemVer.

## [Não lançado]
### Adicionado
- Fundação do repositório: documentação, regras de trabalho, verificações de documentação e de autoria e CI de governança.
- Esqueleto do backend (PR-01): API Laravel 13 em backend/ com PostgreSQL, GET /api/v1/saude e GET /api/v1/referencias, X-Request-Id em toda resposta e no log JSON, erros de /api/* em JSON padrão, cabeçalhos de segurança e mensagens de validação em pt_BR.
- Ambiente de desenvolvimento: docker-compose.yml (PostgreSQL 17 e Mailpit), `npm run dev` e `npm run teste:api`.
- Qualidade do backend: Pest 4, Larastan nível 6, Pint, Scramble (/docs/api em desenvolvimento), Laravel Boost e o job `backend` no CI.
