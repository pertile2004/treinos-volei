# Design

Fonte: Figma "Protótipo Sistema Treino de Vôlei" — https://www.figma.com/design/QNfH0gnbjWSJKzW2VSsKZ0/Prot%C3%B3tipo-Sistema-Treino-de-V%C3%B4lei?node-id=0-1
Telas exportadas: docs/design/telas/ · Saídas do Figma MCP: docs/design/figma/

## Uso do Figma MCP
Contas Starter ou com assento View/Collab têm só 6 chamadas por mês. O orçamento do projeto é de no máximo 5 chamadas, todas no PR-03, com os resultados salvos em docs/design/figma/. Nenhum outro PR chama o Figma.
No PR-03 nenhuma chamada foi feita e não havia telas exportadas (ADR-022): o orçamento continua intacto e docs/design/figma/ e docs/design/telas/ seguem vazios.

## Tokens (finais do PR-03 — sem conferência com o Figma)
Ficam em `frontend/src/estilos/tokens.css`, dentro do `@theme` do Tailwind 4. O PR-03 não teve acesso ao Figma nem às telas exportadas: os valores abaixo são os deste documento, e a comparação lado a lado continua pendente (ver docs/ESTADO.md > Pendências).

- Cores (token → classe):
  - fundo #0E0E0E → `bg-fundo`
  - superfície #1A1A1A → `bg-superficie`
  - superfície elevada #232323 → `bg-superficie-elevada`
  - borda #2C2C2C → `border-borda` (só divisória decorativa e borda de cartão)
  - borda de controle #757575 → `border-borda-controle` (contorno de campo, chip, stepper, botão secundário e etiqueta) — novo no PR-03
  - primária (verde-limão) #D4FF00 → `bg-primaria`, `text-primaria`
  - texto sobre a primária #0E0E0E → `text-sobre-primaria` (também é o texto do botão de perigo)
  - texto #FFFFFF → `text-texto`
  - texto secundário #A3A3A3 → `text-texto-secundario`
  - perigo #FF5A5F → `bg-perigo`, `text-perigo`, `border-perigo`
  - Nenhuma outra cor existe (`--color-*: initial`).
- Raios: cartão 16 px (`rounded-cartao`) · botão e campo 12 px (`rounded-botao`) · chip e etiqueta em pílula (`rounded-full`).
- Fonte: pilha do sistema (`ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif`); a fonte do Figma não foi confirmada e nenhum arquivo de fonte é carregado.
- Tamanhos de texto: 12 (`text-xs`), 14 (`text-sm`), 16 (`text-base`), 20 (`text-xl`), 24 (`text-2xl`), 32 (`text-destaque`) e cronômetro de 56 a 64 px (`text-cronometro`, `clamp(3.5rem, 15vw, 4rem)`).
- Espaçamentos: escala padrão do Tailwind, em múltiplos de 4 px (`p-1` = 4 px, `p-4` = 16 px). Alvos: `min-h-11` = 44 px (botões principais, campos, mostrar senha) e `min-h-8` = 32 px (botão pequeno e chip).
- Foco: contorno de 2 px com afastamento de 2 px, na cor primária; sobre fundo primária ou perigo, na cor texto.
- Movimento: com `prefers-reduced-motion: reduce`, transições e animações são zeradas (`global.css`).

## Contraste (WCAG 2.2 AA)
Razões calculadas pela fórmula de luminância relativa do WCAG a partir dos hex acima, truncadas em duas casas. Conferência no navegador (Chrome, axe-core 4.14.0, catálogo /dev/componentes em 360 px e 1440 px): nenhuma violação, e os 154 elementos de texto avaliados pela regra de contraste passaram. Não foram conferidas com o Figma.

Texto (mínimo 4,5:1):

