<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CriarTreinoRequest;
use App\Http\Resources\TreinoResource;
use App\Models\User;
use App\Services\TreinoService;
use Illuminate\Http\JsonResponse;

class TreinoController extends Controller
{
    public function __construct(private readonly TreinoService $treinos) {}

    /**
     * Cria um treino com os itens em etapas e responde 201.
     */
    public function store(CriarTreinoRequest $request): JsonResponse
    {
        /** @var User $autor */
        $autor = $request->user();

        /** @var array{nome: string, descricao?: string|null, nivel: string, visibilidade: string, itens: list<array<string, mixed>>} $dados */
        $dados = $request->validated();

        $treino = $this->treinos->criar($autor, $dados);

        return (new TreinoResource($treino))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
