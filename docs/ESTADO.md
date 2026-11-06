# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-21 — Agenda e lembretes no app — Integrante 4 — 2026-11-06 (frente H, construída em paralelo com os cards 04–07, 08–11, 12–15, 16–18, 19, 26 e 28 a partir da mesma base; PR-03 foi o último fechado na linha principal).
- O que entrou: tabela `agendamentos` e GET/POST /api/v1/agendamentos, PATCH/DELETE /api/v1/agendamentos/{id} (só do dono, Policy com 404 para o alheio, "hoje" em America/Sao_Paulo); `AgendamentoService::vincularSessaoDeHoje` e `::removerFuturosDoTreino` (RN-08) prontos para os cards 16 e 15 chamarem; tela Agenda em /agenda (semana seg–dom, agendar, editar, remover, Pendente/Concluído, "Iniciar treino"); LembreteDeHoje em todas as telas do AppShell; AgendaDoDia e `useProximosAgendamentos` para o Início (card 20); src/lib com datas/formatos/tabelas (iguais às outras frentes), formularios.js e useHoje; react-hook-form, zod e @hookform/resolvers (ADR-026).
- Como testar:
  1. `npm --prefix frontend ci`, `composer --working-dir=backend install` e `php backend/artisan migrate` (PostgreSQL).
  2. `npm run verificar` (Pint, Larastan, Pest; ESLint, Vitest e build).
  3. `npm run dev`, abrir /agenda com uma sessão Sanctum (só a partir do PR-05): agendar um treino para hoje e recarregar qualquer tela para ver o lembrete.
- Próximo: nesta frente nada (o card 21 era o único); na linha principal, PR-04 — Cadastro, Termos e Privacidade — Integrante 5 (outra frente, em andamento).

## Em andamento
- Frentes paralelas: PR-04 a 07 (autenticação), 08 a 11 (exercícios), 12 a 15 (treinos), 16 a 18 (sessões), 19 (evolução), 26 (PWA) e 28 (observabilidade), cada uma na sua branch.

## Pendências
- [ ] PR-21, integração nos outros cards: chamar `AgendamentoService::vincularSessaoDeHoje` em `SessaoService::registrar` (PR-16, só na criação, não no reenvio por id_cliente) e `::removerFuturosDoTreino` no service de exclusão de treino (PR-15), nas transações; invalidar `["agendamentos"]` no front ao salvar sessão e ao excluir treino. Montar `<AgendaDoDia />` em Inicio.jsx (PR-20). Aqui só o service foi testado.
- [ ] PR-21: rate limit 60/min das rotas não configurado (throttle do grupo api é transversal; definir no PR-04/05 junto com o armazenamento do contador).
- [ ] PR-21, não conferido nesta máquina: navegador real (layout, contraste e leitor de tela da Agenda e do lembrete; só jsdom + axe), Docker e CI do GitHub. Sem login nesta frente, toda tela do AppShell dispara GET /agendamentos → 401 → /entrar; some depois do PR-05 (RotaProtegida).
- [ ] PR-21, decisões simples a confirmar com o grupo: listagem por intervalo (até 31 dias) sem paginação (ADR-027); mesmo treino pode ser agendado mais de uma vez no dia; concluído só pelo vínculo automático e não é editável; "futuros" da RN-08 = hoje em diante e pendentes; sessão sincronizada offline no dia seguinte (PR-27) não acha o agendamento de "hoje" (alternativa: dia local de iniciada_em); treino que deixa de ser visível (atleta desvinculado, PR-22/23) continua na agenda.
- [ ] PR-21: seletor de treino mostra só a 1ª página (15) dos escopos meus e destaque, sem o escopo treinador; quem tiver mais treinos não os vê no select.
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores. O job `frontend` só roda no GitHub quando o PR é aberto; no PR-02 e no PR-03 a mesma sequência foi rodada só na máquina.
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
- Componentes fora da lista do PR-03: Select, Toast e Tabela.
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
- PR-21: item "Agenda" na navegação principal (hoje 4 itens fixados pelos testes do AppShell) e promover CampoSelecao ao design system (src/componentes + catálogo).
