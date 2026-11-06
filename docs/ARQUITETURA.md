# Arquitetura

## Visão geral
Navegador (SPA React) → mesma origem → API Laravel (/api/v1) → PostgreSQL. Em desenvolvimento, o Vite (5173) encaminha /api, /sanctum e /docs para o Laravel (8000); o `vite preview` (4173) faz o mesmo. As variáveis de ambiente E2E_WEB_PORT e E2E_API_PORT trocam a porta do front e a porta da API (ADR-017). Em produção, o Laravel serve os arquivos do SPA e a API no mesmo domínio, exigência do Sanctum com cookies.

## MVC em camadas (backend)
Rota → Middleware (request id, autenticação, rate limit) → FormRequest (validação) → Controller fino → Service (regra de negócio, transações) → Model Eloquent → banco. Policies fazem a autorização e API Resources montam o JSON. O React é a camada de apresentação para o usuário.
Pastas: app/Http/Controllers/Api/V1, app/Http/Requests, app/Http/Resources, app/Services, app/Policies, app/Models, app/Enums, app/Contracts (interfaces de fronteira), database/migrations, database/seeders, routes/api.php, tests/Unit, tests/Feature.

## Frontend
src/app (rotas e provedores), src/paginas, src/funcionalidades/<modulo>/ (api.js, hooks.js, componentes/), src/componentes (design system), src/lib (http, datas, formatação), src/estilos (tokens). Estado do servidor: TanStack Query. Estado local: useState/useReducer. Formulários: React Hook Form + Zod.

O que existe desde o PR-02 (tudo em frontend/):
- src/main.jsx: cria o roteador (createBrowserRouter) e o QueryClient e liga a navegação do cliente HTTP ao roteador.
- src/app/rotas.jsx: tabela única de rotas. As públicas (/entrar, /cadastro, /esqueci-a-senha, /redefinir-senha, /termos e /privacidade) ficam fora do AppShell; as demais ficam dentro. A /dev/status e a /dev/componentes só existem em desenvolvimento e `*` é a 404. A proteção por login e por papel entra a partir do PR-05.
- src/app/AppShell.jsx: link "Pular para o conteúdo", navegação principal e o `<main id="conteudo">`. Desde o PR-03 a navegação é a NavInferior (fixa embaixo) abaixo de 1024 px e a BarraLateral a partir daí; só uma fica montada por vez, escolhida por src/lib/useLarguraMinima.js (ADR-021).
- src/lib/http.js: axios com baseURL /api/v1, withCredentials e withXSRFToken; X-Request-Id novo a cada requisição; em 419 busca /sanctum/csrf-cookie e repete uma vez; em 401 vai para /entrar?voltar=<rota pedida>.
- src/lib/erros.js: `descreverErro(erro)` devolve status, mensagem em pt-BR e o request_id (do corpo, do cabeçalho da resposta ou o enviado).
- src/componentes/: Pagina (h1 e título do documento), Carregando, MensagemDeErro e EstadoVazio. Desde o PR-03, o design system: Botao, CampoTexto, Cartao, ChipFiltro, Etiqueta, Abas (com PainelDaAba), Cabecalho, NavInferior, BarraLateral, Stepper, BarraDeProgresso, Cronometro, Avatar e ModalDeConfirmacao. Um arquivo por componente, com o teste ao lado; todos aceitam `className`, repassam as demais props à raiz, recebem dados só por props e trazem os próprios ícones em SVG inline.
- src/paginas/: uma página por tela, só com o título; paginas/dev/Status.jsx consulta /api/v1/saude com TanStack Query; paginas/dev/CatalogoDeComponentes.jsx junta as seções de paginas/dev/catalogo/ (Base, Navegação, Treino e Apoio).
- src/estilos/tokens.css: tokens do docs/DESIGN.md no `@theme` do Tailwind 4 (a paleta padrão fica desligada; finais desde o PR-03, sem conferência com o Figma). src/estilos/global.css: foco visível global e `prefers-reduced-motion`.
- src/testes/: preparação do Vitest (jest-dom, matcher `toHaveNoViolations` do vitest-axe e servidor MSW que falha em requisição não prevista) e o auxiliar `renderizarRotas`.

## Autenticação
GET /sanctum/csrf-cookie → POST /api/v1/auth/entrar → cookie de sessão HttpOnly → requisições com withCredentials e X-XSRF-TOKEN. Em 419, novo cookie e uma única repetição. Sessões no banco.

## Erros e logs
Exceções da API viram JSON com message, errors (validação) e request_id, sem stack trace fora de local. Logs em JSON com request_id (Context), em stderr na produção e em arquivo no desenvolvimento. O front envia X-Request-Id em toda requisição e mostra o id nas mensagens de erro.

## Qualidade
- Backend: Pest (unidade e integração com banco real), Larastan e Pint.
- Frontend: Vitest + Testing Library + MSW + vitest-axe, ESLint (react-hooks, jsx-a11y) e Prettier.
- Ponta a ponta: Playwright + axe.
- O CI no GitHub Actions bloqueia o merge com qualquer falha.

## Dependências aprovadas
Fixe versões exatas. Adicionar outra exige registro no DECISOES.md.
- Backend: laravel/framework 13, laravel/sanctum, dedoc/scramble, laravel/pulse (PR-28).
- Backend, desenvolvimento: pestphp/pest 4, pestphp/pest-plugin-laravel, larastan/larastan, laravel/pint, laravel/boost, fakerphp/faker, mockery/mockery.
- Frontend: react, react-dom, react-router, @tanstack/react-query, axios, react-hook-form, zod, @hookform/resolvers, recharts, tailwindcss e @tailwindcss/vite (4.2.2 ou mais nova), vite 8, @vitejs/plugin-react, vite-plugin-pwa (PR-26), idb-keyval (PR-27).
- Frontend, desenvolvimento: vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/dom, @testing-library/user-event, @testing-library/jest-dom, msw, vitest-axe, eslint, @eslint/js, globals, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y, prettier, @playwright/test, @axe-core/playwright.
- Raiz: concurrently.

## Deploy
Uma imagem Docker (front buildado + Laravel) no Render (plano grátis) e PostgreSQL no Neon (plano grátis). Deploy automático ao entrar na main. Variáveis no painel do Render, nunca no repositório.
