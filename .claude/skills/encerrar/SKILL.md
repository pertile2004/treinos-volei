---
name: encerrar
description: Finaliza o PR atual - atualiza a documentação viva, verifica tudo, envia, espera o CI, faz o merge e prepara a vez do próximo integrante.
disable-model-invocation: true
---
# /encerrar — finalizar o PR
1. Documentação viva (obrigatória):
   - docs/ESTADO.md: reescreva a seção "Agora" (último PR concluído, o que entrou, como testar em até 3 passos, pendências conhecidas, próximo PR e responsável) e limpe "Em andamento". Mantenha o arquivo com até ~80 linhas.
   - docs/historico/PR-XX.md: o que foi feito, decisões, arquivos principais, como testar e o que o próximo precisa saber.
   - docs/ROADMAP.md: status ✅ e link do PR.
   - CHANGELOG.md: entrada em "Não lançado" (Adicionado, Alterado ou Corrigido).
   - Se mudou migration → MODELO-DE-DADOS.md; rota → API.md; dependência ou arquitetura → DECISOES.md; item do professor atendido → BOAS-PRATICAS.md com o caminho do arquivo.
2. `npm run verificar -- --pronto` e mostre o resumo da saída.
3. Commit `docs(pr-XX): estado e histórico`. Se a main andou, `git merge origin/main`, resolva conflitos de docs mantendo as duas contribuições e verifique de novo.
4. `git push`. Atualize o corpo do PR (o que foi feito, como testar, evidência da verificação, checklist da Definição de Pronto) com `gh pr edit` e rode `gh pr ready`.
5. `gh pr checks --watch`. Se falhar, leia `gh run view --log-failed`, corrija a causa (nunca desative um check) e repita.
6. Verde: `gh pr merge --merge --delete-branch`, `git switch main` e `git pull --ff-only`.
7. Mensagem final ao humano: link do PR, resumo em 3 linhas, jobs novos do CI que o dono do repositório precisa marcar como obrigatórios e "Próximo: PR-YY — Integrante N". Sugira /clear antes do próximo trabalho.
