<?php

namespace Database\Factories;

use App\Enums\Etapa;
use App\Enums\Nivel;
use App\Enums\Visibilidade;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Treino>
 */
class TreinoFactory extends Factory
{
    /**
     * Treino privado, sem itens, de um autor novo.
     * Para escolher o autor: Treino::factory()->for($usuario, 'autor').
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => Str::ucfirst(fake()->unique()->words(3, true)),
            'descricao' => fake()->sentence(),
            'nivel' => fake()->randomElement(Nivel::cases()),
            'visibilidade' => Visibilidade::Privado,
            'autor_id' => User::factory(),
            'duracao_estimada_minutos' => fake()->numberBetween(10, 90),
        ];
    }

    /**
     * Visível para os atletas do autor. A RN-06 (quem pode usar cada
     * visibilidade) não é imposta aqui: o teste escolhe o papel do autor.
     */
    public function paraAtletas(): static
    {
        return $this->state(['visibilidade' => Visibilidade::Atletas]);
    }

    /**
     * Treino em destaque. Vale a mesma observação de paraAtletas().
     */
    public function publico(): static
    {
        return $this->state(['visibilidade' => Visibilidade::Publico]);
    }

    /**
     * Acrescenta itens numerados em sequência dentro de uma etapa.
     */
    public function comItens(int $quantidade = 3, Etapa $etapa = Etapa::Tecnica): static
    {
        return $this->has(
            TreinoItemFactory::new()->count($quantidade)->state(['etapa' => $etapa]),
            'itens',
        );
    }
}
