<?php

namespace App\Http\Requests;

use App\Models\Agendamento;
use App\Services\AgendamentoService;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class CriarAgendamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Agendamento::class) ?? false;
    }

    /**
     * @return array<string, list<string|Closure>>
     */
    public function rules(): array
    {
        $servico = $this->container->make(AgendamentoService::class);
        $usuario = $this->user();

        return [
            'treino_id' => [
                'required',
                'integer',
                // RN-06: treino inexistente, excluído ou invisível respondem igual, sem revelar se existe.
                function (string $atributo, mixed $valor, Closure $falhar) use ($servico, $usuario): void {
                    if ($usuario === null || ! $servico->treinoDisponivel($usuario, (int) $valor)) {
                        $falhar('Escolha um treino.');
                    }
                },
            ],
            'data' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$servico->hoje()],
            'hora' => ['nullable', 'date_format:H:i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'treino_id.required' => 'Escolha um treino.',
            'treino_id.integer' => 'Escolha um treino.',
            'data.required' => 'Informe a data.',
            'data.after_or_equal' => 'A data não pode ser anterior a hoje.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'treino_id' => 'treino',
            'data' => 'data',
            'hora' => 'hora',
        ];
    }
}
