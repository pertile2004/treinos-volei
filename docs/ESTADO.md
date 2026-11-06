# Estado do projeto — onde paramos
> Atualizado em todo PR pelo /encerrar. Mantenha curto (até ~80 linhas).

## Agora
- Último PR concluído: PR-02 — Esqueleto base do frontend — Integrante 3 — 2026-11-06
- O que entrou: frontend/ com Vite 8, React 19, Tailwind 4, React Router e TanStack Query; src/lib/http.js (X-Request-Id, 419 repete uma vez, 401 manda para /entrar) e src/lib/erros.js; AppShell com a navegação (Início, Biblioteca, Treino, Evolução); as 23 telas da especificação só com o título, a 404 e a /dev/status (só em dev); os componentes Pagina, Carregando, MensagemDeErro e EstadoVazio; ESLint, Prettier e Vitest com Testing Library e MSW; scripts `dev`, `dev:web` e `teste:web` na raiz; job `frontend` no CI.
- Ainda não há backend nesta branch: o PR-01 — Esqueleto do backend — Integrante 2 corre em paralelo e ainda não está na main.
- Como testar:
  1. `npm run setup` e `npm --prefix frontend ci`
  2. `npm run verificar` (lint, 57 testes e build do front)
  3. `npm run dev:web` e abrir http://localhost:5173 (sem a API no ar, /dev/status mostra o erro tratado)
- Próximo: PR-03 — Design system a partir do Figma — Integrante 4 (depende do PR-02 e das telas do Figma em docs/design/telas/). O PR-01 — Integrante 2 segue em paralelo.

## Em andamento
- (nada)

## Pendências
- [ ] PENDENTE: o grupo vai enviar nomes, usuários do GitHub e e-mails → preencher docs/INTEGRANTES.md.
- [ ] Dono do repositório: proteger a main (check `governanca` obrigatório, incluindo administradores) e adicionar os colaboradores.
- [ ] Dono do repositório: tornar o job `frontend` do CI obrigatório. Ele só roda no GitHub quando o PR é aberto; no PR-02 a mesma sequência foi rodada só na máquina.
- [ ] Antes do PR-03: exportar as 6 telas do Figma em PNG 2x para docs/design/telas/.
- [ ] Depois do merge do PR-01: conferir o `npm run dev` completo (`docker compose up -d`, `php backend/artisan serve` e o front). No PR-02 só o `npm run dev:web` foi conferido, porque não havia backend/, docker-compose.yml nem Docker na máquina.
- [ ] Depois do merge do PR-01: abrir /dev/status com a API real e conferir o formato de /api/v1/saude (a página aceita os campos na raiz ou dentro de `data`). No PR-02 isso foi conferido só com MSW e com o proxy respondendo 502 sem a API.
- [ ] PR-03: conferir no navegador o AppShell (navegação fixa embaixo, coluna lateral a partir de 1024 px e o link "Pular para o conteúdo"). No PR-02 o layout foi conferido só por testes de componente, sem abrir o navegador.
- [ ] Ao juntar o PR-01 e o PR-02 na main: os dois acrescentam ADRs no fim de docs/DECISOES.md e linhas em docs/BOAS-PRATICAS.md e docs/ARQUITETURA.md. Quem fizer o segundo merge renumera os ADRs (o PR-02 usou ADR-016 e ADR-017) e junta as linhas.
- [ ] `npm audit` do frontend acusa 6 vulnerabilidades moderadas (minimatch, pela cadeia do eslint 10, só desenvolvimento). Não barra o CI (nível high); rever quando o eslint publicar a correção (ADR-016).

## Ideias para depois
- (vazio)
