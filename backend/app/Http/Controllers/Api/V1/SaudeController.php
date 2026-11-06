<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SaudeResource;
use App\Services\SaudeService;

class SaudeController extends Controller
{
    /**
     * Saúde da API e do banco de dados.
     *
     * Responde 503 quando o banco está inacessível.
     */
    public function __invoke(SaudeService $saude): SaudeResource
    {
        return new SaudeResource($saude->verificar());
    }
}
