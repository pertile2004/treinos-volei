# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-03 — Design system a partir do Figma — Integrante 4 — 2026-11-06
- O que entrou: tokens finais no `@theme` do Tailwind (novos: `borda-controle`, `font-sans`, `text-destaque` e `text-cronometro`) e redução de movimento; os 14 componentes do docs/DESIGN.md em frontend/src/componentes/ (Botao, CampoTexto, Cartao, ChipFiltro, Etiqueta, Abas, Cabecalho, NavInferior, BarraLateral, Stepper, BarraDeProgresso, Cronometro, Avatar e ModalDeConfirmacao), cada um com teste de Testing Library e axe; o catálogo /dev/componentes (só em desenvolvimento); o AppShell com NavInferior abaixo de 1024 px e BarraLateral a partir daí; a tabela de contraste no docs/DESIGN.md; vitest-axe 0.1.0.
- Feito sem o Figma e sem as telas exportadas (ADR-018): vale o docs/DESIGN.md; a comparação com o Figma está nas pendências.
- Ainda não há backend nesta branch: o PR-01 — Esqueleto do backend — Integrante 2 corre em paralelo e ainda não está na main.
- Como testar:
  1. `npm run setup` e `npm --prefix frontend ci`
  2. `npm run verificar` (lint, 310 testes e build do front)
  3. `npm run dev:web` e abrir http://localhost:5173/dev/componentes (navegue com Tab; teste em 360 px e em 1440 px)
- Próximo: PR-04 — Cadastro, Termos e Privacidade — Integrante 5 (depende do PR-01, que ainda não está na main, e do PR-03). O PR-01 — Integrante 2 segue em paralelo.

## Em andamento
- (nenhum)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (check `governanca` obrigatório, incluindo administradores) e adicionar os colaboradores.
- [ ] Dono do repositório: tornar o job `frontend` do CI obrigatório. Ele só roda no GitHub quando o PR é aberto; no PR-02 e no PR-03 a mesma sequência foi rodada só na máquina.
- [ ] PR-03, aceite sem evidência: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/ e comparar lado a lado com /dev/componentes; se houver diferença, ajustar os tokens (frontend/src/estilos/tokens.css e docs/DESIGN.md) e confirmar a fonte (ADR-018).
- [ ] PR-03: a branch foi fechada sem `git merge origin/main`. A main já tem o link do PR-02 na tabela do docs/ROADMAP.md, na linha vizinha à do PR-03: ao atualizar a branch pode aparecer conflito nessa tabela (fique com as duas mudanças).
- [ ] PR-03, não conferido: leitor de tela real (o botão de senha troca o nome e também usa `aria-pressed`; o Cronometro anuncia a cada minuto), área segura do iPhone na NavInferior e navegador com fonte padrão diferente de 16 px (o limite de 1024 px do `useLarguraMinima` deixa de coincidir com o `lg` do Tailwind).
- [ ] Depois do merge do PR-01: conferir o `npm run dev` completo (`docker compose up -d`, `php backend/artisan serve` e o front). No PR-02 só o `npm run dev:web` foi conferido, porque não havia backend/, docker-compose.yml nem Docker na máquina.
- [ ] Depois do merge do PR-01: abrir /dev/status com a API real e conferir o formato de /api/v1/saude (a página aceita os campos na raiz ou dentro de `data`). No PR-02 isso foi conferido só com MSW e com o proxy respondendo 502 sem a API.
- [ ] Ao juntar o PR-01 na main: ele também acrescenta ADRs no fim de docs/DECISOES.md e linhas em docs/BOAS-PRATICAS.md e docs/ARQUITETURA.md. Quem fizer o segundo merge renumera os ADRs (o PR-02 usou ADR-016 e ADR-017; o PR-03, ADR-018 a ADR-021) e junta as linhas.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- Componentes fora da lista do PR-03: Select, Toast e Tabela.
- Etiqueta com cor por fundamento e por etapa, quando o Figma definir a paleta.
- Abas: duas na mesma tela com itens de mesmo `id` repetem os ids `aba-<id>` e `painel-<id>`; se precisar, acrescentar um prefixo por grupo.
