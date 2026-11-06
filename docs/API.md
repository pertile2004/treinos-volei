# Contrato da API — /api/v1

Autenticação: sessão Sanctum (cookie) na mesma origem. Antes de POST, PUT, PATCH e DELETE, o front obtém o cookie CSRF em GET /sanctum/csrf-cookie (o axios envia o X-XSRF-TOKEN). Toda resposta traz X-Request-Id. Em outra origem (desenvolvimento), o CORS só aceita a origem de FRONTEND_URL, com credenciais.

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

## PR-01 — saúde, referências, request id e erros

### GET /saude — público, sem parâmetros
- 200: `{ "data": { "status": "ok", "banco": "ok", "versao": "0.1.0", "horario": "2026-11-06T12:00:00+00:00" } }`
- 503 (banco inacessível): `{ "data": { "status": "indisponivel", "banco": "fora", "versao": "0.1.0", "horario": "..." }, "message": "Banco de dados indisponível.", "request_id": "<id>" }`
- `versao` vem de APP_VERSAO (padrão 0.1.0); `horario` é o instante da resposta em ISO 8601, sempre em UTC.

### GET /referencias — público, sem parâmetros
- 200: `{ "data": { "papeis": [...], "fundamentos": [...], "niveis": [...], "etapas": [...], "visibilidades": [...], "origens_sessao": [...] } }`
- Cada item é `{ "valor": "recepcao", "rotulo": "Recepção" }`, na ordem abaixo. O front usa `valor` nas requisições e `rotulo` na tela.

| Chave | valor → rótulo |
|-------|----------------|
| papeis | jogador → Jogador · treinador → Treinador · admin → Administrador |
| fundamentos | recepcao → Recepção · levantamento → Levantamento · ataque → Ataque · saque → Saque · bloqueio → Bloqueio · defesa → Defesa · preparo_fisico → Preparo físico |
| niveis | iniciante → Iniciante · intermediario → Intermediário · avancado → Avançado |
| etapas | aquecimento → Aquecimento · tecnica → Técnica · especifico → Específico · volta_a_calma → Volta à calma |
| visibilidades | privado → Privado · atletas → Atletas · publico → Público |
| origens_sessao | cronometro → Cronômetro · registro_rapido → Registro rápido |

### X-Request-Id
- Toda resposta traz o header, inclusive erros, /up e 404.
- Se o cliente enviar um X-Request-Id que case com `^[A-Za-z0-9._-]{8,64}$`, a API devolve o mesmo valor; senão, gera um UUID.
- O mesmo id aparece em `request_id` nas respostas de erro e em `extra.request_id` em cada linha do log.

### Erros em /api/*
- Sempre JSON: `{ "message": "...", "request_id": "<id>" }`; em 422 também `errors`.
- Com APP_DEBUG=false (tudo que não é a máquina de desenvolvimento) nunca há `exception`, `file`, `line` nem `trace`.
- Mensagens fixas: 401 "Não autenticado." · 403 "Ação não autorizada." · 404 "Recurso não encontrado." · 405 "Método não permitido." · 429 "Muitas tentativas. Tente de novo em instantes." · 500 "Erro interno do servidor." · 503 "Serviço indisponível."
- 422 traz a mensagem do validador em pt-BR, por exemplo "O campo nome é obrigatório. (e mais 1 erro)".

### Cabeçalhos de segurança (todas as respostas)
`X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()` · `Strict-Transport-Security: max-age=31536000; includeSubDomains` só em produção.
