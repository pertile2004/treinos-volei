# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-19 — Evolução: estatísticas e gráficos — Integrante 2 — 2026-11-06 (feito em paralelo com os cards 04 a 18, a partir da base PR-01/02/03 mais a camada de dados adiantada dos cards 04, 08, 12 e 16).
- O que entrou: GET /api/v1/estatisticas?periodo=semana|mes|3meses|ano (EstatisticasService com três consultas agregadas em America/Sao_Paulo, percentual null sem tentativas, frequência da semana atual contra a meta); tela /evolucao com abas, gráfico de linha (recharts 3.10.1), barras por fundamento com "sem dados", cartão de frequência, "Ver como tabela" e estados carregando, erro, 401 e vazio; src/lib/datas.js, formatos.js e tabelas.js; módulo funcionalidades/referencias; DemoSeeder (Guto com 13 semanas, admin, treinadora CARLA234 com dois atletas, treinos públicos; só local, demo e testing; senha em DEMO_SENHA e a do admin em DEMO_SENHA_ADMIN); backend/config/volleypro.php; Playwright fluxo 4 escrito em frontend/e2e/ (roda quando o PR-05 trouxer a infraestrutura). Junto vêm as migrations, models e factories de users, exercicios, treinos, treino_itens, sessoes e sessao_series e o acesso à API de exercícios e treinos no front.
- Como testar:
  1. `npm run verificar` (backend: Pint, Larastan, 183 testes; frontend: lint, 513 testes, build).
  2. Banco migrado: `DEMO_SENHA=<sua senha> DEMO_SENHA_ADMIN=<outra senha> php backend/artisan db:seed --class=DemoSeeder`; os números da semana de referência estão em docs/historico/PR-19.md.
  3. `npm run dev:web` e abra http://localhost:5173/evolucao: sem login aparece o alerta com o link "Entrar"; com login (PR-05), os cartões, as abas e a tabela.
- Próximo: PR-20 — Início (home) — Integrante 3 (depende do PR-19). Os cards 04 a 18 estão em andamento em outras frentes; o PR-20 também usa o login do PR-05 e as sessões do PR-16/17.

## Em andamento
- Cards 04 a 18, 21, 26 e 28 em cópias de trabalho paralelas (ver .worktrees/PAINEL.md na máquina do tech lead).

## Pendências
- [ ] PR-19: rodar o Playwright fluxo 4 (frontend/e2e/fluxo-4-evolucao.spec.js) quando a infraestrutura do PR-05 existir: banco de E2E semeado com `php artisan db:seed --class=DemoSeeder`, DEMO_SENHA e DEMO_SENHA_ADMIN no ambiente, tela /entrar com campos "E-mail" e "Senha" e botão "Entrar" redirecionando para /. Ajustar o spec se os rótulos do PR-05 forem outros.
- [ ] PR-19: conferir a tela no navegador real com login (contraste do gráfico Recharts sobre a superfície, layout em 360 px e 1440 px, foco nas abas e no botão "Ver como tabela"); no jsdom só textos e tabela foram conferidos.
- [ ] PR-19: ao salvar sessão (PR-16/17), invalidar a query ['estatisticas'] (`chavesEstatisticas.todas()`).
- [ ] PR-19, decisões fora da especificação: janelas de Mês (semana atual + 3), 3 Meses (semana atual + 12) e Ano (mês atual + 11) com fim inclusivo; `periodo` obrigatório; percentual com 1 casa; `frequencia.datas` incluído para o PR-20 (remover se não usar).
- [ ] PR-19: ambiente "demo" = APP_ENV=demo (PR-30 confirma); o DemoSeeder não foi exercitado com APP_ENV=demo (só local e testing). O admin do seed (admin@example.com) deve ser alinhado com o admin do .env previsto no PR-09; o DemoSeeder cria 7 exercícios próprios porque a biblioteca do PR-08 ainda não existia nesta branch.
- [ ] PR-19: bundle JS do front em 792 kB (243 kB gzip) por causa do recharts; divisão de código fica para um card de desempenho. Nenhum EXPLAIN com volume real nas consultas de estatísticas (usam o índice (usuario_id, iniciada_em)).
- [ ] PR-19: `composer analise` com várias cópias de trabalho ao mesmo tempo pode dar "Acesso negado" no cache do Temp; repetir ou apontar TMP/TEMP para uma pasta própria. `php backend/artisan test` a partir da raiz não acha o Pest: use `composer --working-dir=backend test`.
- [ ] Camada de dados adiantada (ADR-028): os cards 04, 08, 12 e 16 devem rever as decisões registradas no docs/MODELO-DE-DADOS.md ao fechar.
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores.
- [ ] PR-03, aceite sem evidência: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar com /dev/componentes; ajustar tokens se houver diferença (ADR-022).
- [ ] PR-03, não conferido: leitor de tela real, área segura do iPhone na NavInferior e navegador com fonte padrão diferente de 16 px; AppShell no navegador (navegação fixa embaixo, lateral a partir de 1024 px, "Pular para o conteúdo").
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): docker-compose.yml, init do banco de teste e o caminho completo do `npm run dev`. O job `backend` do CI só roda no GitHub.
- [ ] PR-01: confirmar os valores do enum Nivel (ADR-021); decidir sobre backend/AGENTS.md (vem do esqueleto do Laravel); `npm run teste:api` precisa do composer.bat visível no Windows.
- [ ] PR-01 (revisão): não há rate limit na API (definir no PR-04/PR-05 o throttle e o armazenamento do contador); no deploy, LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL real e trustProxies se houver proxy.
- [ ] Backend e frontend juntos: abrir /dev/status com a API real e conferir o formato de /api/v1/saude.
- [ ] `npm audit` do frontend acusa vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- Evolução: comparar períodos, metas por fundamento, exportar os números, cache das estatísticas.
- Componentes fora da lista do PR-03: Select, Toast e Tabela (a TabelaEstatisticas do PR-19 pode virar a base).
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
