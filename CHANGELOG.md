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
- Cadastro de usuário (PR-04): tabela `users` no modelo do domínio (nome, papel, meta_semanal, data_nascimento, codigo_convite e treinador_id), POST /api/v1/auth/cadastro (validação em pt-BR, conta criada já com sessão iniciada, 201 com o usuário, rate limit de 10/min por IP), tela /cadastro com abas Sou Jogador e Sou Treinador e erros da API no próprio campo, páginas /termos e /privacidade, layout público com landmark main e utilitário `aplicarErrosDaApi` para formulários; dependências react-hook-form, zod e @hookform/resolvers.
### Alterado
- AppShell usa os componentes do design system: barra de navegação inferior abaixo de 1024 px e barra lateral a partir daí, com ícones.
- Transições e animações são desligadas para quem pede menos movimento no sistema.
