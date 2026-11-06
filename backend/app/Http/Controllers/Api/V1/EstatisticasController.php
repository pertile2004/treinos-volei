<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstatisticasRequest;
use App\Http\Resources\EstatisticasResource;
use App\Models\User;
use App\Services\EstatisticasService;

class EstatisticasController extends Controller
{
    /**
     * Volume, percentual de acerto por fundamento e frequência do usuário logado.
     */
    public function __invoke(EstatisticasRequest $request, EstatisticasService $estatisticas): EstatisticasResource
    {
        $usuario = $request->user();
        abort_unless($usuario instanceof User, 401);

        return new EstatisticasResource($estatisticas->calcular($usuario, $request->periodo()));
    }
}
