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

## PR-21 — agenda (/agendamentos)
Todas exigem sessão (`auth:sanctum`; sem sessão, 401). Agendamento que não existe ou é de outro usuário responde 404 (Policy do dono com `denyAsNotFound`). "Hoje" é sempre o dia local em America/Sao_Paulo, calculado no servidor (RN-01). Sem rate limit específico (o throttle da API é transversal e fica para o card de autenticação).

Recurso `Agendamento` (igual em todas as respostas; o envelope `{ "data": {...} }` é montado à mão porque o recurso tem um campo chamado `data`):
```json
{ "data": { "id": 12, "data": "2026-11-09", "hora": "18:30", "concluido": false, "sessao_id": null,
            "treino": { "id": 5, "nome": "Saque e recepção", "duracao_estimada_minutos": 40 } } }
```
`hora` é "HH:MM" ou null. `concluido` = `sessao_id` não nulo. `treino` vem por eager loading, inclusive treino excluído logicamente (os agendamentos passados continuam legíveis).

### GET /agendamentos — dono
- Query: `de` (obrigatório, Y-m-d) e `ate` (obrigatório, Y-m-d, igual ou posterior a `de`). Intervalo de no máximo 31 dias corridos contando os dois extremos (`de=2026-11-01&ate=2026-12-01` passa; `ate=2026-12-02` dá 422).
- 200: `{ "data": [ {...}, ... ] }`, só do usuário logado, ordenado por `data`, `hora` (sem hora por último) e `id`. Sem paginação: o intervalo é limitado.
- 422 em `de`/`ate`: "Informe a data inicial.", "Informe a data final.", "A data final não pode ser anterior à inicial.", "O intervalo não pode passar de 31 dias." e, para formato inválido, a mensagem padrão "O campo de/até deve estar no formato Y-m-d.".

### POST /agendamentos — logado (vira dono)
- Corpo: `treino_id` (obrigatório, inteiro; treino existente, não excluído e visível ao usuário pela RN-06: dele, público, ou "para atletas" cujo autor é o seu treinador), `data` (obrigatório, Y-m-d, hoje ou futuro) e `hora` (opcional, null ou H:i).
- 201 com o recurso.
- 422: `treino_id` inexistente, excluído ou invisível respondem igual, "Escolha um treino." (sem revelar se existe); `data` "Informe a data." / "A data não pode ser anterior a hoje." / "O campo data deve estar no formato Y-m-d."; `hora` "O campo hora deve estar no formato H:i." (inclusive "18:30:00").

### PATCH /agendamentos/{id} — dono
- Corpo: `data` (opcional, mesmas regras) e `hora` (opcional, null ou H:i). `treino_id` e `sessao_id` enviados são ignorados.
- 200 com o recurso. 404 se não existe ou não é seu.
- 422 em agendamento já concluído: `{ "message": "Este agendamento já foi concluído.", "errors": { "agendamento": ["Este agendamento já foi concluído."] } }` (a chave `agendamento` não é um campo do formulário; o front a mostra como aviso geral).

### DELETE /agendamentos/{id} — dono
- 204, sem corpo. Exclusão física; a sessão vinculada, se houver, continua. 404 se não existe ou não é seu.

### Serviços para os outros cards (sem rota própria)
- `AgendamentoService::vincularSessaoDeHoje(Sessao): ?Agendamento` — vínculo automático (RF-13): a sessão recém-criada com `treino_id` conclui o agendamento pendente de hoje do mesmo usuário e treino (menor hora, depois menor id). O `SessaoService::registrar` (PR-16) deve chamá-lo dentro da transação, só quando a sessão foi criada agora (não no reenvio idempotente por `id_cliente`).
- `AgendamentoService::removerFuturosDoTreino(Treino): int` — RN-08: remove os agendamentos pendentes do treino de hoje em diante, de todos os usuários; passados, concluídos e sessões ficam. O service de exclusão de treino (PR-15) deve chamá-lo dentro da transação.
