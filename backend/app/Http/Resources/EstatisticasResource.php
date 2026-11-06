<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @phpstan-import-type Estatisticas from \App\Services\EstatisticasService
 *
 * @property Estatisticas $resource
 */
class EstatisticasResource extends JsonResource
{
    /**
     * @return Estatisticas
     */
    public function toArray(Request $request): array
    {
        return [
            'periodo' => $this->resource['periodo'],
            'fuso' => $this->resource['fuso'],
            'inicio' => $this->resource['inicio'],
            'fim' => $this->resource['fim'],
            'volume' => $this->resource['volume'],
            'desempenho' => $this->resource['desempenho'],
            'frequencia' => $this->resource['frequencia'],
        ];
    }

    /**
     * Percentual sempre sai como número decimal (70.0, 0.0); null continua null (RN-02).
     */
    public function jsonOptions(): int
    {
        return JSON_PRESERVE_ZERO_FRACTION;
    }
}
