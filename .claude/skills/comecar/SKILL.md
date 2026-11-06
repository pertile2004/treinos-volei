---
name: comecar
description: Inicia o próximo PR do roteiro para o integrante desta máquina - sincroniza a main, escolhe o card, cria a branch, planeja, escreve os testes primeiro, implementa, verifica e revisa.
disable-model-invocation: true
---
# /comecar — iniciar um PR
Siga na ordem e mostre ao humano um resumo curto a cada etapa.
1. Sincronizar: `git fetch origin`. Se houver alterações locais não commitadas, PARE e pergunte o que fazer (nunca descarte nada). Depois `git switch main` e `git pull --ff-only`.
2. Situar-se: leia docs/ESTADO.md, docs/ROADMAP.md e docs/INTEGRANTES.md. Identifique o integrante pela identidade do Git mostrada no início da sessão. Se INTEGRANTES.md estiver PENDENTE, pergunte qual integrante (1 a 6) ele é.
3. Revisão cruzada do PR anterior (5 min): resuma para o humano o que o último PR mergeado fez (`gh pr list --state merged --limit 1`, `gh pr diff <número> --name-only`). Se notar um bug, registre em ESTADO.md > Pendências; não corrija agora.
4. Escolher o card: o próximo com status ☐, responsável igual a este integrante e dependências ✅. Se não houver, diga de quem é a vez e pare. Se o card tiver pré-requisito humano não cumprido, pare e avise. Se o humano pedir outro card, confirme e registre a troca no ROADMAP.
5. Branch: `git switch -c feature/pr-XX-descricao-curta`.
6. Planejar sem editar código: leia o card inteiro, as seções relacionadas da ESPECIFICACAO, ARQUITETURA, MODELO-DE-DADOS, API e DESIGN, e os arquivos que vai tocar (use o subagente Explore se precisar ler muitos). Escreva docs/planos/PR-XX.md com objetivo, arquivos a criar ou alterar, passos, testes de aceite, riscos e o que está fora do escopo. Atualize ESTADO.md (seção "Em andamento") e marque ◐ no ROADMAP. Commit `docs(pr-XX): plano`, `git push -u origin <branch>` e `gh pr create --draft --title "PR-XX: <título>" --body-file .github/pull_request_template.md`.
7. Testes de aceite primeiro: escreva os testes que provam cada critério de aceite do card, rode e confirme que falham pelo motivo certo. Commit `test(...)` separado.
8. Implementar em passos pequenos, rodando os testes do trecho a cada passo, com commits frequentes. Não altere os testes de aceite já commitados.
9. Verificar: `npm run verificar` até ficar verde. Em tela nova, abra no navegador (Claude in Chrome, se disponível), compare com docs/design/telas/ e corrija as diferenças.
10. Revisão independente: use o subagente `revisor` e também o `revisor-seguranca` se o PR mexe em autenticação, autorização, entrada de dados, rotas ou consultas. Corrija só o que afeta requisito, correção, segurança ou integridade dos testes.
11. Rode /encerrar.
