<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property array<string, list<array{valor: string, rotulo: string}>> $resource
 */
class ReferenciasResource extends JsonResource
{
    /**
     * @return array<string, list<array{valor: string, rotulo: string}>>
     */
    public function toArray(Request $request): array
    {
        return [
            'papeis' => $this->resource['papeis'],
            'fundamentos' => $this->resource['fundamentos'],
            'niveis' => $this->resource['niveis'],
            'etapas' => $this->resource['etapas'],
            'visibilidades' => $this->resource['visibilidades'],
            'origens_sessao' => $this->resource['origens_sessao'],
        ];
    }
}
