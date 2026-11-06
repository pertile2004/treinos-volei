# Contrato da API — /api/v1

Autenticação: sessão Sanctum (cookie) na mesma origem. Antes de POST, PUT, PATCH e DELETE, o front obtém o cookie CSRF em GET /sanctum/csrf-cookie (o axios envia o X-XSRF-TOKEN). Toda resposta traz X-Request-Id.

Formatos:
- Recurso único: { "data": {...} }
- Lista paginada: { "data": [...], "links": {...}, "meta": {...} }, com 15 itens por página, máximo 50, parâmetro page.
- Erro: { "message": "...", "errors": { "campo": ["..."] }, "request_id": "..." }

Códigos:
- 200, 201, 202 e 204: sucesso.
- 401: não autenticado. 403: sem permissão. 404: não existe ou não é seu.
- 419: CSRF expirado — pegar o cookie de novo e repetir uma vez.
- 422: validação. 429: limite excedido.
- 500 e 503: erro do servidor, sempre com request_id.

Cada PR detalha aqui os campos de requisição e resposta do que implementar.

| Rota | Quem | Descrição | PR |
|------|------|-----------|----|
| POST /auth/cadastro | público | cria conta e inicia sessão | 04 |
| POST /auth/entrar | público | inicia sessão | 05 |
| POST /auth/sair | logado | encerra sessão | 05 |
| POST /auth/esqueci-senha | público | envia link (sempre 202) | 06 |
| POST /auth/redefinir-senha | público | troca a senha com token | 06 |
| GET, PATCH e DELETE /eu | logado | perfil; excluir conta exige senha | 05, 07 |
| PUT /eu/senha | logado | troca a senha | 07 |
| GET /eu/exportacao | logado | download JSON dos dados | 07 |
| POST e DELETE /eu/treinador | jogador | vincular ou desvincular por código | 22 |
| GET /referencias | público | fundamentos, níveis, etapas e visibilidades com rótulos | 01 |
| GET /saude | público | status da API e do banco | 01 |
| GET /exercicios e /exercicios/{id} | logado | listar (fundamento, nivel, busca) e detalhar | 08 |
| POST /exercicios, PUT e DELETE /exercicios/{id} | admin | gerir a biblioteca | 09, 10, 11 |
| GET /treinos (escopo meus, treinador ou destaque) e /treinos/{id} | logado | listar e detalhar conforme a visibilidade | 13 |
| POST /treinos, PUT e DELETE /treinos/{id} | autor | criar, alterar e excluir treino | 12, 14, 15 |
| POST /sessoes | logado | salvar sessão (idempotente por id_cliente) | 16, 17 |
| GET /sessoes, GET e DELETE /sessoes/{id} | dono | histórico e correção de registro | 16, 18 |
| GET /estatisticas (periodo semana, mes, 3meses ou ano) | logado | volume, % por fundamento e frequência | 19 |
| GET e POST /agendamentos, PATCH e DELETE /agendamentos/{id} | dono | agenda | 21 |
| POST /treinador/codigo | treinador | gerar ou regenerar o código | 22 |
| GET /treinador/atletas e DELETE /treinador/atletas/{id} | treinador | atletas vinculados | 22 |
| GET /treinador/atletas/{id}/estatisticas | treinador vinculado | evolução do atleta | 24 |

Rotas fora de /api/v1: GET /sanctum/csrf-cookie, GET /up e GET /docs/api (OpenAPI gerado do código pelo Scramble; só em local e, em produção, só para admin).
