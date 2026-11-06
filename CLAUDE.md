# VOLLEY PRO — instruções do projeto

Plataforma web de treino individual de vôlei. SPA React (frontend/) consome a API Laravel 13 (backend/); em produção os dois ficam na mesma origem. Seis integrantes trabalham em rodízio: a memória do projeto mora em docs/ e é atualizada em todo PR.

## Comece por aqui
- docs/ESTADO.md diz onde paramos e qual é o próximo PR (o hook de início de sessão mostra o resumo).
- Para trabalhar num PR, use /comecar. Para finalizar, /encerrar. Não pule etapas.
- Docs: ESPECIFICACAO (o quê), ARQUITETURA (como), MODELO-DE-DADOS, API, DESIGN, ROADMAP (cards dos PRs), DECISOES, BOAS-PRATICAS, DEFINICAO-DE-PRONTO, INTEGRANTES.

## Regras inegociáveis
1. IMPORTANT: um PR = um card do docs/ROADMAP.md. Faça só o escopo do card; ideias extras vão para "Ideias para depois" no ESTADO.md.
2. Nunca commite nem envie na main. Branch: feature/pr-XX-descricao-curta. Para atualizar a branch: `git merge origin/main` (nunca rebase, nunca force push).
3. Commits em Conventional Commits, em português (ex.: `feat(treinos): cadastro de treino`). IMPORTANT: nenhum commit ou PR menciona IA; sem linha Co-Authored-By. Nunca altere `git config user.*` nem use `--author`: a autoria é do integrante que está na máquina.
4. Nada é "pronto" sem evidência: rode `npm run verificar` e mostre a saída.
5. IMPORTANT: nunca apague, pule, afrouxe ou reescreva um teste existente para ele passar. Se o teste estiver errado, pare e explique.
6. Código de produção nunca é simulado: nada de dados fixos fingindo API, mock ou TODO no lugar da lógica. Mocks só em testes.
7. Dependências só da lista aprovada (docs/ARQUITETURA.md). Pacote novo: confirme que existe e é mantido (`npm view`, `composer show -a`), fixe a versão e justifique em docs/DECISOES.md.
8. Não tem certeza se uma função existe na versão instalada? Consulte a documentação da versão (no backend, a busca de docs do Laravel Boost). Nunca invente API, pacote, URL ou link de vídeo.
9. Comandos destrutivos são bloqueados por hook. Não tente contornar; se precisar, peça ao humano.
10. Segredos: nunca leia nem grave valores reais em .env; use .env.example com valores falsos.
11. Documentação viva: todo PR atualiza docs/ESTADO.md, docs/ROADMAP.md, CHANGELOG.md e docs/historico/PR-XX.md; migrations → MODELO-DE-DADOS.md; rotas → API.md; dependências ou arquitetura → DECISOES.md. O CI barra o PR se faltar.
12. Só pergunte ao humano se estiver bloqueado. Dúvida de regra de negócio: siga docs/ESPECIFICACAO.md; se não estiver lá, escolha a opção mais simples e registre em ESTADO.md > Pendências.

## Comandos (sempre a partir da raiz)
- `npm run setup` — git hooks e conferência do ambiente
- `npm run dev` — banco (Docker), API e front
- `npm run verificar` — tudo que o CI roda; `npm run verificar -- --pronto` antes de encerrar
- `npm run teste:api`, `npm run teste:web`, `npm run teste:e2e`
- Artisan: `php backend/artisan ...` · Composer: `composer --working-dir=backend ...` · front: `npm --prefix frontend ...`
- Não use `cd` para entrar em backend/ ou frontend/. Ambiente: Windows (Git Bash ou PowerShell).
- Os comandos de backend e frontend passam a existir nos PR-01 e PR-02.

## Backend (Laravel 13, PHP 8.4)
- Domínio em português sem acento (Treino, Exercicio, Sessao; tabela sessao_series). Exceções do framework: tabela users, password, remember_token, timestamps, tabelas do Laravel e do Sanctum, chaves data/links/meta/message/errors do JSON.
- Todo model declara a tabela com `#[Table('...')]` (o Eloquent pluraliza em inglês). Use os atributos do Laravel 13 (#[Table], #[Fillable], #[Hidden]) e nunca o atributo e a propriedade equivalente ao mesmo tempo.
- Fluxo: rota → FormRequest → Controller fino → Service (regra de negócio; DB::transaction quando grava mais de uma tabela) → Model. Autorização por Policy. Resposta por API Resource. Enums PHP em app/Enums.
- Dependências pelo construtor. Interface só em fronteira externa ou quando o teste precisa trocar a implementação.
- `Model::shouldBeStrict()` fora de produção: N+1 vira erro; use eager loading.
- Rotas em /api/v1, português, kebab-case.
- Pest para cada endpoint: sucesso, 422, 401 e 403/404 (recurso de outro usuário).

## Frontend (React + Vite + Tailwind, JavaScript)
- src/funcionalidades/<modulo>/ (api.js, hooks.js, componentes/), src/paginas/, src/componentes/ (design system), src/lib/ (http, utilidades).
- Dados do servidor só via TanStack Query; HTTP só pelo src/lib/http.js (axios com withCredentials e withXSRFToken).
- Formulários com React Hook Form + Zod, mensagens em pt-BR.
- Toda tela tem estados de carregando, erro e vazio.
- WCAG 2.2 AA: rótulo em todo campo, foco visível, alvos ≥ 24 px (botões principais 44 px), contraste AA, gráfico com tabela equivalente, nada que dependa só de arrastar. ESLint jsx-a11y sem avisos.
- Cores, fontes e espaçamentos só pelos tokens do docs/DESIGN.md.

## Ao compactar
Preserve: PR atual e card, arquivos alterados, comandos de teste usados, resultado da última verificação e pendências.
