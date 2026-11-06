# Matriz de boas práticas (documento do professor)
A coluna "Onde" recebe os caminhos dos arquivos conforme os PRs entregam.

| Item | Como o projeto atende | Onde |
|------|----------------------|------|
| Camadas e desacoplamento | MVC em camadas (Controller → Service → Model), Policies e Resources; SPA separado consumindo a API | docs/ARQUITETURA.md |
| SRP | FormRequest valida, Service decide, Controller orquestra, Resource formata | |
| OCP | Regras novas entram em Policies e Services novos, sem alterar os existentes | |
| LSP | Implementações de interfaces de fronteira trocáveis nos testes | |
| ISP | Interfaces pequenas e específicas (ex.: GeradorDeCodigoConvite) | |
| DIP | Injeção pelo construtor via container do Laravel | |
| KISS e YAGNI | Escopo fechado por PR; sem abstração especulativa (ADR-002) | CLAUDE.md, docs/ROADMAP.md |
| DRY | Enums únicos no backend, expostos em /referencias para o front | |
| Nomenclatura expressiva | Português claro, sem abreviações; Pint e ESLint | |
| Funções pequenas | Revisão em todo PR e análise estática | |
| Tratamento de erros | Handler central com JSON padrão e request_id; nada de catch silencioso | |
| ORM | Eloquent | |
| Migrations | Todo o schema versionado; migration mergeada nunca é editada | |
| Transações | DB::transaction nos services que gravam várias tabelas | |
| N+1 e índices | Modo estrito (lazy loading vira erro), eager loading e índices do MODELO-DE-DADOS | |
| Validação de entradas | FormRequests no servidor; Zod no front | |
| Gestão de segredos | .env fora do Git, variáveis no Render e no GitHub, gitleaks no CI | |
| Autenticação e autorização (RBAC) | Sanctum SPA (ADR-003), papéis + Policies, menor privilégio | |
| OWASP Top 10 | Checklist A01–A10 no PR-29 e revisor de segurança | |
| Injeção de dependência e mocks | Construtor; testes substituem implementações de fronteira | |
| Pirâmide de testes | Pest (unidade e integração), Vitest, Playwright | frontend/src/**/*.test.{js,jsx}, frontend/src/testes/ |
| Análise estática | Larastan, Pint, ESLint; SonarQube Cloud opcional (PR-28) | frontend/eslint.config.js, frontend/.prettierrc.json |
| Versionamento e code review | GitHub Flow, um PR por funcionalidade, revisão em todo PR (ADR-007) | |
| CI/CD | GitHub Actions e deploy automático no Render | .github/workflows/ci.yml (jobs governanca e frontend) |
| Logs estruturados | JSON com request_id e usuário | |
| Correlation IDs | X-Request-Id do front até o log | frontend/src/lib/http.js, frontend/src/lib/erros.js, frontend/src/componentes/MensagemDeErro.jsx |
| Métricas e health checks | /up, /api/v1/saude e Laravel Pulse | |
| Documentação | OpenAPI gerado pelo Scramble (/docs/api), README e docs/ | |
