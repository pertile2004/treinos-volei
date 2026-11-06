<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListarExerciciosRequest;
use App\Http\Resources\ExercicioResource;
use App\Http\Resources\ExercicioResumoResource;
use App\Models\Exercicio;
use App\Services\ExercicioService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ExercicioController extends Controller
{
    public function __construct(private readonly ExercicioService $exercicios) {}

    /**
     * Biblioteca de exercícios: filtros por fundamento e nível, busca e paginação.
     */
    public function index(ListarExerciciosRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Exercicio::class);

        return ExercicioResumoResource::collection($this->exercicios->listar(
            $request->fundamento(),
            $request->nivel(),
            $request->busca(),
            $request->porPagina(),
        ));
    }

    /**
     * Detalhe de um exercício da biblioteca.
     */
    public function show(int $exercicio): ExercicioResource
    {
        $encontrado = $this->exercicios->obter($exercicio);

        Gate::authorize('view', $encontrado);

        return new ExercicioResource($encontrado);
    }
}
