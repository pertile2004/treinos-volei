# Modelo de dados (PostgreSQL)
Convenções: português, snake_case e sem acento; id bigint; timestamps em UTC; deleted_at onde há exclusão lógica; toda FK com índice. Enums gravados como texto, com os valores dos enums PHP.

## users (nome do framework)
id · nome varchar(100) · email varchar(255) único · email_verified_at null · password · papel varchar(20): jogador, treinador ou admin (índice) · meta_semanal smallint padrão 3 (1–7) · data_nascimento date null · codigo_convite char(8) null único (só treinador) · treinador_id → users null, vira null se o treinador for apagado (índice) · remember_token · timestamps.

## exercicios
id · nome varchar(120) · descricao text · foco varchar(160) null · fundamento varchar(20) · nivel varchar(20) · series_padrao smallint · repeticoes_padrao smallint null · duracao_segundos_padrao int null · descanso_segundos smallint padrão 45 · video_url null · imagem_url null · criado_por → users null (vira null se apagado) · timestamps · deleted_at. Índices: (fundamento, nivel); busca com unaccent.

## treinos
id · nome varchar(120) · descricao text null · nivel varchar(20) · visibilidade varchar(20): privado, atletas ou publico · autor_id → users (cascata ao excluir a conta) · duracao_estimada_minutos smallint · timestamps · deleted_at. Índice: (autor_id, visibilidade).

## treino_itens
id · treino_id → treinos (cascata) · exercicio_id → exercicios · etapa varchar(20) · ordem smallint · series smallint · repeticoes smallint null · duracao_segundos int null · descanso_segundos smallint. Único: (treino_id, etapa, ordem). Regra: repeticoes ou duracao_segundos precisa estar preenchido.

## sessoes
id · usuario_id → users (cascata) · treino_id → treinos null (vira null se apagado) · origem varchar(20): cronometro ou registro_rapido · iniciada_em timestamptz · finalizada_em timestamptz · duracao_segundos int · observacao text null · id_cliente uuid null único (idempotência offline) · timestamps. Índice: (usuario_id, iniciada_em).

## sessao_series
id · sessao_id → sessoes (cascata) · exercicio_id → exercicios null · fundamento varchar(20) · numero smallint · repeticoes smallint null · acertos smallint padrão 0 · erros smallint padrão 0 · duracao_segundos int null. Índices: sessao_id e fundamento.

## agendamentos
id · usuario_id → users (cascata) · treino_id → treinos (cascata) · data date · hora time null · sessao_id → sessoes null · timestamps. Índice: (usuario_id, data).

## Tabelas do framework
password_reset_tokens, sessions, cache, jobs, personal_access_tokens (Sanctum) e pulse_* (PR-28).

Criadas no PR-01 pelas migrations padrão do Laravel 13 e do Sanctum, sem alteração: password_reset_tokens, sessions, cache, cache_locks, jobs, job_batches, failed_jobs, personal_access_tokens e migrations.

## Relacionamentos
users 1–N treinos, sessoes e agendamentos · users (treinador) 1–N users (atletas) · treinos 1–N treino_itens, sessoes e agendamentos · exercicios 1–N treino_itens e sessao_series · sessoes 1–N sessao_series.

## Migrations entregues com o PR-19 (camada de dados dos cards 04, 08, 12 e 16)
`alterar_users_para_o_dominio` (name → nome, papel, meta_semanal, data_nascimento, codigo_convite, treinador_id), `criar_extensao_unaccent`, `criar_tabela_exercicios`, `criar_tabela_treinos`, `criar_tabela_treino_itens`, `criar_tabela_sessoes` e `criar_tabela_sessao_series`, seguindo as tabelas acima. A tabela agendamentos chega no PR-21. Decisões onde o modelo era omisso (ADR-028):
- `users.papel` sem padrão no banco (a migration preenche `jogador` nas linhas existentes e depois remove o padrão); sem CHECK em `meta_semanal` nem nos valores dos enums (a faixa fica no FormRequest).
- `exercicios.video_url` e `imagem_url` varchar(255).
- `treino_itens.exercicio_id` sem ação ao apagar (o banco barra a exclusão física de exercício usado em treino, RN-07); CHECK `treino_itens_repeticoes_ou_duracao_check` (repeticoes ou duracao_segundos preenchido; aceita os dois).
- `sessao_series.exercicio_id` vira null se o exercício for apagado de vez; "índices sessao_id e fundamento" são dois índices simples.
- Índice simples em toda FK que o modelo não lista: exercicios.criado_por, treino_itens.exercicio_id, sessoes.treino_id e sessao_series.exercicio_id.
- O PR-19 não cria tabela, coluna nem índice: as estatísticas usam (usuario_id, iniciada_em) de sessoes e os índices de sessao_series.
