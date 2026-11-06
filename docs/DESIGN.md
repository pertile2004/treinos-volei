# Design

Fonte: Figma "Protótipo Sistema Treino de Vôlei" — https://www.figma.com/design/QNfH0gnbjWSJKzW2VSsKZ0/Prot%C3%B3tipo-Sistema-Treino-de-V%C3%B4lei?node-id=0-1
Telas exportadas: docs/design/telas/ · Saídas do Figma MCP: docs/design/figma/

## Uso do Figma MCP
Contas Starter ou com assento View/Collab têm só 6 chamadas por mês. O orçamento do projeto é de no máximo 5 chamadas, todas no PR-03, com os resultados salvos em docs/design/figma/. Nenhum outro PR chama o Figma.

## Tokens (PROVISÓRIOS — o PR-03 confirma no Figma)
- Cores:
  - fundo #0E0E0E
  - superfície #1A1A1A
  - superfície elevada #232323
  - borda #2C2C2C
  - primária (verde-limão) #D4FF00
  - texto sobre a primária #0E0E0E
  - texto #FFFFFF
  - texto secundário #A3A3A3
  - perigo #FF5A5F
- Raios: cartão 16 px · botão 12 px · chip em pílula.
- Tipografia: a sans-serif do Figma (confirmar); escala 12/14/16/20/24/32; cronômetro 56–64.
- Contraste: todo texto pequeno precisa de 4,5:1 sobre o fundo em que está. Confira os cinzas do Figma e anote as razões aqui.

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
