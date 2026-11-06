# Changelog
Formato Keep a Changelog, em português. Versões em SemVer.

## [Não lançado]
### Adicionado
- Fundação do repositório: documentação, regras de trabalho, verificações de documentação e de autoria e CI de governança.
- Esqueleto do frontend (PR-02): app React navegável em frontend/ com as rotas de todas as telas (só o título), página 404, AppShell com a navegação principal, cliente HTTP (X-Request-Id, repetição única em 419 e ida para /entrar em 401), componentes Carregando, MensagemDeErro e EstadoVazio e a página /dev/status (só em desenvolvimento).
- Scripts `npm run dev`, `npm run dev:web` e `npm run teste:web` na raiz e job `frontend` no CI (lint, testes com cobertura, build e auditoria das dependências).
- Design system (PR-03): tokens finais no tema do Tailwind (borda de controle, fonte do sistema, tamanhos de destaque e de cronômetro) e os componentes Botao, CampoTexto, Cartao, ChipFiltro, Etiqueta, Abas, Cabecalho, NavInferior, BarraLateral, Stepper, BarraDeProgresso, Cronometro, Avatar e ModalDeConfirmacao, acessíveis e testados com axe.
- Catálogo /dev/componentes (só em desenvolvimento), com todos os componentes em todos os estados, e tabela de contraste no docs/DESIGN.md.
### Alterado
- AppShell usa os componentes do design system: barra de navegação inferior abaixo de 1024 px e barra lateral a partir daí, com ícones.
- Transições e animações são desligadas para quem pede menos movimento no sistema.
