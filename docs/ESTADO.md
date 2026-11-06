# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-04 — Cadastro de usuário, Termos e Privacidade — Integrante 5 — 2026-11-06
- O que entrou: tabela `users` no modelo do domínio (migration, model `User` com atributos e casts, factory); `POST /api/v1/auth/cadastro` (FormRequest com mensagens pt-BR, Service que cria a conta e inicia a sessão, 201 com `UsuarioResource`, rate limit 10/min por IP); tela /cadastro ("Crie sua conta", abas Sou Jogador/Sou Treinador, React Hook Form + Zod, erros da API no próprio campo); páginas /termos e /privacidade; `LayoutPublico` com o landmark `main` das rotas públicas; `src/lib/formularios.js` (`aplicarErrosDaApi`); dependências react-hook-form 7.91.0, zod 4.6.7 e @hookform/resolvers 7.0.3 (ADR-026).
- Anteriores no mesmo dia: PR-01 (backend com /saude e /referencias), PR-02 (esqueleto do front) e PR-03 (design system; feito sem o Figma, ADR-022).
- Como testar:
  1. `composer --working-dir=backend install`, `npm --prefix frontend ci`, backend/.env a partir do .env.example, `php backend/artisan key:generate` e `php backend/artisan migrate`.
  2. `npm run dev:api` e `npm run dev:web`; abra http://localhost:5173/cadastro, crie uma conta só com o teclado e repita o e-mail para ver o erro no campo; veja /termos e /privacidade.
  3. `npm run verificar` (backend: Pint, Larastan e 75 testes; frontend: ESLint, 341 testes e build).
- Próximo: PR-05 — Entrar, sair e rotas protegidas — Integrante 6 (depende do PR-04, concluído). O PR-05 deve preencher a chave `['eu']` do TanStack Query também após o cadastro e cobrir o fluxo real cadastro → início → sair → entrar no Playwright.

## Em andamento
- (nenhum)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (checks `governanca`, `frontend` e `backend` obrigatórios, incluindo administradores) e adicionar os colaboradores. Os jobs `frontend` e `backend` só rodam no GitHub quando o PR é aberto; nos PR-02 a PR-04 a mesma sequência foi rodada só na máquina.
- [ ] PR-04, não conferido: fluxo real navegador → API (csrf-cookie e cookie de sessão persistido após o 201). Evidência atual: Pest (`assertAuthenticatedAs` e cookie na resposta) e MSW no front. O E2E do PR-05 fecha a lacuna.
- [ ] PR-04: canal de contato real das páginas /termos e /privacidade (o texto remete ao repositório até o dono definir um e-mail).
- [ ] PR-04: aceite dos termos não é persistido (sem coluna no MODELO-DE-DADOS); possível lacuna de LGPD a decidir pelo grupo.
- [ ] PR-04: usuário já logado chamando POST /auth/cadastro cria outra conta e troca a sessão (sem regra nos docs); decidir no PR-05 se a rota recusa quem já tem sessão.
- [ ] PR-04: a tela /cadastro não foi comparada com o PNG do Figma (docs/design/telas vazio); o aceite usa caixa de seleção com o texto do Figma.
- [ ] PR-03, aceite sem evidência: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar lado a lado com /dev/componentes; se houver diferença, ajustar os tokens (frontend/src/estilos/tokens.css e docs/DESIGN.md) e confirmar a fonte (ADR-022).
- [ ] PR-03, não conferido: leitor de tela real, área segura do iPhone na NavInferior e navegador com fonte padrão diferente de 16 px (o limite de 1024 px do `useLarguraMinima` deixa de coincidir com o `lg` do Tailwind).
- [ ] PR-03: conferir no navegador o AppShell (navegação fixa embaixo, coluna lateral a partir de 1024 px e o link "Pular para o conteúdo").
- [ ] PR-01, não conferido na máquina onde foi feito (sem Docker): o docker-compose.yml, o script de init do banco de teste e o caminho completo do `npm run dev`. Quem tiver Docker: rode `npm run dev` e confira /up e /api/v1/saude em http://127.0.0.1:8000 e a /dev/status em http://localhost:5173.
- [ ] PR-01: o grupo precisa confirmar os valores do enum Nivel (iniciante, intermediario, avancado), que a especificação não lista (ADR-021).
- [ ] PR-01: backend/AGENTS.md é o arquivo que vem no esqueleto do Laravel; ele manda instalar o PHP por script remoto e rodar o boost:install de novo. O grupo decide se remove.
- [ ] PR-01: `npm run teste:api` precisa do `composer` visível para o cmd do Windows (composer.bat). Se o npm não achar o Composer, use `composer --working-dir=backend test` ou `npm run verificar`.
- [ ] PR-01: a falha real do banco na rota de saúde (VerificadorBancoPdo) só tem evidência manual (503 com a API apontada para uma porta fechada).
- [ ] PR-01 (revisão): o throttle usa o cache no banco (CACHE_STORE=database). O PR-04 definiu o limitador `cadastro` (10/min por IP); o PR-05 define o do login (5/min por e-mail + IP). O /saude continua sem throttle para não cair junto com o banco.
- [ ] PR-01 (revisão): no deploy, definir LOG_CHANNEL=stderr, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, FRONTEND_URL com a origem real e configurar trustProxies se houver proxy terminando o TLS.
- [ ] Backend e frontend juntos: abrir /dev/status com a API real e conferir o formato de /api/v1/saude. No PR-02 isso foi conferido só com MSW.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- Componentes fora da lista do PR-03: Select, Toast e Tabela; um componente CaixaDeSelecao no design system (o aceite do cadastro usa `<input type="checkbox">` com classes dos tokens).
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
- No card de seeders: não criar o usuário de exemplo (test@example.com, senha da factory) em produção.
- Separar o log dos testes do log diário de desenvolvimento (hoje os testes escrevem em backend/storage/logs).
- Registrar o aceite dos termos com data e versão (coluna ou tabela nova), se o grupo quiser rastreabilidade de LGPD.
