# Arquitetura

## Visão geral
Navegador (SPA React) → mesma origem → API Laravel (/api/v1) → PostgreSQL. Em desenvolvimento, o Vite (5173) encaminha /api, /sanctum e /docs para o Laravel (8000). Em produção, o Laravel serve os arquivos do SPA e a API no mesmo domínio, exigência do Sanctum com cookies.

## MVC em camadas (backend)
Rota → Middleware (request id, autenticação, rate limit) → FormRequest (validação) → Controller fino → Service (regra de negócio, transações) → Model Eloquent → banco. Policies fazem a autorização e API Resources montam o JSON. O React é a camada de apresentação para o usuário.
Pastas: app/Http/Controllers/Api/V1, app/Http/Requests, app/Http/Resources, app/Services, app/Policies, app/Models, app/Enums, app/Contracts (interfaces de fronteira), database/migrations, database/seeders, routes/api.php, tests/Unit, tests/Feature.

## Frontend
src/app (rotas e provedores), src/paginas, src/funcionalidades/<modulo>/ (api.js, hooks.js, componentes/), src/componentes (design system), src/lib (http, datas, formatação), src/estilos (tokens). Estado do servidor: TanStack Query. Estado local: useState/useReducer. Formulários: React Hook Form + Zod.

## Autenticação
GET /sanctum/csrf-cookie → POST /api/v1/auth/entrar → cookie de sessão HttpOnly → requisições com withCredentials e X-XSRF-TOKEN. Em 419, novo cookie e uma única repetição. Sessões no banco.

## Erros e logs
Exceções da API viram JSON com message, errors (validação) e request_id, sem stack trace fora de local. Logs em JSON com request_id (Context), em stderr na produção e em arquivo no desenvolvimento. O front envia X-Request-Id em toda requisição e mostra o id nas mensagens de erro.

## Qualidade
- Backend: Pest (unidade e integração com banco real), Larastan e Pint.
- Frontend: Vitest + Testing Library + MSW, ESLint (react-hooks, jsx-a11y) e Prettier.
- Ponta a ponta: Playwright + axe.
- O CI no GitHub Actions bloqueia o merge com qualquer falha.

## Dependências aprovadas
Fixe versões exatas. Adicionar outra exige registro no DECISOES.md.
- Backend: laravel/framework 13, laravel/sanctum, dedoc/scramble, laravel/pulse (PR-28).
- Backend, desenvolvimento: pestphp/pest 4, pestphp/pest-plugin-laravel, larastan/larastan, laravel/pint, laravel/boost, fakerphp/faker, mockery/mockery.
- Frontend: react, react-dom, react-router, @tanstack/react-query, axios, react-hook-form, zod, @hookform/resolvers, recharts, tailwindcss e @tailwindcss/vite (4.2.2 ou mais nova), vite 8, @vitejs/plugin-react, vite-plugin-pwa (PR-26), idb-keyval (PR-27).
- Frontend, desenvolvimento: vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, msw, vitest-axe, eslint, @eslint/js, globals, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y, prettier, @playwright/test, @axe-core/playwright.
- Raiz: concurrently.

## Deploy
Uma imagem Docker (front buildado + Laravel) no Render (plano grátis) e PostgreSQL no Neon (plano grátis). Deploy automático ao entrar na main. Variáveis no painel do Render, nunca no repositório.
