<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReferenciasResource;
use App\Services\ReferenciasService;

class ReferenciasController extends Controller
{
    /**
     * Valores e rótulos dos enums do domínio.
     */
    public function __invoke(ReferenciasService $referencias): ReferenciasResource
    {
        return new ReferenciasResource($referencias->listar());
    }
}
