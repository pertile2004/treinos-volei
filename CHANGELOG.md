# Changelog
Formato Keep a Changelog, em português. Versões em SemVer.

## [Não lançado]
### Adicionado
- Fundação do repositório: documentação, regras de trabalho, verificações de documentação e de autoria e CI de governança.
- Esqueleto do frontend (PR-02): app React navegável em frontend/ com as rotas de todas as telas (só o título), página 404, AppShell com a navegação principal, cliente HTTP (X-Request-Id, repetição única em 419 e ida para /entrar em 401), componentes Carregando, MensagemDeErro e EstadoVazio e a página /dev/status (só em desenvolvimento).
- Scripts `npm run dev`, `npm run dev:web` e `npm run teste:web` na raiz e job `frontend` no CI (lint, testes com cobertura, build e auditoria das dependências).
