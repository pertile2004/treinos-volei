<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Context;

/**
 * @property array{status: string, banco: string, versao: string, horario: string} $resource
 */
class SaudeResource extends JsonResource
{
    /**
     * @return array{status: string, banco: string, versao: string, horario: string}
     */
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->resource['status'],
            'banco' => $this->resource['banco'],
            'versao' => $this->resource['versao'],
            'horario' => $this->resource['horario'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        if ($this->disponivel()) {
            return [];
        }

        return [
            'message' => 'Banco de dados indisponível.',
            'request_id' => Context::get('request_id'),
        ];
    }

    public function withResponse(Request $request, JsonResponse $response): void
    {
        if (! $this->disponivel()) {
            $response->setStatusCode(JsonResponse::HTTP_SERVICE_UNAVAILABLE);
        }
    }

    private function disponivel(): bool
    {
        return $this->resource['status'] === 'ok';
    }
}
