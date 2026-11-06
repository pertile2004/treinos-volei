# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-08 — Biblioteca de exercícios — Integrante 3 — 2026-11-06
- O que entrou: tabela `exercicios` (exclusão lógica) e extensão `unaccent` por migration; model Exercicio, factory e ExercicioSeeder com 42 exercícios reais (6 por fundamento) lidos de backend/database/seeders/dados/exercicios.json; GET /api/v1/exercicios (filtros fundamento e nivel por E, busca no nome sem acento e sem caixa, paginação de 15 até 50) e GET /api/v1/exercicios/{id}, só para logados, com ExercicioPolicy (leitura), FormRequest, Service e dois Resources; CSP `frame-src 'self' https://www.youtube-nocookie.com`; no front, módulos exercicios (api, hooks, video, formatos, componentes CartaoExercicio, FiltrosExercicios, Paginacao, PlayerVideo e Ilustracao) e referencias (useReferencias), telas Biblioteca (abas Treinos Prontos e Meus Treinos, chips, busca com debounce, paginação, filtros na URL, estados carregando, erro e vazio) e Detalhe do exercício (player só com URL válida do YouTube, descrição, foco, padrões, 404 próprio); 7 SVGs em frontend/public/ilustracoes/.
- Sem login no front nesta frente: /biblioteca e /exercicios/:exercicioId ficam sem RotaProtegida; 401 e 403 da API aparecem como mensagem. A proteção entra na entrega, com o PR-05.
- Como testar:
  1. `composer --working-dir=backend install`, `npm --prefix frontend ci`, `php backend/artisan migrate` e `php backend/artisan db:seed`.
  2. `npm run verificar` (backend: 126 testes; frontend: 470 testes, lint e build).
  3. `npm run dev:api` e `npm run dev:web`; com uma sessão aberta (até o PR-05, use `php backend/artisan tinker` ou um cookie de sessão de teste), abra /biblioteca, filtre por "Recepção" e "Iniciante", busque "recepcao" e abra um exercício: sem vídeo, não há player.
- Próximo desta frente: PR-09 — Exercícios: cadastro (admin) — Integrante 4 (depende do PR-08). Em paralelo, outras frentes: PR-04 a PR-07 (autenticação), PR-12 a PR-15 (treinos).

## Em andamento
- (nenhum nesta frente)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores. O job `frontend` só roda no GitHub quando o PR é aberto; nos PR-02, PR-03 e PR-08 a mesma sequência foi rodada só na máquina.
- [ ] PR-08, na entrega (com o PR-05 na main): RotaProtegida em /biblioteca e /exercicios/:exercicioId; rodar frontend/e2e/fluxo-biblioteca.spec.js (precisa do playwright.config.js, @playwright/test e @axe-core/playwright do PR-05; o login do spec usa POST /api/v1/auth/cadastro com nome, email, password, password_confirmation, papel e aceite_termos — conferir com o PR-04).
- [ ] PR-08, não conferido nesta máquina: navegador real (7 SVGs em 48 px, layout de 360 a 1440 px, contraste da ilustração em mask-image), extensão `unaccent` no Postgres do CI (serviço postgres:17, usuário superusuário) e no Neon, e Docker.
- [ ] PR-08, escolhas sem regra na especificação: busca só no nome (não em descrição/foco); parâmetro `por_pagina` e limite de 100 caracteres da busca; `page` inválido dá 422 (não cai na página 1); aba "Meus Treinos" mostra um EstadoVazio informativo até o PR-13; "Limpar filtros" só aparece com filtro ativo.
- [ ] PR-08: nenhum `video_url` preenchido no seeder (nenhum vídeo foi conferido); o player só é coberto por dado de teste. Quem conferir um vídeo do YouTube pode preenchê-lo no exercicios.json.
- [ ] PR-09 (revisão de segurança do PR-08): validar `imagem_url` no FormRequest do admin (prefixo `/ilustracoes/` ou lista de valores permitidos), para a regra ficar no servidor. No front, `Ilustracao` já só aceita caminho relativo da própria origem; sem `img-src` na CSP até o PR-29.
- [ ] PR-08: CSP só com `frame-src` (ADR-026); CSP completa no PR-29. Sem limitador `api` (429) até o PR-05 definir o throttle e o armazenamento do contador.
- [ ] PR-08: `php backend/artisan test` a partir da raiz falha nesta máquina ("Could not open input file: vendor/pestphp/pest/bin/pest"); use `npm run teste:api` (composer test) ou `npm run verificar`.
- [ ] PR-03, aceite sem evidência: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar lado a lado com /dev/componentes; se houver diferença, ajustar os tokens (frontend/src/estilos/tokens.css e docs/DESIGN.md) e confirmar a fonte (ADR-022).
- [ ] PR-03, não conferido: leitor de tela real, área segura do iPhone na NavInferior e navegador com fonte padrão diferente de 16 px (o limite de 1024 px do `useLarguraMinima` deixa de coincidir com o `lg` do Tailwind).
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): o docker-compose.yml, o script de init do banco de teste e o caminho completo do `npm run dev`. Quem tiver Docker: rode `npm run dev` e confira /up e /api/v1/saude em http://127.0.0.1:8000 e a /dev/status em http://localhost:5173.
- [ ] PR-01: o job `backend` do CI (com cobertura por pcov) só roda no GitHub, depois do push; confira que ficou verde antes do merge.
- [ ] PR-01: o grupo precisa confirmar os valores do enum Nivel (iniciante, intermediario, avancado), que a especificação não lista (ADR-021).
- [ ] PR-01: backend/AGENTS.md é o arquivo que vem no esqueleto do Laravel (o Boost não o reescreveu); ele manda instalar o PHP por script remoto. O grupo decide se remove.
- [ ] PR-01: `npm run teste:api` precisa do `composer` visível para o cmd do Windows (composer.bat). Se o npm não achar o Composer, use `composer --working-dir=backend test` ou `npm run verificar`.
- [ ] PR-01: a falha real do banco na rota de saúde (VerificadorBancoPdo) só tem evidência manual; o teste automatizado troca a implementação.
- [ ] PR-01 (revisão): no deploy, definir LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL com a origem real e configurar trustProxies se houver proxy terminando o TLS.
- [ ] Backend e frontend juntos: abrir /dev/status com a API real e conferir o formato de /api/v1/saude. No PR-02 isso foi conferido só com MSW.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- Busca também em descrição e foco; índice de expressão para `unaccent` (precisa de wrapper IMMUTABLE) se a biblioteca crescer.
- Componentes fora da lista do PR-03: Select, Toast e Tabela.
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
