<?php

namespace App\Http\Requests;

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Services\ExercicioService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filtros da biblioteca (GET /exercicios), todos opcionais e vindos da query string.
 */
class ListarExerciciosRequest extends FormRequest
{
    /**
     * A autorização fica na ExercicioPolicy, chamada pelo controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'fundamento' => ['nullable', Rule::enum(Fundamento::class)],
            'nivel' => ['nullable', Rule::enum(Nivel::class)],
            'busca' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:'.ExercicioService::POR_PAGINA_MAXIMO],
        ];
    }

    public function fundamento(): ?Fundamento
    {
        return $this->enum('fundamento', Fundamento::class);
    }

    public function nivel(): ?Nivel
    {
        return $this->enum('nivel', Nivel::class);
    }

    /**
     * Termo de busca sem os espaços das pontas; null quando vazio.
     */
    public function busca(): ?string
    {
        $busca = $this->validated('busca');

        if (! is_string($busca)) {
            return null;
        }

        $busca = trim($busca);

        return $busca === '' ? null : $busca;
    }

    public function porPagina(): int
    {
        $porPagina = $this->validated('por_pagina');

        return is_numeric($porPagina) ? (int) $porPagina : ExercicioService::POR_PAGINA_PADRAO;
    }
}
