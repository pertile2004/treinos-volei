<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegistrarSessaoRequest;
use App\Http\Resources\SessaoResource;
use App\Models\Sessao;
use App\Models\User;
use App\Services\SessaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SessaoController extends Controller
{
    public function __construct(private readonly SessaoService $sessoes) {}

    /**
     * Salva uma sessão de treino com as séries.
     *
     * Idempotente por id_cliente: 201 no primeiro envio e 200 no reenvio, com a mesma sessão.
     */
    public function store(RegistrarSessaoRequest $request): JsonResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $sessao = $this->sessoes->registrar($usuario, $request->validated());

        return (new SessaoResource($sessao))
            ->response()
            ->setStatusCode($sessao->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Mostra uma sessão do usuário logado.
     */
    public function show(Sessao $sessao): SessaoResource
    {
        Gate::authorize('view', $sessao);

        return new SessaoResource($this->sessoes->carregar($sessao));
    }
}
