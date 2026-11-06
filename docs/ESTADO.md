# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-16 — Modo treino ativo e salvar sessão — Integrante 5 — 2026-11-06 (frente D: sessões; os cards 04–15, 19, 21, 26 e 28 são feitos em paralelo por outras frentes a partir da mesma base).
- O que entrou (backend): POST /sessoes e GET /sessoes/{id} (auth:sanctum + throttle:api 60/min por usuário), RegistrarSessaoRequest, SessaoService::registrar (idempotente por id_cliente, 404 para treino não visível, 422 para exercício fora do treino, DB::transaction sessão + séries, fundamento copiado do exercício), SessaoPolicy (404, nunca 403), SessaoResource e SessaoSerieResource; 24 testes Pest em tests/Feature/Sessoes/. As tabelas sessoes e sessao_series, models e factories vieram na semente 1d8f8bc (docs/MODELO-DE-DADOS.md).
- O que entrou (frontend): funcionalidades/sessoes (registrarSessao, buscarSessao, useSessao, useRegistrarSessao), funcionalidades/treino-ativo (máquina de estados pura, localStorage versionado, montagem do POST, useTreinoAtivo, componentes das fases), páginas /treinar/:treinoId e /treino (retomar ou descartar, lista "Meus treinos" com paginação, "Treino salvo."), lib/formatos.js e e2e/fluxo-3-treino-ativo.spec.js (Playwright, ainda não executável nesta branch).
- Como testar:
  1. `composer --working-dir=backend test -- tests/Feature/Sessoes` (24 testes: transação, idempotência, 404 para treino privado alheio, selo de exercício removido, 429).
  2. `npm --prefix frontend run test -- --run src/funcionalidades/treino-ativo src/funcionalidades/sessoes src/paginas` (máquina com timers falsos, recarga restaura o estado, reenvio com o mesmo id_cliente, axe em cada fase).
  3. `npm run verificar` (191 testes do backend e 535 do front, lint, análise e build). Com a API e um treino com itens: abra /treino, "Iniciar treino", marque acertos e erros, recarregue a página no meio e finalize.
- Próximo nesta frente: PR-17 — Registro rápido "Já treinei" — Integrante 6 (depende do PR-16). No roteiro geral, PR-04 é o próximo da sequência e está em outra frente.

## Em andamento
- (nenhum nesta frente)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios) e adicionar os colaboradores.
- [ ] PR-16: Playwright fluxo 3 (frontend/e2e/fluxo-3-treino-ativo.spec.js) escrito mas não executado: não há playwright.config.js nem @playwright/test e @axe-core/playwright nesta branch (infraestrutura do PR-05) e ele depende de POST /auth/cadastro (PR-04), GET /exercicios (PR-08) e POST /treinos (PR-12). Rodar na entrega, depois dos merges.
- [ ] PR-16: encaixe ponta a ponta do front com a API real (POST/GET /sessoes e o formato de GET /treinos/{id} do PR-13 em `criarEstadoInicial`) conferido só com MSW e os corpos do contrato; abrir /treinar/:id com a API no ar depois do merge do PR-13. Layout conferido só no jsdom (sem navegador real).
- [ ] PR-16: botão "Iniciar treino" no detalhe do treino (/treinos/:id) não foi feito: a tela é do PR-13 (outra frente). Entrada hoje é a página /treino. Acrescentar o botão (`Botao para={`/treinar/${id}`}`) no PR-13 ou no merge.
- [ ] PR-16: visibilidade do treino em POST /sessoes está em SessaoService::podeVer (autor, público, atletas do autor); quando a TreinoPolicy do PR-13 chegar, trocar pela Policy. Admin não tem visão especial sobre treinos alheios (RN-06); mudar se o PR-13 decidir diferente.
- [ ] PR-16: chave do localStorage usa o segmento fixo `local` (USUARIO_DO_ARMAZENAMENTO em treino-ativo/navegador.js) porque não há login no front nesta frente; o PR-05 troca pelo id do usuário logado.
- [ ] PR-16: corrida real de dois POST simultâneos com o mesmo id_cliente não exercitada (impossível em teste HTTP sequencial); a captura de UniqueConstraintViolationException está implementada e a pré-checagem tem teste.
- [ ] PR-16, decisões da lógica adiantada sem regra nos docs: `montarSessao` renumera `numero` por exercicio_id; teto de 10 séries por exercício e 600 s de descanso restante; ajuste de repetições vale para as séries seguintes; descanso vencido com a página fechada reinicia a série no instante da volta; treino com mais de 200 séries não é cortado (o POST recusa). id_cliente nulo e `registro_rapido` ficam para o PR-17.
- [ ] PR-16: o limitador `api` (AppServiceProvider) usa o cache (CACHE_STORE=database); /saude continua fora do throttle. O PR-05 decide o throttle das rotas de login e o armazenamento do contador. A pasta temporária do PHPStan é compartilhada entre frentes e pode dar "Acesso negado" quando duas rodam juntas; TMP/TEMP exclusivos resolvem.
- [ ] PR-03: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar com /dev/componentes; conferir leitor de tela real, área segura do iPhone na NavInferior e o AppShell no navegador (ADR-022).
- [ ] PR-01: Docker (`npm run dev` completo), job `backend` do CI, enum Nivel a confirmar (ADR-021), backend/AGENTS.md do esqueleto, composer.bat para `npm run teste:api`, falha real do banco em /saude só com evidência manual, e no deploy LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL e trustProxies.
- [ ] Backend e frontend juntos: /dev/status com a API real. `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, cadeia do eslint 10); não barra o CI (ADR-016).

## Ideias para depois
- Treino ativo: Wake Lock para a tela não apagar, som no fim do descanso, "Iniciar treino" direto da home, voltar de fase.
- Componentes fora da lista do PR-03: Select, Toast e Tabela. Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo em produção. Separar o log dos testes do log diário de desenvolvimento.
