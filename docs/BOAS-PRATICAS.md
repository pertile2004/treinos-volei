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
| ORM | Eloquent | backend/app/Models/Agendamento.php (atributos #[Table] e #[Fillable], relação treino com withTrashed), backend/app/Services/AgendamentoService.php |
| Migrations | Todo o schema versionado; migration mergeada nunca é editada | backend/database/migrations/ (ex.: create_agendamentos_table) |
| Transações | DB::transaction nos services que gravam várias tabelas | |
| N+1 e índices | Modo estrito (lazy loading vira erro), eager loading e índices do MODELO-DE-DADOS | backend/app/Providers/AppServiceProvider.php |
| Validação de entradas | FormRequests no servidor; Zod no front | backend/app/Http/Requests/CriarAgendamentoRequest.php, frontend/src/funcionalidades/agenda/componentes/FormularioDeAgendamento.jsx, frontend/src/lib/formularios.js |
| Gestão de segredos | .env fora do Git, variáveis no Render e no GitHub, gitleaks no CI | .gitignore, backend/.env.example, .github/workflows/ci.yml |
| Autenticação e autorização (RBAC) | Sanctum SPA (ADR-003), papéis + Policies, menor privilégio | backend/routes/api.php (grupo auth:sanctum), backend/app/Policies/AgendamentoPolicy.php (dono; alheio responde 404) |
| OWASP Top 10 | Checklist A01–A10 no PR-29 e revisor de segurança | |
| Injeção de dependência e mocks | Construtor; testes substituem implementações de fronteira | backend/tests/Feature/SaudeTest.php |
| Pirâmide de testes | Pest (unidade e integração), Vitest, Playwright | backend/tests, frontend/src/**/*.test.{js,jsx}, frontend/src/testes/ |
| Análise estática | Larastan, Pint, ESLint; SonarQube Cloud opcional (PR-28) | backend/phpstan.neon, backend/pint.json, frontend/eslint.config.js, frontend/.prettierrc.json |
| Versionamento e code review | GitHub Flow, um PR por funcionalidade, revisão em todo PR (ADR-007) | |
| CI/CD | GitHub Actions e deploy automático no Render | .github/workflows/ci.yml (jobs governanca, frontend e backend) |
| Logs estruturados | JSON com request_id e usuário | backend/config/logging.php |
| Correlation IDs | X-Request-Id do front até o log | backend/app/Http/Middleware/RequestId.php, frontend/src/lib/http.js, frontend/src/lib/erros.js, frontend/src/componentes/MensagemDeErro.jsx |
| Métricas e health checks | /up, /api/v1/saude e Laravel Pulse | backend/app/Http/Controllers/Api/V1/SaudeController.php, backend/app/Services/SaudeService.php |
| Documentação | OpenAPI gerado pelo Scramble (/docs/api), README e docs/ | README.md, docs/API.md |
