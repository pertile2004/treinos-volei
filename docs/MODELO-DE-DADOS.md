# Modelo de dados (PostgreSQL)
Convenções: português, snake_case e sem acento; id bigint; timestamps em UTC; deleted_at onde há exclusão lógica; toda FK com índice. Enums gravados como texto, com os valores dos enums PHP.

## users (nome do framework)
id · nome varchar(100) · email varchar(255) único · email_verified_at null · password · papel varchar(20): jogador, treinador ou admin (índice) · meta_semanal smallint padrão 3 (1–7) · data_nascimento date null · codigo_convite char(8) null único (só treinador) · treinador_id → users null, vira null se o treinador for apagado (índice) · remember_token · timestamps.

## exercicios
id · nome varchar(120) · descricao text · foco varchar(160) null · fundamento varchar(20) · nivel varchar(20) · series_padrao smallint · repeticoes_padrao smallint null · duracao_segundos_padrao int null · descanso_segundos smallint padrão 45 · video_url null · imagem_url null · criado_por → users null (vira null se apagado) · timestamps · deleted_at. Índices: (fundamento, nivel); busca com unaccent.

## treinos
id · nome varchar(120) · descricao text null · nivel varchar(20) · visibilidade varchar(20): privado, atletas ou publico · autor_id → users (cascata ao excluir a conta) · duracao_estimada_minutos smallint · timestamps · deleted_at. Índice: (autor_id, visibilidade).

## treino_itens
id · treino_id → treinos (cascata) · exercicio_id → exercicios · etapa varchar(20) · ordem smallint · series smallint · repeticoes smallint null · duracao_segundos int null · descanso_segundos smallint. Único: (treino_id, etapa, ordem). Índice: exercicio_id. Sem timestamps. Regra: repeticoes ou duracao_segundos precisa estar preenchido — CHECK `treino_itens_repeticoes_ou_duracao_check` no banco e `required_without` no FormRequest (PR-12). Migrations: 2026_11_06_201200_criar_tabela_treinos e 2026_11_06_201201_criar_tabela_treino_itens.

Duração estimada (treinos.duracao_estimada_minutos, calculada só pelo servidor em TreinoService): por item, `series × (duracao_segundos, ou repeticoes × 3 s quando não há duração) + series × descanso_segundos`; soma em segundos, arredondada para cima em minutos, mínimo 1 (ADR-027).

## sessoes
id · usuario_id → users (cascata) · treino_id → treinos null (vira null se apagado) · origem varchar(20): cronometro ou registro_rapido · iniciada_em timestamptz · finalizada_em timestamptz · duracao_segundos int · observacao text null · id_cliente uuid null único (idempotência offline) · timestamps. Índice: (usuario_id, iniciada_em).

## sessao_series
id · sessao_id → sessoes (cascata) · exercicio_id → exercicios null · fundamento varchar(20) · numero smallint · repeticoes smallint null · acertos smallint padrão 0 · erros smallint padrão 0 · duracao_segundos int null. Índices: sessao_id e fundamento.

## agendamentos
id · usuario_id → users (cascata) · treino_id → treinos (cascata) · data date · hora time null · sessao_id → sessoes null · timestamps. Índice: (usuario_id, data).

## Tabelas do framework
password_reset_tokens, sessions, cache, jobs, personal_access_tokens (Sanctum) e pulse_* (PR-28).

Criadas no PR-01 pelas migrations padrão do Laravel 13 e do Sanctum, sem alteração: users (ainda só com as colunas do framework: id, name, email, email_verified_at, password, remember_token e timestamps; o PR-04 adapta para o modelo acima), password_reset_tokens, sessions, cache, cache_locks, jobs, job_batches, failed_jobs, personal_access_tokens e migrations.

## Relacionamentos
users 1–N treinos, sessoes e agendamentos · users (treinador) 1–N users (atletas) · treinos 1–N treino_itens, sessoes e agendamentos · exercicios 1–N treino_itens e sessao_series · sessoes 1–N sessao_series.
