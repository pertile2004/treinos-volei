<?php

namespace App\Http\Requests;

use App\Models\Agendamento;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class ListarAgendamentosRequest extends FormRequest
{
    /**
     * Maior intervalo aceito, em dias corridos contando os dois extremos
     * (um mês inteiro cabe; a listagem não é paginada).
     */
    public const int MAXIMO_DE_DIAS = 31;

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Agendamento::class) ?? false;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'de' => ['required', 'date_format:Y-m-d'],
            'ate' => ['required', 'date_format:Y-m-d', 'after_or_equal:de'],
        ];
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validador): void {
                if ($validador->errors()->isNotEmpty()) {
                    return;
                }

                $de = Carbon::createFromFormat('Y-m-d', $this->string('de')->value());
                $ate = Carbon::createFromFormat('Y-m-d', $this->string('ate')->value());

                if ($de->diffInDays($ate) + 1 > self::MAXIMO_DE_DIAS) {
                    $validador->errors()->add('ate', 'O intervalo não pode passar de '.self::MAXIMO_DE_DIAS.' dias.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'de.required' => 'Informe a data inicial.',
            'ate.required' => 'Informe a data final.',
            'ate.after_or_equal' => 'A data final não pode ser anterior à inicial.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'de' => 'de',
            'ate' => 'até',
        ];
    }
}
