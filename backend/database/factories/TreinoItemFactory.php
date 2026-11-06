<?php

namespace Database\Factories;

use App\Enums\Etapa;
use App\Models\Exercicio;
use App\Models\Treino;
use App\Models\TreinoItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TreinoItem>
 */
class TreinoItemFactory extends Factory
{
    /**
     * Última ordem que esta factory entregou para cada "treino|etapa",
     * para um lote (count) não repetir a posição antes de ser gravado.
     *
     * @var array<string, int>
     */
    private array $ordensEntregues = [];

    /**
     * Item por repetições, na etapa técnica, na próxima posição livre do treino.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'treino_id' => Treino::factory(),
            'exercicio_id' => Exercicio::factory(),
            'etapa' => Etapa::Tecnica,
            'ordem' => fn (array $atributos): int => $this->proximaOrdem($atributos['treino_id'], $atributos['etapa']),
            'series' => fake()->numberBetween(1, 5),
            'repeticoes' => fake()->numberBetween(5, 20),
            'duracao_segundos' => null,
            'descanso_segundos' => 45,
        ];
    }

    /**
     * Item medido por tempo em vez de repetições.
     */
    public function porDuracao(int $segundos = 30): static
    {
        return $this->state([
            'repeticoes' => null,
            'duracao_segundos' => $segundos,
        ]);
    }

    /**
     * Respeita o único (treino_id, etapa, ordem): continua de onde o banco
     * parou e do que esta factory já entregou no mesmo lote.
     */
    private function proximaOrdem(?int $treinoId, Etapa|string $etapa): int
    {
        $etapa = $etapa instanceof Etapa ? $etapa->value : $etapa;
        $chave = $treinoId.'|'.$etapa;

        $ultimaNoBanco = $treinoId === null ? 0 : (int) TreinoItem::query()
            ->where('treino_id', $treinoId)
            ->where('etapa', $etapa)
            ->max('ordem');

        return $this->ordensEntregues[$chave] = max($ultimaNoBanco, $this->ordensEntregues[$chave] ?? 0) + 1;
    }
}
