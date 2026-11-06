<?php

namespace App\Http\Requests;

use App\Enums\Etapa;
use App\Enums\Nivel;
use App\Enums\Papel;
use App\Enums\Visibilidade;
use App\Models\Treino;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Corpo de POST /treinos. autor_id e duracao_estimada_minutos nunca vêm do cliente.
 */
class CriarTreinoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Treino::class) ?? false;
    }

    /**
     * @return array<string, list<ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:120'],
            'descricao' => ['nullable', 'string', 'max:2000'],
            'nivel' => ['required', Rule::enum(Nivel::class)],
            'visibilidade' => ['required', Rule::in($this->visibilidadesPermitidas())],
            'itens' => ['required', 'array', 'min:1', 'max:30'],
            'itens.*.exercicio_id' => [
                'required',
                'integer',
                Rule::exists('exercicios', 'id')->whereNull('deleted_at'),
            ],
            'itens.*.etapa' => ['required', Rule::enum(Etapa::class)],
            'itens.*.ordem' => ['required', 'integer', 'min:1', 'max:32767'],
            'itens.*.series' => ['required', 'integer', 'between:1,10'],
            'itens.*.repeticoes' => ['nullable', 'required_without:itens.*.duracao_segundos', 'integer', 'between:1,100'],
            'itens.*.duracao_segundos' => ['nullable', 'required_without:itens.*.repeticoes', 'integer', 'between:10,3600'],
            'itens.*.descanso_segundos' => ['required', 'integer', 'between:0,600'],
        ];
    }

    /**
     * O par (etapa, ordem) não pode se repetir: o banco tem um único e
     * responderia 500; aqui vira 422 no item repetido.
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $itens = $this->input('itens');

                if (! is_array($itens)) {
                    return;
                }

                $vistos = [];

                foreach ($itens as $indice => $item) {
                    if (! is_array($item) || ! is_scalar($item['etapa'] ?? null) || ! is_scalar($item['ordem'] ?? null)) {
                        continue;
                    }

                    $etapa = Etapa::tryFrom((string) $item['etapa']);
                    $ordem = $item['ordem'];

                    if ($etapa === null || filter_var($ordem, FILTER_VALIDATE_INT) === false) {
                        continue;
                    }

                    $chave = $etapa->value.'|'.(int) $ordem;

                    if (isset($vistos[$chave])) {
                        $validator->errors()->add(
                            "itens.{$indice}.ordem",
                            sprintf('A ordem %d já está em uso na etapa %s.', (int) $ordem, $etapa->rotulo()),
                        );

                        continue;
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
            'visibilidade.in' => 'A visibilidade escolhida não está disponível para o seu papel.',
            'itens.*.exercicio_id.exists' => 'O exercício escolhido não existe ou foi removido da biblioteca.',
            'itens.*.repeticoes.required_without' => 'Informe repetições ou duração em cada exercício.',
            'itens.*.duracao_segundos.required_without' => 'Informe repetições ou duração em cada exercício.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'descricao' => 'descrição',
            'nivel' => 'nível',
            'itens.*.exercicio_id' => 'exercício',
            'itens.*.etapa' => 'etapa',
            'itens.*.ordem' => 'ordem',
            'itens.*.series' => 'séries',
            'itens.*.repeticoes' => 'repetições',
            'itens.*.duracao_segundos' => 'duração',
            'itens.*.descanso_segundos' => 'descanso',
        ];
    }

    /**
     * RN-06: jogador só privado; treinador privado ou atletas; admin também publico.
     *
     * @return list<string>
     */
    private function visibilidadesPermitidas(): array
    {
        $permitidas = match ($this->user()?->papel) {
            Papel::Admin => [Visibilidade::Privado, Visibilidade::Atletas, Visibilidade::Publico],
            Papel::Treinador => [Visibilidade::Privado, Visibilidade::Atletas],
            default => [Visibilidade::Privado],
        };

        return array_map(fn (Visibilidade $visibilidade): string => $visibilidade->value, $permitidas);
    }
}
