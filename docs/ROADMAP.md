# Roteiro de PRs
Status: ☐ a fazer · ◐ em andamento · ✅ concluído · ✂ cortado

Regras:
- Um PR pode começar quando todas as dependências estiverem ✅. No máximo 2 PRs abertos ao mesmo tempo.
- Cada card é o "prompt pronto" do PR: o /comecar lê o card inteiro e segue o procedimento padrão. Todo PR cumpre a docs/DEFINICAO-DE-PRONTO.md.
- Se o responsável não puder na vez dele, o próximo do rodízio assume e troca o nome na tabela.
- Se o prazo apertar, os cortáveis saem primeiro: marque ✂ e registre em docs/DECISOES.md.

| PR | Título | Responsável | Depende de | Cortável | Status | Link |
|----|--------|-------------|------------|----------|--------|------|
| 00 | Fundação do repositório | Integrante 1 | — | não | ✅ | [#1](https://github.com/pertile2004/treinos-volei/pull/1) |
| 01 | Esqueleto do backend | Integrante 2 | 00 | não | ☐ | |
| 02 | Esqueleto base do frontend | Integrante 3 | 00 | não | ✅ | [#2](https://github.com/pertile2004/treinos-volei/pull/2) |
| 03 | Design system a partir do Figma | Integrante 4 | 02 | não | ☐ | |
| 04 | Cadastro, Termos e Privacidade | Integrante 5 | 01, 03 | não | ☐ | |
| 05 | Entrar, sair e rotas protegidas | Integrante 6 | 04 | não | ☐ | |
| 06 | Recuperação de senha | Integrante 1 | 05 | não | ☐ | |
| 07 | Perfil e configurações | Integrante 2 | 05 | não | ☐ | |
| 08 | Biblioteca de exercícios | Integrante 3 | 05 | não | ☐ | |
| 09 | Exercícios: cadastro (admin) | Integrante 4 | 08 | não | ☐ | |
| 10 | Exercícios: alteração (admin) | Integrante 5 | 09 | não | ☐ | |
| 11 | Exercícios: exclusão (admin) | Integrante 6 | 10 | não | ☐ | |
| 12 | Treinos: cadastro | Integrante 1 | 08 | não | ☐ | |
| 13 | Treinos: Meus Treinos e detalhe | Integrante 2 | 12 | não | ☐ | |
| 14 | Treinos: alteração | Integrante 3 | 13 | não | ☐ | |
| 15 | Treinos: exclusão | Integrante 4 | 14 | não | ☐ | |
| 16 | Modo treino ativo e salvar sessão | Integrante 5 | 13 | não | ☐ | |
| 17 | Registro rápido "Já treinei" | Integrante 6 | 16 | não | ☐ | |
| 18 | Histórico de treinos | Integrante 1 | 16 | não | ☐ | |
| 19 | Evolução: estatísticas e gráficos | Integrante 2 | 18 | não | ☐ | |
| 20 | Início (home) | Integrante 3 | 19 | não | ☐ | |
| 21 | Agenda e lembretes no app | Integrante 4 | 20 | só o lembrete | ☐ | |
| 22 | Treinador: código e atletas | Integrante 5 | 07 | sim | ☐ | |
| 23 | Treinador: compartilhar treinos | Integrante 6 | 22, 13 | sim | ☐ | |
| 24 | Treinador: evolução dos atletas | Integrante 1 | 23, 19 | sim | ☐ | |
| 25 | Layout desktop completo | Integrante 2 | 20 | sim | ☐ | |
| 26 | PWA instalável | Integrante 3 | 20 | sim | ☐ | |
| 27 | Modo offline do treino | Integrante 4 | 26, 16 | sim | ☐ | |
| 28 | Observabilidade e análise de qualidade | Integrante 5 | 20 | Pulse e Sonar | ☐ | |
| 29 | Auditoria de segurança e acessibilidade | Integrante 6 | 21 e os não cortados de 22 a 28 | não | ☐ | |
| 30 | Deploy e demonstração | Integrante 1 | 29 | não | ☐ | |
| 31 | Documentação final e apresentação | Integrante 2 | 30 | não | ☐ | |

## Cards

### PR-00 · Fundação do repositório · Integrante 1
Feito pelo prompt de fundação: docs, regras, hooks, scripts de verificação e CI de governança.
Aceite: autotestes OK, CI verde e merge feito.

### PR-01 · Esqueleto do backend · Integrante 2
Depende de: PR-00 · Cortável: não
Objetivo: API Laravel 13 rodando em backend/ com PostgreSQL, qualidade automatizada e observabilidade básica.
Escopo:
- `composer create-project laravel/laravel backend` (Laravel 13, PHP 8.4, sem starter kit) e `php backend/artisan install:api` (Sanctum e routes/api.php).
- docker-compose.yml na raiz:
  - postgres:17, com os bancos volleypro e volleypro_teste criados por script de init;
  - mailpit.
- backend/.env.example com valores falsos:
  - APP_LOCALE=pt_BR, APP_TIMEZONE=UTC, DB_CONNECTION=pgsql;
  - FRONTEND_URL=http://localhost:5173, SANCTUM_STATEFUL_DOMAINS=localhost:5173, SESSION_DRIVER=database;
  - e-mail via SMTP do Mailpit.
- Pastas app/Http/Controllers/Api/V1, Http/Requests, Http/Resources, Services, Policies, Enums e Contracts.
- Enums Papel, Fundamento, Nivel, Etapa, Visibilidade e OrigemSessao, cada um com rotulo() em pt-BR com acento.
- Middleware de request id: lê ou gera o X-Request-Id, registra com Context::add('request_id') e devolve no header.
- Logs em JSON (stderr em produção, arquivo diário em dev) e cabeçalhos de segurança.
- Exceções em /api/* viram JSON padrão com message e request_id, sem stack trace fora de local.
- GET /api/v1/saude (status, banco, versao, horario; 503 se o banco cair).
- GET /api/v1/referencias (valor e rótulo de cada enum).
- `Model::shouldBeStrict(! app()->isProduction())` e mensagens de validação em pt_BR (`lang:publish` + tradução).
- Qualidade: Pest 4 com o plugin Laravel, Larastan nível 6, Pint e Scramble (/docs/api só em local por enquanto).
- Laravel Boost:
  - `composer --working-dir=backend require laravel/boost --dev` e `php backend/artisan boost:install` para o Claude Code. Se o comando pedir interação, peça ao humano para rodar no terminal.
  - Registre o MCP no .mcp.json da raiz, com o comando `php` e os argumentos `backend/artisan boost:mcp`.
  - Os arquivos gerados pelo Boost ficam em backend/ e são versionados. Ele não pode sobrescrever o CLAUDE.md da raiz.
- Scripts do Composer: test, lint (pint --test), analise (phpstan) e formatar. Scripts da raiz: teste:api e dev (por enquanto Docker + API).
- CI: job `backend` com:
  - PHP 8.4 com pdo_pgsql e pcov e serviço postgres;
  - composer install, lint, analise e test com cobertura;
  - composer audit.
Fora do escopo: autenticação e models de domínio.
Aceite:
- `npm run dev` sobe o banco e a API em http://127.0.0.1:8000.
- /up e /api/v1/saude respondem 200; com o banco parado, /api/v1/saude responde 503.
- O X-Request-Id aparece no log JSON e na resposta de erro.
- /api/v1/referencias traz os 7 fundamentos com rótulos acentuados.
- Job `backend` verde.
Testes: saúde (ok e banco fora), referências, propagação do request id e 404 em JSON sem stack trace.
Docs além dos obrigatórios: DECISOES (versões fixadas, Boost, Scramble), ARQUITETURA (estrutura real), API e README (como rodar no Windows).
Atenção:
- Não renomeie users nem password e não edite as migrations padrão do Laravel.
- Avise o dono do repositório para tornar o job `backend` obrigatório.

### PR-02 · Esqueleto base do frontend · Integrante 3
Depende de: PR-00 (pode rodar junto com o PR-01) · Cortável: não
Objetivo: o "FRONT — ESQUELETO BASE" do quadro: app React navegável, com toda a infraestrutura pronta para receber as telas.
Escopo:
- frontend/ com Vite 8 e React em JavaScript (`npm create vite@latest frontend -- --template react`), Tailwind 4 via @tailwindcss/vite, React Router e TanStack Query.
- src/lib/http.js: axios com:
  - baseURL /api/v1, withCredentials e withXSRFToken;
  - X-Request-Id gerado por requisição com crypto.randomUUID();
  - em 419, busca /sanctum/csrf-cookie e repete uma vez;
  - em 401, manda para /entrar guardando a rota pedida.
- vite.config.js: proxy de /api, /sanctum e /docs para http://127.0.0.1:8000, no dev e no preview, para tudo ficar na mesma origem.
- Estrutura de pastas do CLAUDE.md.
- AppShell com navegação inferior (Início, Biblioteca, Treino, Evolução) e espaço para a barra lateral a partir de 1024 px.
- Rotas de todas as telas da ESPECIFICACAO, com páginas que mostram só o título (sem dados inventados), e página 404.
- Componentes de estado: Carregando, MensagemDeErro (mostra o request_id) e EstadoVazio.
- /dev/status (só em dev), consultando /api/v1/saude via TanStack Query.
- ESLint (flat config) com react-hooks e jsx-a11y, Prettier, e Vitest com Testing Library, jsdom e MSW.
- Raiz: concurrently; `npm run dev` sobe Docker, API e front; script teste:web.
- CI: job `frontend` (Node 24, npm ci, lint, testes com cobertura, build e npm audit --audit-level=high).
Fora do escopo: visual final (PR-03).
Aceite:
- Todas as rotas navegáveis.
- /dev/status mostra a API no ar (com o PR-01 mergeado) ou um erro tratado.
- Job `frontend` verde.
Testes: http (419 repete uma vez, X-Request-Id enviado, 401 redireciona), AppShell e 404.
Docs além dos obrigatórios: DECISOES (versões), ARQUITETURA (front) e README.
Atenção: avise o dono do repositório para tornar o job `frontend` obrigatório.

### PR-03 · Design system a partir do Figma · Integrante 4
Depende de: PR-02 · Cortável: não
Pré-requisito humano: as 6 telas exportadas do Figma em PNG 2x em docs/design/telas/.
Objetivo: tokens e componentes fiéis ao Figma e acessíveis.
Escopo:
- Figma MCP (opcional), com no máximo 5 chamadas:
  - get_metadata da página;
  - get_variable_defs;
  - get_design_context de home-dashboard, active-training-mode e evolution-stats-history.
  Salve todas as saídas em docs/design/figma/.
- Tokens no @theme do Tailwind 4 (cores, fonte, tamanhos, espaçamentos e raios). Fonte carregada localmente se a licença permitir.
- Componentes do DESIGN.md:
  - Botao, com variações e estado carregando;
  - CampoTexto, com rótulo, erro e mostrar senha, aceitando colar;
  - Cartao, ChipFiltro, Abas, Stepper, BarraDeProgresso, Cronometro e Cabecalho;
  - Avatar com iniciais e Etiqueta de fundamento e de etapa;
  - NavInferior, BarraLateral e ModalDeConfirmacao.
- /dev/componentes (só em dev), mostrando todos os componentes em todos os estados.
- Textos seguindo a tabela de correções do DESIGN.md.
Aceite:
- Catálogo completo e parecido com os PNGs (compare lado a lado).
- Contraste AA medido e anotado no DESIGN.md.
- Foco visível em tudo; alvos ≥ 24 px (44 px nos botões principais).
Testes: componentes com Testing Library e axe (vitest-axe) sem violações.
Docs além dos obrigatórios: DESIGN (tokens finais) e DECISOES (fonte).
Atenção: se o Figma MCP estiver indisponível, use só os PNGs. Nenhuma cor fora dos tokens.

### PR-04 · Cadastro de usuário, Termos e Privacidade · Integrante 5
Depende de: PR-01, PR-03 · Cortável: não
Objetivo: RF-01 e RF-16.
Escopo:
- Migration nova alterando users conforme o MODELO-DE-DADOS: name vira nome; entram papel, meta_semanal, data_nascimento, codigo_convite e treinador_id.
- Model User com #[Table('users')], #[Fillable], #[Hidden] e casts (papel como enum, data_nascimento como date).
- POST /api/v1/auth/cadastro, com FormRequest:
  - nome de 2 a 100 caracteres, e-mail único e senha ≥ 8 confirmada;
  - papel jogador ou treinador e aceite_termos aceito;
  - cria a conta, inicia a sessão e responde 201 com UsuarioResource;
  - rate limit de 10/min por IP.
- Tela Cadastro (Figma "registro" com os textos corrigidos): abas Sou Jogador e Sou Treinador, campos, link para termos e privacidade e "Já tem conta? Entrar".
- Páginas /termos e /privacidade: dados coletados, finalidade, direitos (acesso, correção, exportação e exclusão), idade e contato.
Fora do escopo: entrar e sair (PR-05).
Aceite:
- Cadastro válido entra logado na tela inicial (ainda provisória).
- E-mail repetido e senha curta mostram o erro no próprio campo.
- Papel admin na requisição → 422.
- Campos aceitam colar, e a tela inteira funciona só com teclado.
Testes: Pest (201, cada 422 e 429), Vitest (validação e envio) e axe.
Docs além dos obrigatórios: MODELO-DE-DADOS e API.

### PR-05 · Entrar, sair e rotas protegidas · Integrante 6
Depende de: PR-04 · Cortável: não
Objetivo: RF-02 e a infraestrutura de E2E.
Escopo:
- POST /auth/entrar: regenera a sessão; rate limit de 5/min por e-mail + IP; mensagem genérica "E-mail ou senha inválidos".
- POST /auth/sair (invalida a sessão) e GET /eu.
- Sanctum stateful para localhost:5173 e 127.0.0.1:8000; sessão no banco; cookies seguros em produção.
- Tela Entrar (Figma "login", sem os botões Google e Apple).
- Estado de autenticação via TanStack Query (/eu) e rotas protegidas que voltam para a página pedida depois de entrar.
- "Sair" no perfil ou no menu.
- Playwright em frontend/e2e (Chromium), com o fluxo 1: cadastro → início → sair → entrar.
- CI: job `e2e` com Postgres, API com artisan serve, front com vite preview usando o proxy, Playwright e relatório salvo como artefato quando falhar.
Aceite:
- Entrar e sair funcionam, e a sessão sobrevive a recarregar a página.
- A 6ª tentativa errada em 1 minuto → 429 com mensagem clara.
- Depois de sair, /eu → 401.
Testes: Pest (entrar ok, erro e 429; sair; /eu 200 e 401), Vitest e Playwright fluxo 1.
Docs além dos obrigatórios: API e DECISOES (configuração de sessão e cookies).
Atenção: avise o dono do repositório para tornar o job `e2e` obrigatório.

### PR-06 · Recuperação de senha · Integrante 1
Depende de: PR-05 · Cortável: não
Objetivo: RF-03.
Escopo:
- POST /auth/esqueci-senha: sempre 202, sem revelar se o e-mail existe, com throttle.
- POST /auth/redefinir-senha, com token.
- Link do e-mail apontando para FRONTEND_URL/redefinir-senha (ResetPassword::createUrlUsing), com o e-mail em pt-BR.
- Telas Esqueci a senha e Redefinir senha.
Aceite:
- O e-mail chega no Mailpit (http://localhost:8025) com o link do front.
- Token inválido ou expirado mostra mensagem clara.
- A nova senha funciona no login e a antiga não.
Testes: Pest (Notification::fake e broker de senha) e Vitest.
Docs além dos obrigatórios: API.

### PR-07 · Perfil e configurações · Integrante 2
Depende de: PR-05 · Cortável: não
Objetivo: RF-04 e os direitos do titular (LGPD).
Escopo:
- PATCH /eu: nome, e-mail único, meta_semanal de 1 a 7 e data_nascimento até hoje.
- PUT /eu/senha, exigindo a senha atual.
- GET /eu/exportacao: JSON com perfil, treinos, sessões e agendamentos, entregue como download.
- DELETE /eu:
  - confirma a senha;
  - em transação, apaga o usuário e os dados pessoais;
  - se for treinador, desvincula os atletas;
  - encerra a sessão.
- Tela Perfil: dados, meta semanal, trocar senha, exportar dados, excluir conta (com modal de confirmação) e sair.
Aceite:
- Cada ação funciona e mostra erro claro quando inválida.
- Depois de excluir, não é possível entrar de novo com a conta.
Testes: Pest (sucesso, 422 e 401 de cada ação; exclusão em cascata) e Vitest.
Docs além dos obrigatórios: API, MODELO-DE-DADOS (cascatas) e BOAS-PRATICAS (direitos do titular).

### PR-08 · Biblioteca de exercícios · Integrante 3
Depende de: PR-05 · Cortável: não
Objetivo: RF-05.
Escopo:
- Migration e model Exercicio (#[Table('exercicios')], exclusão lógica, enums) e factory.
- Seeder com cerca de 40 exercícios reais de vôlei: pelo menos 5 por fundamento e alguns de preparo físico, com foco, padrões e descanso.
- video_url só com vídeo do YouTube que você conferiu que existe; na dúvida, null. Nunca invente URL.
- Ilustrações em SVG próprio e neutro, uma por fundamento.
- GET /exercicios:
  - filtros fundamento e nivel;
  - busca que ignora maiúsculas e acentos, com a extensão unaccent do Postgres criada por migration;
  - paginação de 15, máximo 50.
- GET /exercicios/{id}.
- Tela Biblioteca, aba "Treinos Prontos" (ADR-013): chips por fundamento, busca e paginação.
- Tela Detalhe do exercício: vídeo em youtube-nocookie com title, descrição, foco e padrões.
- CSP liberando frames de youtube-nocookie.com.
Aceite:
- Filtros combinados funcionam.
- "recepcao" encontra "Recepção".
- Sem vídeo, o detalhe esconde o player.
Testes: Pest (filtros, busca, paginação e 401), Vitest e axe.
Docs além dos obrigatórios: MODELO-DE-DADOS e API.

### PR-09 · Exercícios: cadastro (admin) · Integrante 4
Depende de: PR-08 · Cortável: não
Objetivo: RF-06, o "Cadastro → PR" do quadro.
Escopo:
- ExercicioPolicy: só o admin gerencia.
- Usuário admin criado pelo seeder, com e-mail e senha vindos do .env.
- POST /exercicios com FormRequest (video_url aceita só youtube.com e youtu.be).
- Telas /admin/exercicios (lista) e /admin/exercicios/novo.
- Menu "Administração" visível só para admin.
Aceite e testes: 201 para admin; 403 para jogador e treinador; 422 em cada campo inválido; Vitest do formulário.
Docs além dos obrigatórios: API.

### PR-10 · Exercícios: alteração (admin) · Integrante 5
Depende de: PR-09 · Cortável: não
Objetivo: o "Alteração → PR" do quadro.
Escopo: PUT /exercicios/{id} e tela de edição reaproveitando o formulário do PR-09.
Aceite e testes: 200, 403, 404 e 422.
Docs além dos obrigatórios: API.

### PR-11 · Exercícios: exclusão (admin) · Integrante 6
Depende de: PR-10 · Cortável: não
Objetivo: o "Excluir → PR" do quadro.
Escopo:
- DELETE /exercicios/{id}, com exclusão lógica e modal de confirmação.
- O exercício excluído some da listagem.
- Treinos (PR-12) e sessões (PR-16) continuam mostrando o exercício com o selo "removido da biblioteca"; esses PRs testam isso.
Aceite e testes: 204 e 403; o exercício não aparece mais em GET /exercicios.
Docs além dos obrigatórios: API.

### PR-12 · Treinos: cadastro · Integrante 1
Depende de: PR-08 · Cortável: não
Objetivo: RF-07 (criar).
Escopo:
- Migrations treinos e treino_itens e seus models.
- TreinoService::criar em transação, calculando duracao_estimada_minutos.
- POST /treinos:
  - nome, descrição e nível;
  - visibilidade conforme o papel: jogador só privado; treinador privado ou atletas; admin também publico;
  - de 1 a 30 itens, cada um com exercício ativo, etapa, ordem, séries (1–10), repetições (1–100) ou duração (10–3600 s) e descanso (0–600 s).
- Tela Criar Treino:
  - nome, nível e as 4 etapas;
  - adicionar exercícios da biblioteca com busca e filtro;
  - reordenar com botões ↑ e ↓, sem depender de arrastar;
  - ajustar os parâmetros com o Stepper e salvar.
- Playwright fluxo 2: criar um treino.
Aceite:
- Uma falha em qualquer item não grava nada (transação).
- Visibilidade inválida para o papel → 422.
- Exercício excluído não pode ser adicionado.
Testes: Pest (transação, validações e papéis), Vitest (montagem do treino) e Playwright fluxo 2.
Docs além dos obrigatórios: MODELO-DE-DADOS e API.

### PR-13 · Treinos: Meus Treinos e detalhe · Integrante 2
Depende de: PR-12 · Cortável: não
Objetivo: RF-07 (listar e ver).
Escopo:
- GET /treinos com escopo meus ou destaque (o escopo treinador entra no PR-23).
- GET /treinos/{id} com itens e exercícios via eager loading, e Policy de visibilidade.
- Aba "Meus Treinos" na Biblioteca.
- Detalhe do treino: etapas, exercícios e duração estimada; exercício excluído aparece com o selo "removido da biblioteca".
- O botão "Iniciar treino" só entra no PR-16 (nenhum botão sem função).
Aceite e testes:
- Treino privado de outro usuário → 404.
- Sem N+1, com o modo estrito ligado.
- O selo aparece para exercício excluído.
Docs além dos obrigatórios: API.

### PR-14 · Treinos: alteração · Integrante 3
Depende de: PR-13 · Cortável: não
Escopo:
- PUT /treinos/{id}, substituindo os itens em transação. Só o autor altera; o admin altera os públicos.
- Tela de edição reaproveitando o formulário do PR-12.
Aceite e testes: 200, 403, 422 e rollback da transação.
Docs além dos obrigatórios: API.

### PR-15 · Treinos: exclusão · Integrante 4
Depende de: PR-14 · Cortável: não
Escopo:
- DELETE /treinos/{id}, com exclusão lógica e modal de confirmação.
- Sessões passadas são preservadas. Os agendamentos futuros são removidos no PR-21.
Aceite e testes: 204 e 403; o treino some das listas e o GET do detalhe responde 404.
Docs além dos obrigatórios: API.

### PR-16 · Modo treino ativo e salvar sessão · Integrante 5
Depende de: PR-13 · Cortável: não
Objetivo: RF-08. É o "Venda" do projeto: uma operação mestre-detalhe que grava várias tabelas de uma vez.
Escopo:
- Migrations sessoes e sessao_series (id_cliente uuid único) e seus models.
- SessaoService::registrar:
  - em transação;
  - idempotente por id_cliente: o reenvio devolve a mesma sessão;
  - valida que os exercícios pertencem ao treino quando houver treino_id.
- POST /sessoes e GET /sessoes/{id}.
- Tela /treinar/:treinoId, nesta sequência:
  1. preparação;
  2. exercício: série X de Y, cronômetro, Stepper de séries e repetições, botões grandes +acerto/+erro com desfazer;
  3. descanso: contagem regressiva, pular e +15 s;
  4. próximo exercício;
  5. resumo e "Finalizar e salvar treino".
- Progresso "Exercício N de M".
- O estado é salvo no localStorage a cada mudança e sobrevive a recarregar a página.
- Página "Treino" da navegação: escolher um treino ou retomar o que está em andamento.
- Botão "Iniciar treino" no detalhe do treino.
- Acessibilidade:
  - aria-live educado a cada minuto, não a cada segundo;
  - botões de 44 px;
  - vibração opcional no fim do descanso.
- Playwright fluxo 3: o teste cria um treino pela API, executa marcando acertos e erros, finaliza e salva.
Aceite:
- Recarregar no meio mantém o estado.
- Reenviar com o mesmo id_cliente não duplica.
- Exercício excluído do treino aparece com o selo e pode ser executado normalmente.
Testes: Pest (transação, idempotência e 404 para treino privado de outro usuário), Vitest com timers falsos e Playwright fluxo 3.
Docs além dos obrigatórios: MODELO-DE-DADOS e API.

### PR-17 · Registro rápido "Já treinei" · Integrante 6
Depende de: PR-16 · Cortável: não
Objetivo: RF-09.
Escopo:
- Fundamentos em chips; duração com atalhos de 15, 30, 45 e 60 min; data (hoje por padrão); acertos e erros opcionais por fundamento.
- POST /sessoes com origem registro_rapido.
- O caminho feliz cabe em até 3 toques: fundamento → duração → salvar.
- A opção "Já treinei" aparece na página Treino. O card da home chega no PR-20.
Testes: Vitest (3 toques) e Pest (validação de registro_rapido).
Docs além dos obrigatórios: API.

### PR-18 · Histórico de treinos · Integrante 1
Depende de: PR-16 · Cortável: não
Objetivo: RF-10.
Escopo:
- GET /sessoes: filtros de e até, paginação, mais recentes primeiro e fundamentos agregados.
- DELETE /sessoes/{id}, só das próprias, para corrigir registro errado.
- Tela Histórico (como no Figma): data, duração, nome do treino ou "Registro rápido" e etiquetas de fundamento.
- Detalhe da sessão: séries, acertos e erros, com opção de excluir (modal de confirmação).
Testes: Pest (filtros, paginação e 404 para sessão de outro usuário) e Vitest.
Docs além dos obrigatórios: API.

### PR-19 · Evolução: estatísticas e gráficos · Integrante 2
Depende de: PR-18 · Cortável: não
Objetivo: RF-11.
Escopo:
- EstatisticasService com consultas agregadas no Postgres (date_trunc no fuso America/Sao_Paulo, índices, sem N+1), seguindo RN-01 a RN-04.
- GET /estatisticas com periodo semana, mes, 3meses ou ano.
- DemoSeeder, só para local e demo:
  - usuário "Guto" com ~3 meses de sessões realistas;
  - um admin;
  - um treinador com 2 atletas;
  - alguns treinos públicos em destaque.
- Tela Sua Evolução:
  - abas Semana, Mês, 3 Meses e Ano;
  - linha de volume em minutos (Recharts);
  - barras de performance por fundamento com % ou "sem dados";
  - frequência;
  - botão "ver como tabela", com tabela equivalente acessível.
- Playwright fluxo 4: o usuário demo vê os gráficos.
Aceite:
- "sem dados" nunca aparece como 0%.
- Os números batem com um cálculo manual de uma semana do seed.
Testes: unitários de cálculo com Carbon::setTestNow (virada de semana, fuso, período vazio), Pest do endpoint, Vitest e Playwright fluxo 4.
Docs além dos obrigatórios: API.

### PR-20 · Início (home) · Integrante 3
Depende de: PR-19 · Cortável: não
Objetivo: RF-12.
Escopo:
- "Hoje, <data por extenso>" com Intl em pt-BR (mês em minúscula) e "Fala, <primeiro nome>!" com avatar de iniciais.
- Card "Registrar Treino Rápido" com as opções "Iniciar cronômetro" e "Já treinei".
- Frequência semanal: S T Q Q S S D, com os dias treinados e a meta.
- "Treinos em destaque" (públicos).
- "Treinos do seu treinador" entra no PR-23 e "Agenda do dia" no PR-21.
Testes: Vitest com data fixa, axe e Playwright fluxo 1 atualizado para conferir a home.

### PR-21 · Agenda e lembretes no app · Integrante 4
Depende de: PR-20 · Cortável: só o lembrete
Objetivo: RF-13.
Escopo:
- Migration agendamentos e o CRUD /agendamentos.
- Tela Agenda: semana atual, navegar entre semanas, agendar um treino em dia e hora, remover e ver os concluídos.
- Ao salvar a sessão de um treino agendado para hoje, o agendamento é vinculado automaticamente.
- "Agenda do dia" no Início.
- Lembrete no app: ao abrir, aviso discreto (não bloqueante) se houver treino de hoje pendente.
- Excluir um treino passa a remover os agendamentos futuros dele (RN-08).
Testes: Pest (CRUD, 404 de outro usuário, vínculo automático e remoção ao excluir treino) e Vitest.
Docs além dos obrigatórios: MODELO-DE-DADOS e API.

### PR-22 · Treinador: código e atletas · Integrante 5
Depende de: PR-07 · Cortável: sim
Objetivo: RF-14 (vínculo).
Escopo:
- POST /treinador/codigo: gera ou regenera seguindo a RN-05, por meio da interface GeradorDeCodigoConvite injetada. Isso permite teste determinístico e demonstra o DIP.
- GET /treinador/atletas e DELETE /treinador/atletas/{id}.
- POST /eu/treinador {codigo} e DELETE /eu/treinador.
- Perfil do treinador: card "Seu código" (copiar e regenerar) e lista de atletas.
- Perfil do jogador: "Entrar com código do treinador" e "Sair do treinador".
Testes:
- Código inválido → 422.
- Atleta já vinculado a outro treinador → 422.
- Treinador não pode se vincular como atleta.
- Policies em todas as rotas.
Docs além dos obrigatórios: API.

### PR-23 · Treinador: compartilhar treinos · Integrante 6
Depende de: PR-22, PR-13 · Cortável: sim
Objetivo: RF-14 (compartilhar).
Escopo:
- GET /treinos com escopo treinador, para atletas: treinos com visibilidade atletas cujo autor é o seu treinador.
- Seção "Treinos do seu treinador" no Início e na Biblioteca.
- O treinador vê na Biblioteca o que compartilhou.
Testes: atleta de outro treinador → 404; atleta desvinculado perde o acesso.
Docs além dos obrigatórios: API.

### PR-24 · Treinador: evolução dos atletas · Integrante 1
Depende de: PR-23, PR-19 · Cortável: sim
Objetivo: RF-14 (acompanhar).
Escopo:
- GET /treinador/atletas/{id}/estatisticas, reaproveitando o EstatisticasService, com Policy de vínculo.
- Tela do atleta para o treinador: os mesmos gráficos (só leitura) e o histórico resumido.
Testes: 403 para atleta não vinculado; números iguais aos que o próprio atleta vê.
Docs além dos obrigatórios: API.

### PR-25 · Layout desktop completo · Integrante 2
Depende de: PR-20 · Cortável: sim
Objetivo: RF-15 (desktop).
Escopo:
- A partir de 1024 px: barra lateral, largura máxima e grades de cards (Biblioteca em 2 a 3 colunas).
- Evolução com os gráficos lado a lado.
- De 360 a 1440 px, sem rolagem horizontal.
Aceite: os fluxos E2E também passam em viewport de desktop.
Docs além dos obrigatórios: DESIGN.

### PR-26 · PWA instalável · Integrante 3
Depende de: PR-20 · Cortável: sim
Objetivo: RF-15 (instalável e offline de leitura).
Escopo:
- vite-plugin-pwa (confirme antes a compatibilidade com o Vite 8; se não houver, use service worker próprio).
- Manifest: nome, ícones de 192 e 512 (com maskable) e cores do tema.
- Cache do app shell e stale-while-revalidate para GET de exercícios e treinos.
- Aviso de nova versão disponível.
- Limpar os caches ao sair e nunca cachear /eu.
Aceite: o navegador oferece instalar; sem rede, o app abre e mostra a biblioteca já vista.
Docs além dos obrigatórios: DECISOES.

### PR-27 · Modo offline do treino · Integrante 4
Depende de: PR-26, PR-16 · Cortável: sim
Objetivo: RF-15 (sessão offline).
Escopo:
- Fila de sessões no IndexedDB (idb-keyval). Offline, "salvar" guarda a sessão e mostra "pendente de envio".
- Ao reconectar ou ao abrir o app, envia em ordem com o mesmo id_cliente (idempotência do PR-16).
- Indicador de conexão.
Aceite: Playwright com setOffline(true) → salvar → setOffline(false) → a sessão aparece no histórico sem duplicar.
Docs além dos obrigatórios: ARQUITETURA.

### PR-28 · Observabilidade e análise de qualidade · Integrante 5
Depende de: PR-20 · Cortável: Pulse e Sonar (a correlação fica)
Objetivo: métricas, correlação e análise estática do documento do professor.
Escopo:
- Laravel Pulse com painel protegido, só para admin.
- Latência e taxa de erros por rota.
- Correlação conferida de ponta a ponta: front → header → log → mensagem de erro com o request_id para o usuário reportar.
- SonarQube Cloud no CI, rodando só se existir o segredo SONAR_TOKEN.
Docs além dos obrigatórios: BOAS-PRATICAS (observabilidade), README e DECISOES.

### PR-29 · Auditoria de segurança e acessibilidade · Integrante 6
Depende de: PR-21 e os PRs 22 a 28 que não foram cortados · Cortável: não
Objetivo: fechar segurança e acessibilidade antes do deploy.
Escopo:
- Subagente revisor-seguranca no repositório inteiro e correção dos achados.
- Checklist OWASP Top 10:2025 preenchido no BOAS-PRATICAS.
- CSP final e rate limits revisados; cookies Secure, HttpOnly e SameSite=Lax.
- composer audit e npm audit sem vulnerabilidade alta ou crítica.
- @axe-core/playwright em todas as telas dos fluxos, navegação só por teclado e Lighthouse ≥ 90 em Acessibilidade.
Aceite: nenhum achado alto aberto; relatório em docs/historico/PR-29.md.
Docs além dos obrigatórios: BOAS-PRATICAS.

### PR-30 · Deploy e demonstração · Integrante 1
Depende de: PR-29 · Cortável: não
Objetivo: sistema online para a apresentação.
Escopo:
- Dockerfile multi-stage: build do front com Node 24 e imagem PHP 8.4 de produção mantida. Escolha entre FrankenPHP e serversideup/php e justifique em DECISOES.
- O Laravel serve o SPA na mesma origem: fallback para o index.html em tudo que não for /api, /sanctum, /up ou /docs.
- Render (web service Docker, plano grátis) com Neon (PostgreSQL grátis, sslmode=require).
- Variáveis documentadas no README, sem nenhum segredo no repositório.
- Migrations e DemoSeeder rodam no deploy.
- Deploy automático ao entrar na main, com o deploy hook guardado como segredo do GitHub.
- Produção com APP_DEBUG=false, HTTPS e SESSION_SECURE_COOKIE=true; /docs/api só para admin.
- E-mail de recuperação em produção por provedor gratuito ou por log, com a decisão registrada.
Aceite:
- URL pública com os 4 fluxos funcionando e /up respondendo 200.
- Smoke E2E rodando contra a produção.
- README com a URL e o aviso: o plano grátis do Render dorme sem uso, então abra o site alguns minutos antes da apresentação.
Docs além dos obrigatórios: DECISOES, README e ARQUITETURA.
Atenção: os segredos são cadastrados pelo dono do repositório no Render e no GitHub; o Claude nunca vê os valores.

### PR-31 · Documentação final e apresentação · Integrante 2
Depende de: PR-30 · Cortável: não
Objetivo: entrega.
Escopo:
- Revisar todos os docs.
- Diagrama de arquitetura e DER em Mermaid.
- BOAS-PRATICAS com o caminho do arquivo de cada item.
- README final: como rodar, testar e fazer deploy, e a equipe a partir do INTEGRANTES.md.
- Roteiro de apresentação de 10 minutos mostrando os requisitos do quadro: MVC, API, front consumindo com axios, ORM e um PR por funcionalidade.
- CHANGELOG 1.0.0 e tag v1.0.0.
Docs além dos obrigatórios: todos.
