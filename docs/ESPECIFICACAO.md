# Especificação do produto — VOLLEY PRO

## Visão
Plataforma web, mobile-first e também usável no computador, para praticantes de vôlei estruturarem, executarem e registrarem treinos individuais e verem a evolução em números reais. Base: pesquisa com 11 praticantes — 10 quase nunca registram o que treinam; os recursos mais pedidos são acompanhar a evolução e separar treinos por fundamento.

## Personas
- Rafael, 17, competidor (4+ vezes/semana): quer dados reais de evolução; teme app "gamificado" que não ensina.
- Beatriz, 22, casual (até 1 vez/semana): precisa de rotina simples, treinos prontos e lembretes.
- Lucas, 19, autodidata (2 vezes/semana): quer montar treinos por etapas, salvar e ver vídeos de execução.

## Papéis
Jogador (atleta) · Treinador (tudo do jogador + código de convite, atletas, compartilhar treinos, ver evolução dos atletas) · Admin (biblioteca de exercícios e treinos em destaque; criado por seed).

## Requisitos funcionais
- RF-01 Cadastro com nome, e-mail, senha, papel (jogador ou treinador) e aceite dos termos.
- RF-02 Entrar e sair; sessão mantida ao recarregar.
- RF-03 Recuperar senha por e-mail.
- RF-04 Perfil: editar nome, e-mail, meta semanal (1–7) e data de nascimento (opcional); trocar senha; exportar dados (JSON); excluir conta.
- RF-05 Biblioteca de exercícios: listar, filtrar por fundamento e nível, buscar e ver detalhe com descrição, foco, padrões e vídeo.
- RF-06 Gestão de exercícios (admin): cadastrar, alterar e excluir.
- RF-07 Treinos: criar com etapas e exercícios ordenados; listar meus, do treinador e em destaque; ver detalhe; alterar; excluir.
- RF-08 Modo treino ativo: percorrer exercícios, cronômetro, série X de Y, ajustar séries e repetições, +acerto/+erro, descanso, progresso, finalizar e salvar; o estado sobrevive a recarregar a página.
- RF-09 Registro rápido "Já treinei" em até 3 toques.
- RF-10 Histórico de sessões com detalhe; excluir registro próprio.
- RF-11 Evolução: Semana, Mês, 3 Meses e Ano; volume (min); % de acerto por fundamento; frequência comparada à meta; tabela equivalente aos gráficos.
- RF-12 Início: saudação, data, registro rápido, frequência semanal, agenda do dia, treinos do treinador ou em destaque.
- RF-13 Agenda: agendar treino por dia e hora, listar, concluir e avisar no app sobre treino de hoje pendente.
- RF-14 Treinador: código de convite, vínculo por código, lista de atletas, desvincular, compartilhar treinos e ver evolução do atleta.
- RF-15 Plataforma: responsivo de 360 a 1440 px com barra lateral no desktop; PWA instalável; offline para biblioteca e treinos já vistos; sessão salva offline sincroniza ao reconectar.
- RF-16 Páginas de Termos de Uso e Política de Privacidade.

## Regras de negócio
- RN-01 Semana começa na segunda-feira; fuso America/Sao_Paulo; datas gravadas em UTC.
- RN-02 % de acerto = acertos ÷ (acertos + erros) no período; sem tentativas = "sem dados" (nunca 0%).
- RN-03 Volume = soma das durações em minutos: Semana por dia; Mês e 3 Meses por semana; Ano por mês.
- RN-04 Frequência = dias distintos com sessão na semana atual comparados à meta (padrão 3).
- RN-05 Atleta tem no máximo 1 treinador; o código de convite tem 8 caracteres entre letras A–Z (sem O e I) e dígitos 2–9.
- RN-06 Visibilidade: privado (só o autor); atletas (o treinador autor e seus atletas); publico (só admin cria; aparece como "em destaque").
- RN-07 Exercício excluído sai da biblioteca, mas continua em treinos e no histórico.
- RN-08 Treino excluído não apaga sessões; os agendamentos futuros dele são removidos.
- RN-09 Excluir conta apaga os dados pessoais e as sessões, após confirmar a senha.
- RN-10 Sem gamificação: sem pontos, medalhas, rankings ou sequências.
- RN-11 Cada um só acessa os próprios dados; treinador vê só atletas vinculados; admin gerencia a biblioteca.
- RN-12 Senha com no mínimo 8 caracteres; campos de senha aceitam colar.
- RN-13 Nenhum botão sem função (o login social não aparece).
- RN-14 Qualquer idade pode se cadastrar; data de nascimento opcional (limitação documentada no README).

## Requisitos não funcionais
- Segurança: OWASP Top 10:2025; sessão Sanctum com cookie e CSRF; rate limit (entrar 5/min, cadastro 10/min, API 60/min por usuário); cabeçalhos de segurança; segredos fora do repositório.
- Acessibilidade: WCAG 2.2 AA.
- Desempenho: Lighthouse mobile ≥ 90 em Desempenho e Acessibilidade nas telas principais; listagens paginadas.
- Observabilidade: logs JSON com request_id; /up e /api/v1/saude; métricas.
- Qualidade: cobertura ≥ 70% nos services; E2E dos 4 fluxos obrigatórios.
- Compatibilidade: Chrome, Edge, Firefox e Safari atuais. Idioma: pt-BR.

## Fora de escopo
IA, login social, upload de mídia, notificação push, pagamentos, chat, gamificação e app nativo.

## Glossário
Fundamento (recepção, levantamento, ataque, saque, bloqueio, defesa, preparo físico) · Exercício (drill da biblioteca) · Treino (sequência de exercícios em etapas) · Etapa (aquecimento, técnica, específico, volta à calma) · Sessão (execução registrada de um treino ou registro rápido) · Série · Acerto/Erro · Meta semanal.

## Telas
Entrar, Cadastro, Esqueci a senha, Redefinir senha, Termos, Privacidade, Início, Biblioteca (abas Treinos Prontos e Meus Treinos), Detalhe do exercício, Criar/Editar treino, Detalhe do treino, Treino (escolher ou retomar), Treino ativo, Registro rápido, Histórico, Detalhe da sessão, Evolução, Agenda, Perfil, Treinador (atletas e atleta), Admin (exercícios).

## Fluxos E2E obrigatórios
1. Cadastro → início → sair → entrar. 2. Criar treino. 3. Executar treino e salvar. 4. Ver evolução.
