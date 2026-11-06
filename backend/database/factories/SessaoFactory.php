<?php

namespace Database\Factories;

use App\Enums\OrigemSessao;
use App\Models\Sessao;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sessao>
 */
class SessaoFactory extends Factory
{
    /**
     * Sessão de cronômetro que acabou agora, de um treino do próprio usuário.
     * Para escolher os pais: ->for($usuario, 'usuario') e ->for($treino).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'usuario_id' => User::factory(),
            'treino_id' => fn (array $atributos) => Treino::factory()->state(['autor_id' => $atributos['usuario_id']]),
            'origem' => OrigemSessao::Cronometro,
            'duracao_segundos' => fake()->numberBetween(600, 3600),
            'iniciada_em' => fn (array $atributos) => now()->subSeconds($atributos['duracao_segundos']),
            'finalizada_em' => fn (array $atributos) => Date::parse($atributos['iniciada_em'])->addSeconds($atributos['duracao_segundos']),
            'observacao' => null,
            'id_cliente' => fn () => (string) Str::uuid(),
        ];
    }

    /**
     * Registro rápido "Já treinei": sem treino.
     */
    public function registroRapido(): static
    {
        return $this->state([
            'origem' => OrigemSessao::RegistroRapido,
            'treino_id' => null,
        ]);
    }

    public function semIdCliente(): static
    {
        return $this->state(['id_cliente' => null]);
    }
}
