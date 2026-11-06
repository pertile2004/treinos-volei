<?php

namespace Database\Factories;

use App\Enums\Fundamento;
use App\Models\Exercicio;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SessaoSerie>
 */
class SessaoSerieFactory extends Factory
{
    /**
     * Série número 1 de um exercício, com o fundamento copiado dele
     * (como o servidor faz ao registrar a sessão).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sessao_id' => Sessao::factory(),
            'exercicio_id' => Exercicio::factory(),
            'fundamento' => fn (array $atributos) => $atributos['exercicio_id'] === null
                ? fake()->randomElement(Fundamento::cases())
                : Exercicio::withTrashed()->findOrFail($atributos['exercicio_id'])->fundamento,
            'numero' => 1,
            'repeticoes' => 10,
            'acertos' => 7,
            'erros' => 3,
            'duracao_segundos' => fake()->numberBetween(30, 180),
        ];
    }

    /**
     * Série de registro rápido: só o fundamento, sem exercício.
     */
    public function semExercicio(?Fundamento $fundamento = null): static
    {
        $estado = ['exercicio_id' => null];

        if ($fundamento !== null) {
            $estado['fundamento'] = $fundamento;
        }

        return $this->state($estado);
    }
}
