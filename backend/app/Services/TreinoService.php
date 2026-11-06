<?php

namespace App\Services;

use App\Enums\Etapa;
use App\Models\Treino;
use App\Models\TreinoItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TreinoService
{
    /**
     * Tempo estimado de uma repetição, usado quando o item não tem duração.
     * A fórmula não está nos docs: registrada em docs/MODELO-DE-DADOS.md e ESTADO.md.
     */
    public const int SEGUNDOS_POR_REPETICAO = 3;

    /**
     * Grava o treino e os itens numa única transação: qualquer falha desfaz tudo.
     * autor_id vem sempre do usuário autenticado e a duração é calculada aqui.
     *
     * @param  array{nome: string, descricao?: string|null, nivel: string, visibilidade: string, itens: list<array<string, mixed>>}  $dados
     */
    public function criar(User $autor, array $dados): Treino
    {
        $itens = $this->ordenarItens($dados['itens']);

        $treino = DB::transaction(function () use ($autor, $dados, $itens): Treino {
            $treino = $autor->treinos()->create([
                'nome' => $dados['nome'],
                'descricao' => $dados['descricao'] ?? null,
                'nivel' => $dados['nivel'],
                'visibilidade' => $dados['visibilidade'],
                'duracao_estimada_minutos' => $this->estimarDuracaoMinutos($itens),
            ]);

            foreach ($itens as $item) {
                $treino->itens()->create([
                    'exercicio_id' => $item['exercicio_id'],
                    'etapa' => $item['etapa'],
                    'ordem' => $item['ordem'],
                    'series' => $item['series'],
                    'repeticoes' => $item['repeticoes'] ?? null,
                    'duracao_segundos' => $item['duracao_segundos'] ?? null,
                    'descanso_segundos' => $item['descanso_segundos'],
                ]);
            }

            return $treino;
        });

        return $this->carregarParaResposta($treino);
    }

    /**
     * Soma, por item, series × (duração ou repetições × SEGUNDOS_POR_REPETICAO)
     * mais series × descanso, e arredonda o total para cima em minutos (mínimo 1).
     * Quando repetições e duração vêm juntas, vale a duração.
     *
     * @param  iterable<array<string, mixed>>  $itens
     */
    public function estimarDuracaoMinutos(iterable $itens): int
    {
        $segundos = 0;

        foreach ($itens as $item) {
            $series = (int) $item['series'];
            $duracao = $item['duracao_segundos'] ?? null;
            $trabalho = $duracao !== null
                ? (int) $duracao
                : (int) ($item['repeticoes'] ?? 0) * self::SEGUNDOS_POR_REPETICAO;

            $segundos += $series * ($trabalho + (int) ($item['descanso_segundos'] ?? 0));
        }

        return max(1, (int) ceil($segundos / 60));
    }

    /**
     * Treino com autor, itens e exercícios (inclusive os excluídos da biblioteca, RN-07)
     * carregados de uma vez, na ordem das etapas e da posição.
     */
    public function carregarParaResposta(Treino $treino): Treino
    {
        $treino->load(['autor', 'itens.exercicio']);

        $treino->setRelation('itens', $treino->itens->sortBy(fn (TreinoItem $item): int => $this->posicao($item->etapa, $item->ordem))->values());

        return $treino;
    }

    /**
     * @param  list<array<string, mixed>>  $itens
     * @return list<array<string, mixed>>
     */
    private function ordenarItens(array $itens): array
    {
        usort($itens, fn (array $a, array $b): int => $this->posicao(Etapa::from($a['etapa']), (int) $a['ordem'])
            <=> $this->posicao(Etapa::from($b['etapa']), (int) $b['ordem']));

        return $itens;
    }

    /**
     * Chave de ordenação: etapa na sequência do enum e, dentro dela, a ordem (smallint).
     */
    private function posicao(Etapa $etapa, int $ordem): int
    {
        $indice = (int) array_search($etapa, Etapa::cases(), true);

        return $indice * 100000 + $ordem;
    }
}
