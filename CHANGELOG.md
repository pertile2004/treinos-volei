# Changelog
Formato Keep a Changelog, em português. Versões em SemVer.

## [Não lançado]
### Adicionado
- Fundação do repositório: documentação, regras de trabalho, verificações de documentação e de autoria e CI de governança.
- Esqueleto do backend (PR-01): API Laravel 13 em backend/ com PostgreSQL, GET /api/v1/saude e GET /api/v1/referencias, X-Request-Id em toda resposta e no log JSON, erros de /api/* em JSON padrão, cabeçalhos de segurança, CORS restrito à origem do front e mensagens de validação em pt_BR.
- Ambiente de desenvolvimento: docker-compose.yml (PostgreSQL 17 e Mailpit), `npm run dev:api` e `npm run teste:api`; o `npm run dev` prepara o banco e sobe a API e o front juntos.
- Qualidade do backend: Pest 4, Larastan nível 6, Pint, Scramble (/docs/api em desenvolvimento), Laravel Boost e o job `backend` no CI.
- Esqueleto do frontend (PR-02): app React navegável em frontend/ com as rotas de todas as telas (só o título), página 404, AppShell com a navegação principal, cliente HTTP (X-Request-Id, repetição única em 419 e ida para /entrar em 401), componentes Carregando, MensagemDeErro e EstadoVazio e a página /dev/status (só em desenvolvimento).
- Scripts `npm run dev:web` e `npm run teste:web` na raiz e job `frontend` no CI (lint, testes com cobertura, build e auditoria das dependências).
- Design system (PR-03): tokens finais no tema do Tailwind (borda de controle, fonte do sistema, tamanhos de destaque e de cronômetro) e os componentes Botao, CampoTexto, Cartao, ChipFiltro, Etiqueta, Abas, Cabecalho, NavInferior, BarraLateral, Stepper, BarraDeProgresso, Cronometro, Avatar e ModalDeConfirmacao, acessíveis e testados com axe.
- Catálogo /dev/componentes (só em desenvolvimento), com todos os componentes em todos os estados, e tabela de contraste no docs/DESIGN.md.
- Agenda (PR-21): tabela agendamentos, GET e POST /api/v1/agendamentos e PATCH e DELETE /api/v1/agendamentos/{id} (só do dono, com Policy e 404 para o que não é seu); AgendamentoService com o vínculo automático da sessão de hoje e a remoção dos agendamentos futuros ao excluir um treino (RN-08), prontos para os cards de sessões e de treinos chamarem.
- Tela Agenda (/agenda): semana de segunda a domingo com navegação, agendar treino em dia e hora (React Hook Form + Zod), editar, remover com confirmação, etiqueta Pendente/Concluído e "Iniciar treino"; lembrete discreto de treino de hoje pendente em todas as telas do app (dispensável até o fim do dia); componente AgendaDoDia e hooks useAgendamentosDeHoje e useProximosAgendamentos para o Início.
- Base compartilhada do frontend: datas.js, formatos.js e tabelas.js em src/lib (iguais em todas as frentes), formularios.js (erros 422 nos campos) e useHoje; dependências react-hook-form 7.91.0, zod 4.6.7 e @hookform/resolvers 7.0.3.
### Alterado
- AppShell usa os componentes do design system: barra de navegação inferior abaixo de 1024 px e barra lateral a partir daí, com ícones.
- Transições e animações são desligadas para quem pede menos movimento no sistema.
