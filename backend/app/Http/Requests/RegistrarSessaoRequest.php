<?php

namespace App\Http\Requests;

use App\Enums\OrigemSessao;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /sessoes. As datas chegam em ISO 8601 com fuso (com ou sem milissegundos)
 * e são gravadas em UTC (RN-01). usuario_id e fundamento nunca vêm do cliente.
 */
class RegistrarSessaoRequest extends FormRequest
{
    /**
     * Formatos de data aceitos: 2026-11-06T21:00:00Z, 2026-11-06T18:00:00-03:00
     * e os mesmos com milissegundos (toISOString() do JavaScript) ou microssegundos.
     * O validador exige ida e volta exata: "Z" só casa com `p`, e "+00:00" só com `P`.
     */
    private const string FORMATOS_DE_DATA = 'Y-m-d\TH:i:sp,Y-m-d\TH:i:sP,Y-m-d\TH:i:s.vp,Y-m-d\TH:i:s.vP,Y-m-d\TH:i:s.up,Y-m-d\TH:i:s.uP';

    /**
     * Tolerância para o relógio do aparelho adiantado.
     */
    private const int TOLERANCIA_FUTURO_MINUTOS = 5;

    /**
     * A autenticação é do middleware; a visibilidade do treino é do Service (404).
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
            'id_cliente' => ['required', 'uuid'],
            'origem' => ['required', Rule::enum(OrigemSessao::class)->only([OrigemSessao::Cronometro])],
            'treino_id' => ['required_if:origem,'.OrigemSessao::Cronometro->value, 'integer'],
            'iniciada_em' => ['required', 'date_format:'.self::FORMATOS_DE_DATA],
            'finalizada_em' => [
                'required',
                'date_format:'.self::FORMATOS_DE_DATA,
                'after_or_equal:iniciada_em',
                'before_or_equal:'.now()->addMinutes(self::TOLERANCIA_FUTURO_MINUTOS)->toIso8601String(),
            ],
            'duracao_segundos' => ['required', 'integer', 'min:0', 'max:86400'],
            'observacao' => ['nullable', 'string', 'max:1000'],
            'series' => ['required', 'array', 'min:1', 'max:200'],
            'series.*.exercicio_id' => ['required', 'integer'],
            'series.*.numero' => ['required', 'integer', 'min:1', 'max:999'],
            'series.*.repeticoes' => ['nullable', 'integer', 'min:0', 'max:999'],
            'series.*.acertos' => ['nullable', 'integer', 'min:0', 'max:999'],
            'series.*.erros' => ['nullable', 'integer', 'min:0', 'max:999'],
            'series.*.duracao_segundos' => ['nullable', 'integer', 'min:0', 'max:86400'],
        ];
    }

    /**
     * O par (exercicio_id, numero) não pode se repetir dentro da sessão.
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $series = $this->input('series');

                if (! is_array($series)) {
                    return;
                }

                $vistos = [];

                foreach ($series as $indice => $serie) {
                    if (! is_array($serie) || ! isset($serie['exercicio_id'], $serie['numero'])) {
                        continue;
                    }

                    $chave = $serie['exercicio_id'].'#'.$serie['numero'];

                    if (isset($vistos[$chave])) {
                        $validator->errors()->add(
                            "series.{$indice}.numero",
                            'A série de número '.$serie['numero'].' já foi informada para este exercício.',
                        );
                    }

                    $vistos[$chave] = true;
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
            'iniciada_em.date_format' => 'O campo iniciada_em deve ser uma data ISO 8601 com fuso horário.',
            'finalizada_em.date_format' => 'O campo finalizada_em deve ser uma data ISO 8601 com fuso horário.',
            'finalizada_em.before_or_equal' => 'O campo finalizada_em não pode estar no futuro.',
            'origem.Illuminate\Validation\Rules\Enum' => 'Neste momento a origem aceita só o valor cronometro.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'id_cliente' => 'id_cliente',
            'treino_id' => 'treino_id',
            'iniciada_em' => 'iniciada_em',
            'finalizada_em' => 'finalizada_em',
            'duracao_segundos' => 'duracao_segundos',
            'series.*.exercicio_id' => 'exercicio_id da série',
            'series.*.numero' => 'numero da série',
            'series.*.repeticoes' => 'repeticoes da série',
            'series.*.acertos' => 'acertos da série',
            'series.*.erros' => 'erros da série',
            'series.*.duracao_segundos' => 'duracao_segundos da série',
        ];
    }
}
