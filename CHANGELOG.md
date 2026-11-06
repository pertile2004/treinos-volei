# Changelog
Formato Keep a Changelog, em português. Versões em SemVer.

## [Não lançado]
### Adicionado
- Fundação do repositório: documentação, regras de trabalho, verificações de documentação e de autoria e CI de governança.
- Esqueleto do backend (PR-01): API Laravel 13 em backend/ com PostgreSQL, GET /api/v1/saude e GET /api/v1/referencias, X-Request-Id em toda resposta e no log JSON, erros de /api/* em JSON padrão, cabeçalhos de segurança, CORS restrito à origem do front e mensagens de validação em pt_BR.
- Ambiente de desenvolvimento: docker-compose.yml (PostgreSQL 17 e Mailpit), `npm run dev:api` e `npm run teste:api`; o `npm run dev` prepara o banco e sobe a API e o front juntos.
- Qualidade do backend: Pest 4, Larastan nível 6, Pint, Scramble (/docs/api em desenvolvimento), Laravel Boost e o job `backend` no CI.
- Esqueleto do frontend (PR-02): app React navegável em frontend/ com as rotas de todas as telas (só o título), página 404, AppShell com a navegação principal, cliente HTTP (X-Request-Id, repetição única em 419 e ida para /entrar em 401), componentes Carregando, MensagemDeErro e EstadoVazio e a página /dev/status (só em desenvolvimento).
- Scripts `npm run dev:web` e `npm run teste:web` na raiz e job `frontend` no CI (lint, testes com cobertura, build e auditoria das dependências).
- Design system (PR-03): tokens finais no tema do Tailwind (borda de controle, fonte do sistema, tamanhos de destaque e de cronômetro) e os componentes Botao, CampoTexto, Cartao, ChipFiltro, Etiqueta, Abas, Cabecalho, NavInferior, BarraLateral, Stepper, BarraDeProgresso, Cronometro, Avatar e ModalDeConfirmacao, acessíveis e testados com axe.
- Catálogo /dev/componentes (só em desenvolvimento), com todos os componentes em todos os estados, e tabela de contraste no docs/DESIGN.md.
- Biblioteca de exercícios (PR-08): tabela `exercicios` com exclusão lógica e extensão `unaccent`; seeder com 42 exercícios reais (6 por fundamento) e 7 ilustrações SVG próprias, uma por fundamento; GET /api/v1/exercicios (filtros fundamento e nivel, busca sem acento e sem caixa, paginação de 15 até 50) e GET /api/v1/exercicios/{id}, só para usuários logados; telas Biblioteca (aba Treinos Prontos com chips, busca, paginação e filtros na URL) e Detalhe do exercício (vídeo em youtube-nocookie com title, descrição, foco e padrões); CSP `frame-src` liberando só a própria origem e o youtube-nocookie.com; a ilustração do fundamento só é carregada de caminho relativo da própria origem.
### Alterado
- AppShell usa os componentes do design system: barra de navegação inferior abaixo de 1024 px e barra lateral a partir daí, com ícones.
- Transições e animações são desligadas para quem pede menos movimento no sistema.
