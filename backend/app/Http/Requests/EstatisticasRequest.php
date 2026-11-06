<?php

namespace App\Http\Requests;

use App\Enums\PeriodoEstatistica;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EstatisticasRequest extends FormRequest
{
    /**
     * Qualquer usuário logado vê as próprias estatísticas; não há recurso de terceiro.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'periodo' => ['required', 'string', Rule::in(PeriodoEstatistica::valores())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $mensagem = 'Informe um período válido: semana, mes, 3meses ou ano.';

        return [
            'periodo.required' => $mensagem,
            'periodo.string' => $mensagem,
            'periodo.in' => $mensagem,
        ];
    }

    public function periodo(): PeriodoEstatistica
    {
        return PeriodoEstatistica::from($this->string('periodo')->toString());
    }
}
