<?php

namespace App\Services;

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Models\Exercicio;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Leitura da biblioteca de exercícios (RF-05). Excluídos logicamente ficam fora (RN-07).
 */
class ExercicioService
{
    public const int POR_PAGINA_PADRAO = 15;

    public const int POR_PAGINA_MAXIMO = 50;

    /**
     * Lista paginada com os filtros combinados por E, ordenada por nome e id.
     *
     * @return LengthAwarePaginator<int, Exercicio>
     */
    public function listar(
        ?Fundamento $fundamento = null,
        ?Nivel $nivel = null,
        ?string $busca = null,
        int $porPagina = self::POR_PAGINA_PADRAO,
    ): LengthAwarePaginator {
        return Exercicio::query()
            ->when($fundamento, fn (Builder $consulta, Fundamento $valor) => $consulta->where('fundamento', $valor->value))
            ->when($nivel, fn (Builder $consulta, Nivel $valor) => $consulta->where('nivel', $valor->value))
            ->when($busca !== null && $busca !== '', fn (Builder $consulta) => $this->filtrarPorNome($consulta, (string) $busca))
            ->orderBy('nome')
            ->orderBy('id')
            ->paginate(min(max($porPagina, 1), self::POR_PAGINA_MAXIMO))
            ->withQueryString();
    }

    /**
     * Exercício ativo pelo id; 404 quando não existe ou foi excluído logicamente.
     */
    public function obter(int $id): Exercicio
    {
        return Exercicio::query()->findOrFail($id);
    }

    /**
     * Busca no nome sem diferenciar maiúsculas nem acentos (extensão unaccent do Postgres).
     * Primeiro unaccent e depois lower: com collation "C", lower() não minusculiza letras acentuadas.
     * O termo entra sempre por binding, com os curingas do LIKE escapados.
     *
     * @param  Builder<Exercicio>  $consulta
     * @return Builder<Exercicio>
     */
    private function filtrarPorNome(Builder $consulta, string $busca): Builder
    {
        $padrao = '%'.$this->escaparCuringas($busca).'%';

        return $consulta->whereRaw('lower(unaccent(nome)) like lower(unaccent(?))', [$padrao]);
    }

    /**
     * No LIKE do Postgres, a barra invertida é o caractere de escape padrão.
     */
    private function escaparCuringas(string $termo): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $termo);
    }
}
