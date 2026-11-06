<?php

namespace App\Http\Requests;

use App\Models\Agendamento;
use App\Services\AgendamentoService;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class AtualizarAgendamentoRequest extends FormRequest
{
    /**
     * A Policy responde 404 quando o agendamento é de outro usuário.
     */
    public function authorize(): Response
    {
        $agendamento = $this->route('agendamento');

        return $agendamento instanceof Agendamento
            ? Gate::inspect('update', $agendamento)
            : Response::denyAsNotFound();
    }

    /**
     * treino_id e sessao_id não são alteráveis: só data e hora entram.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        $hoje = $this->container->make(AgendamentoService::class)->hoje();

        return [
            'data' => ['sometimes', 'required', 'date_format:Y-m-d', 'after_or_equal:'.$hoje],
            'hora' => ['sometimes', 'nullable', 'date_format:H:i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
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
            'data' => 'data',
            'hora' => 'hora',
        ];
    }
}