| Texto / fundo | Razão | Onde aparece | AA |
|---|---|---|---|
| texto / fundo | 19,30 | títulos, rótulo de campo | ok |
| texto / superfície | 17,40 | texto do campo, cartão, chip | ok |
| texto / superfície elevada | 15,71 | botão secundário, cartão elevado, etiqueta | ok |
| texto secundário / fundo | 7,65 | ajuda, "(obrigatório)" | ok |
| texto secundário / superfície | 6,89 | placeholder, texto de apoio em cartão | ok |
| texto secundário / superfície elevada | 6,23 | etiqueta neutra, texto de apoio em cartão elevado | ok |
| perigo / fundo | 6,32 | mensagem de erro | ok |
| perigo / superfície | 5,70 | mensagem de erro em cartão | ok |
| perigo / superfície elevada | 5,14 | mensagem de erro em cartão elevado | ok |
| primária / fundo | 16,64 | botão fantasma | ok |
| primária / superfície | 15,00 | botão fantasma em hover ou sobre cartão | ok |
| primária / superfície elevada | 13,54 | botão fantasma sobre cartão elevado | ok |
| sobre a primária / primária | 16,64 | botão primário, chip selecionado | ok |
| sobre a primária / perigo | 6,32 | botão de perigo | ok |
| texto / perigo | 3,05 | **não usar** (por isso o botão de perigo tem texto escuro) | reprova |

Contorno de controle e foco (mínimo 3:1 — critério 1.4.11):

| Par | Razão | Onde aparece | Situação |
|---|---|---|---|
| borda de controle / fundo | 4,18 | campo, chip, botão secundário sobre a página | ok |
| borda de controle / superfície | 3,77 | contorno do campo contra o próprio preenchimento; controles dentro de cartão | ok |
| borda de controle / superfície elevada | 3,41 | botão secundário, etiqueta, controles em cartão elevado | ok |
| perigo / fundo | 6,32 | contorno do campo com erro | ok |
| primária / fundo | 16,64 | contorno de foco; chip selecionado | ok |
| texto / fundo | 19,30 | contorno de foco dos botões primário e de perigo e do chip selecionado | ok |
| borda / fundo | 1,38 | borda de cartão e divisórias | só decorativa |
| borda / superfície | 1,24 | borda do cartão plano | só decorativa |
| borda / superfície elevada | 1,12 | borda do cartão elevado | só decorativa |

- A `borda` (#2C2C2C) não chega a 3:1 em nenhum fundo: por isso entrou a `borda de controle` (#757575), que passa nos três. Nenhum controle usa a `borda` como único indicador.
- O trilho da BarraDeProgresso usa a `borda` (decorativa): o valor é dado pelo preenchimento em `primaria` e pelo texto. Com `mostrarTexto={false}` e valor baixo quase nada aparece; nas telas, mantenha o texto visível ou um rótulo ao lado.
- Estado desabilitado usa `opacity-50`; componente inativo é exceção do critério 1.4.3 e o contraste não foi calculado.
- Regra para as telas: todo texto pequeno precisa de 4,5:1 sobre o fundo em que está; use só os pares "ok" da tabela.

## Telas do Figma → rotas
- login → /entrar (sem os botões Google e Apple)
- registro → /cadastro
- home-dashboard → /
- library-training-creation → /biblioteca e /treinos/novo
- active-training-mode → /treinar/:treinoId
- evolution-stats-history → /evolucao e /historico

Telas sem Figma, que seguem o mesmo estilo:
- detalhe do exercício e detalhe do treino
- treino (escolher ou retomar) e registro rápido
- perfil e agenda
- esqueci a senha e redefinir senha
- termos e privacidade
- treinador e admin

## Correções de texto (o Figma mistura pt-PT e espanhol)
- Palavra-passe → Senha
- Introduza a sua palavra-passe → Digite sua senha
- Esqueceu a palavra-passe? → Esqueceu a senha?
- Ainda não tem conta? Registe-se → Ainda não tem conta? Cadastre-se
- Crie a sua conta → Crie sua conta
- O seu nome → Seu nome
- Ao clicar em criar conta, aceita os nossos Termos… → Ao criar a conta, você aceita os Termos de Uso e a Política de Privacidade
- Volumen de Treino (m) → Volume de treino (min)
- Hoje, 15 de Outubro → Hoje, 15 de outubro
- Treinos Sugeridos por IA → Treinos do seu treinador (ou Treinos em destaque)

## Componentes (PR-03)
Botao, CampoTexto, Cartao, ChipFiltro, Abas, Stepper, BarraDeProgresso, Cronometro, Cabecalho, Avatar, Etiqueta, NavInferior, BarraLateral, ModalDeConfirmacao.
