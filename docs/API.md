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

## PR-16 — sessões de treino (POST /sessoes e GET /sessoes/{id})

Rotas no grupo `auth:sanctum` + `throttle:api` (limitador `api`: 60 requisições por minuto por usuário, definido no AppServiceProvider; acima disso 429 com a mensagem fixa). Sem sessão: 401. Datas de entrada em ISO 8601 **com fuso** (`2026-11-06T21:00:00Z`, `2026-11-06T18:00:00.000-03:00`); sem fuso → 422. Datas de saída sempre em UTC com `Z`.

### POST /sessoes — logado (qualquer papel)
| Campo | Regras |
|---|---|
| id_cliente | obrigatório, uuid gerado no cliente; chave da idempotência |
| origem | obrigatório; neste PR só `cronometro` (`registro_rapido` entra no PR-17) |
| treino_id | obrigatório quando origem = cronometro, inteiro; treino precisa existir, não estar excluído e ser visível ao usuário (RN-06: autor, público, ou atletas do autor), senão 404 |
| iniciada_em, finalizada_em | obrigatórios, ISO 8601 com fuso; finalizada_em ≥ iniciada_em e ≤ agora + 5 min |
| duracao_segundos | obrigatório, inteiro 0–86400 (tempo ativo, sem pausas) |
| observacao | opcional, texto até 1000 |
| series | obrigatório, lista de 1 a 200 itens |
| series.*.exercicio_id | obrigatório, inteiro; precisa ser exercício de um item do treino (exercício excluído da biblioteca é aceito, RN-07); fora do treino → 422 em `series.N.exercicio_id` |
| series.*.numero | obrigatório, inteiro 1–999; o par (exercicio_id, numero) não se repete |
| series.*.repeticoes, acertos, erros | opcionais, inteiros 0–999 (acertos e erros gravam 0 quando ausentes) |
| series.*.duracao_segundos | opcional, inteiro 0–86400 |

`usuario_id` e `fundamento` nunca vêm do cliente (ignorados se enviados): usuario_id é o usuário logado e o fundamento de cada série é copiado do exercício no servidor.

Idempotência: mesmo `id_cliente` do mesmo usuário → responde a sessão já gravada, sem gravar nada e sem revalidar treino ou séries (vale mesmo que o treino tenha sido excluído depois). `id_cliente` já usado por outro usuário → 422 em `id_cliente` ("Este id_cliente já foi usado em outra sessão."), sem revelar a sessão alheia. Dois envios simultâneos: o índice único barra o segundo e o Service devolve a sessão gravada pelo primeiro.

- 201 no primeiro envio, 200 no reenvio; mesmo corpo nos dois casos:
```json
{ "data": {
  "id": 40, "id_cliente": "0b8f6c1e-3f0a-4a57-9d0e-2a4c6c1f7b11", "origem": "cronometro",
  "treino": { "id": 12, "nome": "Recepção básica" },
  "iniciada_em": "2026-11-06T21:00:00Z", "finalizada_em": "2026-11-06T21:38:10Z",
  "duracao_segundos": 2100, "observacao": null,
  "series": [
    { "id": 301, "exercicio": { "id": 5, "nome": "Manchete na parede", "removido": false },
      "fundamento": "recepcao", "numero": 1, "repeticoes": 10, "acertos": 7, "erros": 3, "duracao_segundos": 95 }
  ]
} }
```
- `treino` vem preenchido também para treino excluído logicamente (RN-08) e é `null` só se o treino foi apagado de vez. `exercicio.removido` é `true` quando o exercício tem deleted_at (selo "removido da biblioteca"); `exercicio` é `null` só se foi apagado de vez. `series` na ordem de envio.
- Erros: 401 · 404 treino inexistente, excluído ou não visível · 422 validação · 429 · 419 CSRF (o http.js repete uma vez).

### GET /sessoes/{id} — dono
- 200 com o mesmo formato acima. 404 para sessão inexistente ou de outro usuário (SessaoPolicy com `denyAsNotFound`; nunca 403). 401 sem sessão. 429 acima do limite.
