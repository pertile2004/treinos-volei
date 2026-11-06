<?php

namespace Database\Factories;

use App\Models\Agendamento;
use App\Models\Sessao;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Agendamento>
 */
class AgendamentoFactory extends Factory
{
    /**
     * Agendamento pendente para hoje, às 18:00, de um treino do próprio usuário.
     * "Hoje" é o dia em America/Sao_Paulo (RN-01), não o dia em UTC.
     * Para escolher os pais: ->for($usuario, 'usuario') e ->for($treino).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'usuario_id' => User::factory(),
            'treino_id' => fn (array $atributos) => Treino::factory()->state(['autor_id' => $atributos['usuario_id']]),
            'data' => now('America/Sao_Paulo')->toDateString(),
            'hora' => '18:00',
            'sessao_id' => null,
        ];
    }

    public function semHora(): static
    {
        return $this->state(['hora' => null]);
    }

    /**
     * Agendamento concluído: ligado a uma sessão do mesmo usuário e do mesmo treino.
     */
    public function concluido(): static
    {
        return $this->state([
            'sessao_id' => fn (array $atributos) => Sessao::factory()->state([
                'usuario_id' => $atributos['usuario_id'],
                'treino_id' => $atributos['treino_id'],
            ]),
        ]);
    }
}
