# Matriz de boas práticas (documento do professor)
A coluna "Onde" recebe os caminhos dos arquivos conforme os PRs entregam.

| Item | Como o projeto atende | Onde |
|------|----------------------|------|
| Camadas e desacoplamento | MVC em camadas (Controller → Service → Model), Policies e Resources; SPA separado consumindo a API | docs/ARQUITETURA.md |
| SRP | FormRequest valida, Service decide, Controller orquestra, Resource formata | backend/app/Http/Controllers/Api/V1, backend/app/Services, backend/app/Http/Resources |
| OCP | Regras novas entram em Policies e Services novos, sem alterar os existentes | |
| LSP | Implementações de interfaces de fronteira trocáveis nos testes | backend/app/Contracts/VerificadorBanco.php, backend/tests/Feature/SaudeTest.php |
| ISP | Interfaces pequenas e específicas (ex.: GeradorDeCodigoConvite) | backend/app/Contracts/VerificadorBanco.php |
| DIP | Injeção pelo construtor via container do Laravel | backend/app/Services/SaudeService.php, backend/app/Providers/AppServiceProvider.php |
| KISS e YAGNI | Escopo fechado por PR; sem abstração especulativa (ADR-002) | CLAUDE.md, docs/ROADMAP.md |
| DRY | Enums únicos no backend, expostos em /referencias para o front; tokens e componentes únicos no design system | backend/app/Enums, backend/app/Services/ReferenciasService.php, frontend/src/estilos/tokens.css, frontend/src/componentes/ |
| Nomenclatura expressiva | Português claro, sem abreviações; Pint e ESLint | backend/pint.json, frontend/src/componentes/ (componentes e props em português) |
| Funções pequenas | Revisão em todo PR e análise estática | |
| Tratamento de erros | Handler central com JSON padrão e request_id; nada de catch silencioso | backend/bootstrap/app.php, backend/tests/Feature/ErrosJsonTest.php |
| ORM | Eloquent | |
| Migrations | Todo o schema versionado; migration mergeada nunca é editada | |
| Transações | DB::transaction nos services que gravam várias tabelas | |
| N+1 e índices | Modo estrito (lazy loading vira erro), eager loading e índices do MODELO-DE-DADOS | backend/app/Providers/AppServiceProvider.php |
| Validação de entradas | FormRequests no servidor; Zod no front | |
| Gestão de segredos | .env fora do Git, variáveis no Render e no GitHub, gitleaks no CI | .gitignore, backend/.env.example, .github/workflows/ci.yml |
| Autenticação e autorização (RBAC) | Sanctum SPA (ADR-003), papéis + Policies, menor privilégio | |
| OWASP Top 10 | Checklist A01–A10 no PR-29 e revisor de segurança | |
| Injeção de dependência e mocks | Construtor; testes substituem implementações de fronteira | backend/tests/Feature/SaudeTest.php |
| Pirâmide de testes | Pest (unidade e integração), Vitest, Playwright | backend/tests, frontend/src/**/*.test.{js,jsx}, frontend/src/testes/ |
| Análise estática | Larastan, Pint, ESLint; SonarQube Cloud só quando o segredo SONAR_TOKEN existe (ADR-027) | backend/phpstan.neon, backend/pint.json, frontend/eslint.config.js, frontend/.prettierrc.json, sonar-project.properties, .github/workflows/ci.yml (job sonar) |
| Versionamento e code review | GitHub Flow, um PR por funcionalidade, revisão em todo PR (ADR-007) | |
| CI/CD | GitHub Actions e deploy automático no Render | .github/workflows/ci.yml (jobs governanca, frontend, backend e sonar) |
| Logs estruturados | JSON com request_id e usuário; uma linha por requisição (rota, status, duração, usuário) no canal `requisicoes`, sem corpo nem dados pessoais | backend/config/logging.php, backend/app/Http/Middleware/RegistrarRequisicao.php, backend/tests/Feature/LogDeRequisicaoTest.php |
| Correlation IDs | X-Request-Id do front até o log e de volta à tela: o usuário copia o código do erro e o suporte o procura em requisicoes-*.log e laravel-*.log | backend/app/Http/Middleware/RequestId.php, backend/app/Http/Middleware/RegistrarRequisicao.php, frontend/src/lib/http.js, frontend/src/lib/erros.js, frontend/src/componentes/MensagemDeErro.jsx, frontend/src/funcionalidades/observabilidade/correlacao.test.jsx |
| Métricas e health checks | /up, /api/v1/saude, Laravel Pulse em /pulse (só admin, gate viewPulse) e latência e erros por rota no log de requisições | backend/app/Http/Controllers/Api/V1/SaudeController.php, backend/app/Services/SaudeService.php, backend/app/Providers/AppServiceProvider.php, backend/resources/views/vendor/pulse/dashboard.blade.php, backend/tests/Feature/PulseAcessoTest.php |
| Documentação | OpenAPI gerado pelo Scramble (/docs/api), README e docs/ | README.md, docs/API.md |
