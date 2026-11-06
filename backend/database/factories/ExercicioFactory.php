<?php

namespace Database\Factories;

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Models\Exercicio;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Exercicio>
 */
class ExercicioFactory extends Factory
{
    /**
     * Exercício por repetições, sem vídeo e sem criador.
     * Para um excluído da biblioteca, use o estado trashed() do Laravel.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => Str::ucfirst(fake()->unique()->words(3, true)),
            'descricao' => fake()->paragraph(),
            'foco' => fake()->sentence(4),
            'fundamento' => fake()->randomElement(Fundamento::cases()),
            'nivel' => fake()->randomElement(Nivel::cases()),
            'series_padrao' => fake()->numberBetween(2, 5),
            'repeticoes_padrao' => fake()->numberBetween(5, 20),
            'duracao_segundos_padrao' => null,
            'descanso_segundos' => 45,
            'video_url' => null,
            'imagem_url' => null,
            'criado_por' => null,
        ];
    }

    public function doFundamento(Fundamento $fundamento): static
    {
        return $this->state(['fundamento' => $fundamento]);
    }

    public function doNivel(Nivel $nivel): static
    {
        return $this->state(['nivel' => $nivel]);
    }

    /**
     * Exercício medido por tempo em vez de repetições.
     */
    public function porDuracao(int $segundos = 30): static
    {
        return $this->state([
            'repeticoes_padrao' => null,
            'duracao_segundos_padrao' => $segundos,
        ]);
    }

    /**
     * A URL vem sempre de quem chama: a factory nunca inventa link de vídeo.
     */
    public function comVideo(string $url): static
    {
        return $this->state(['video_url' => $url]);
    }
}
