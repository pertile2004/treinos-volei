# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-12 — Treinos: cadastro — Integrante 1 — 2026-11-06 (frente C: treinos, empilhada 12 → 13 → 14 → 15).
- O que entrou: `POST /api/v1/treinos` (auth:sanctum; CriarTreinoRequest com as regras do contrato, visibilidade por papel, exercício ativo e par etapa+ordem único; TreinoService::criar em transação com a duração estimada; TreinoResource com `autor`, `itens[].exercicio.removido` e `criado_em`); tabelas treinos e treino_itens (semente); tela Criar treino em /treinos/novo (nome, descrição, nível, visibilidade conforme o papel, 4 etapas, seletor de exercícios da biblioteca com busca, chips e paginação, botões ↑ ↓ e remover, Steppers nos limites do card, erros 422 por campo e por item, confirmação "Treino criado."); módulos frontend treinos/ (api, hooks, esquema Zod, lógica pura do montador) e referencias/ (useReferencias); lib/formularios.js (aplicarErrosDaApi); fluxo 2 do Playwright escrito; react-hook-form 7.91.0, zod 4.6.7 e @hookform/resolvers 7.0.3 (ADR-026); fórmula da duração (ADR-027).
- Antes dele, na main: PR-03 (design system), PR-02 (esqueleto do front) e PR-01 (esqueleto do backend). As frentes de autenticação (04–07), exercícios (08–11), sessões (16–18) e outras avançam em paralelo em cópias separadas.
- Como testar:
  1. `composer --working-dir=backend install`, `npm --prefix frontend ci`, `php backend/artisan migrate` (PostgreSQL local ou `npm run dev`).
  2. `npm run verificar` (backend: Pint, PHPStan e 162 testes; frontend: lint, 533 testes e build).
  3. Com uma sessão iniciada (cadastro/login chegam nos PR-04/05), abra /treinos/novo, monte um treino com exercícios em duas etapas, reordene com ↑ ↓, ajuste séries e salve; confira o 201 e as linhas em treinos e treino_itens.
- Próximo: PR-13 — Treinos: Meus Treinos e detalhe — Integrante 2 (depende do PR-12). Acrescentar `index`/`show` em TreinoController e `listarTreinos`, `buscarTreino`, `useTreinos`, `useTreino`, `chavesTreinos` nos mesmos api.js/hooks.js (ver docs/historico/PR-12.md).

## Em andamento
- (nenhum nesta frente)

## Pendências
- [ ] PR-12: E2E frontend/e2e/fluxo-2-criar-treino.spec.js escrito mas não executado (sem @playwright/test, @axe-core/playwright e playwright.config.js nesta branch; nascem no PR-05). Na entrega, confirmar o contrato de POST /api/v1/auth/cadastro (PR-04), a existência de exercícios na base (seed do PR-08) e rodar `npm run teste:e2e`.
- [ ] PR-12: ligar o papel real na tela — quando o PR-05 trouxer o usuário logado, passar `papel={usuario.papel}` em CriarTreino (hoje a rota não passa prop: as três visibilidades aparecem e o servidor devolve 422 no campo) e proteger /treinos/novo com a rota protegida.
- [ ] PR-12: link "Criar treino" na Biblioteca não adicionado (Biblioteca.jsx é reescrita pelo PR-08 em outra frente); adicionar na entrega. Destino após salvar: a tela mostra a confirmação com "Ver treino" (/treinos/{id}, detalhe do PR-13) e "Voltar para a Biblioteca"; decidir se passa a navegar direto quando o detalhe existir.
- [ ] PR-12: sem rate limit em POST /treinos (o projeto ainda não tem limitador registrado; pendência do PR-01 abaixo). Definir na frente de autenticação e aplicar às rotas autenticadas.
- [ ] PR-12, decisões a confirmar pelo grupo (ADR-027): descrição até 2000 caracteres; repetições e duração juntas aceitas; 3 s por repetição na duração estimada.
- [ ] PR-12, não conferido: navegador real (layout, contraste e Stepper na tela; só jsdom e axe), OpenAPI do Scramble para a rota nova, Docker e CI do GitHub. Conflitos prováveis no merge: frontend/src/funcionalidades/referencias/ (a frente de exercícios pode criar o mesmo módulo), frontend/vite.config.js (`test.exclude`) e frontend/package.json (mesmas versões nas outras frentes: ficar com uma cópia).
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores. O job `frontend` só roda no GitHub quando o PR é aberto; nos PR-02, 03 e 12 a mesma sequência foi rodada só na máquina.
- [ ] PR-03, aceite sem evidência: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar lado a lado com /dev/componentes; se houver diferença, ajustar os tokens (frontend/src/estilos/tokens.css e docs/DESIGN.md) e confirmar a fonte (ADR-022).
- [ ] PR-03, não conferido: leitor de tela real (o botão de senha troca o nome e também usa `aria-pressed`; o Cronometro anuncia a cada minuto), área segura do iPhone na NavInferior e navegador com fonte padrão diferente de 16 px (o limite de 1024 px do `useLarguraMinima` deixa de coincidir com o `lg` do Tailwind).
- [ ] PR-03: conferir no navegador o AppShell (navegação fixa embaixo, coluna lateral a partir de 1024 px e o link "Pular para o conteúdo"). No PR-02 o layout foi conferido só por testes de componente, sem abrir o navegador.
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): o docker-compose.yml, o script de init do banco de teste e o caminho completo do `npm run dev` (Docker, migrations, API e front juntos). Quem tiver Docker: rode `npm run dev` e confira /up e /api/v1/saude em http://127.0.0.1:8000 e a /dev/status em http://localhost:5173.
- [ ] PR-01: o job `backend` do CI (com cobertura por pcov) só roda no GitHub, depois do push; confira que ficou verde antes do merge.
- [ ] PR-01: o grupo precisa confirmar os valores do enum Nivel (iniciante, intermediario, avancado), que a especificação não lista (ADR-021).
- [ ] PR-01: backend/AGENTS.md é o arquivo que vem no esqueleto do Laravel (o Boost foi instalado só para o Claude Code e não o reescreveu); ele manda instalar o PHP por script remoto e rodar o boost:install de novo. O grupo decide se remove.
- [ ] PR-01: `npm run teste:api` precisa do `composer` visível para o cmd do Windows (composer.bat). Se o npm não achar o Composer, use `composer --working-dir=backend test` ou `npm run verificar`.
- [ ] PR-01: a falha real do banco na rota de saúde (VerificadorBancoPdo) só tem evidência manual (503 com a API apontada para uma porta fechada); o teste automatizado troca a implementação.
- [ ] PR-01 (revisão): não há rate limit na API. Não entrou no /saude porque o throttle usa o cache, que fica no banco (CACHE_STORE=database), e derrubaria a rota junto com o banco. Definir no PR-04/PR-05 (login) o throttle das rotas e o armazenamento do contador.
- [ ] PR-01 (revisão): no deploy, definir LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL com a origem real e configurar trustProxies se houver proxy terminando o TLS.
- [ ] Backend e frontend juntos: abrir /dev/status com a API real e conferir o formato de /api/v1/saude (a página aceita os campos na raiz ou dentro de `data`). No PR-02 isso foi conferido só com MSW e com o proxy respondendo 502 sem a API.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- Treinos: arrastar para reordenar (além dos botões), duplicar treino, rascunho automático do formulário e criação offline.
- Componentes fora da lista do PR-03: Select, Toast, Tabela e Textarea (a tela Criar treino usa `<select>` e `<textarea>` locais com o mesmo desenho do CampoTexto).
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
